import json
import os
from pathlib import Path
from urllib.parse import quote

import requests
from dotenv import load_dotenv


ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT / "src" / "offline-data"
DATAHUB_ENDPOINT = "https://api.businessfinland.fi/traveldatahub"
MAPTILER_ENDPOINT = "https://api.maptiler.com/geocoding"
AFFILIATES = {
    "3348558-5",
    "3136431-7",
    "2448061-9",
    "0357771-0",
    "2640679-7",
    "2931081-9",
    "2514272-6",
    "0892158-4",
    "2899280-6",
}

BUSINESSES_QUERY = """
query GetCompaniesInRovaniemi {
  company(where: {postalAddresses: {city: {_eq: "Rovaniemi"}}}) {
    id
    businessEntity {
      businessId
    }
    businessName
    officialName
    description
    logoThumbnailUrl
    logoUrl
    postalAddresses {
      city
      postalCode
      streetName
      location
    }
    contactDetails {
      email
      phone
    }
    webshopUrl
    websiteUrl
    businessHours {
      default {
        closes
        open
        opens
        weekday
      }
    }
    socialMedia {
      socialMediaLinks {
        linkType
        verifiedLink {
          url
        }
      }
    }
  }
}
"""

CERTIFIED_PRODUCTS_QUERY = """
query WelcomeCyclistCertifiedProducts {
  certificate {
    name
  }
  product(
    where: {
      productCertificates: { certificate: { _eq: "welcome_cyclist_certificate" } }
      postalAddresses: { city: { _eq: "Rovaniemi" } }
    }
  ) {
    id
    type
    urlPrimary
    webshopUrlPrimary
    contactDetails {
      email
      phone
    }
    productCertificates {
      certificate
    }
    productImages {
      id
      altText
      coverPhoto
      largeUrl
      originalUrl
      thumbnailUrl
      orderIndex
      copyright
    }
    postalAddresses {
      id
      city
      postalCode
      streetName
      location
    }
    company {
      id
      businessName
      officialName
      websiteUrl
    }
    productInformations {
      id
      language
      name
      description
    }
  }
}
"""


def post_datahub_query(query, api_key):
    response = requests.post(
        DATAHUB_ENDPOINT,
        headers={
            "Content-Type": "application/json",
            "ocp-apim-subscription-key": api_key,
        },
        json={"query": query},
        timeout=60,
    )
    response.raise_for_status()
    result = response.json()
    if result.get("errors"):
        raise RuntimeError(f"DataHub GraphQL error: {result['errors']}")
    return result["data"]


def geocode_address(address, api_key):
    url = f"{MAPTILER_ENDPOINT}/{quote(address, safe='')}.json"
    response = requests.get(url, params={"key": api_key}, timeout=30)
    response.raise_for_status()
    features = response.json().get("features", [])
    if not features:
        return None

    coordinates = features[0].get("geometry", {}).get("coordinates")
    if (
        isinstance(coordinates, list)
        and len(coordinates) >= 2
        and all(isinstance(value, (int, float)) for value in coordinates[:2])
    ):
        return coordinates[:2]
    return None


def fetch_businesses(datahub_api_key, maptiler_api_key):

    # get existing records
    with open(OUTPUT_DIR / "businesses.json", "r", encoding="utf-8") as f:
        existing_data = json.load(f)
    print(f"Loaded {len(existing_data)} existing businesses from businesses.json")

    
    companies = post_datahub_query(BUSINESSES_QUERY, datahub_api_key).get("company", [])
    businesses = []

    for company in companies:
        business_id = company.get("businessEntity", {}).get("businessId")

        # This is something that isn't in the DataHub data, but we want to keep it for our own purposes
        company["data_source"] = "Visit Finland DataHub, OpenStreetMap"
        for existing_company in existing_data:
            if existing_company.get("businessEntity", {}).get("businessId") == business_id:
                company["category"] = existing_company.get("category")
                print(f"Found existing category for {company.get('businessName', business_id)}: {company.get('category')}")
                break
            # otherwise check for words like "hotel", "hostel", "restaurant", etc. in the business name and assign a category based on that
        if "category" not in company:
            name = company.get("businessName", "").lower()
            if any(word in name for word in ["hotel", "hostel", "motel", "inn", "lodge", "resort", "villa"]):
                company["category"] = "accommodation"
            elif any(word in name for word in ["restaurant", "cafe", "café", "bar", "pub"]):
                company["category"] = "food_and_drink"
            elif any(word in name for word in ["bike", "bicycle", "cycle", "cycling"]):
                company["category"] = "bike_shop"
            elif any(word in name for word in ["tour", "tours", "guide", "safari", "safaris", "adventure"]):
                company["category"] = "activity"
            print(f"Assigned category for {company.get('businessName', business_id)}: {company.get('category')}")

        addresses = company.get("postalAddresses") or []
        if addresses:
            address = addresses[0]
            formatted_address = " ".join(
                value
                for value in (
                    address.get("streetName"),
                    address.get("postalCode"),
                    address.get("city"),
                )
                if value
            )
            company["coordinates"] = geocode_address(
                formatted_address, maptiler_api_key
            )
            if company["coordinates"]:
                print(f"Fetched coordinates for {company.get('businessName', business_id)}")
            else:
                print(f"No geocoding result for {company.get('businessName', business_id)}")
        else:
            company["coordinates"] = None
            print(f"Company {company.get('businessName', business_id)} has no postal address")

        businesses.append(company)

    return businesses


def fetch_certified_products(datahub_api_key):
  data = post_datahub_query(CERTIFIED_PRODUCTS_QUERY, datahub_api_key)
  return data.get("product", [])


def write_json(filename, data):
    output_path = OUTPUT_DIR / filename
    with output_path.open("w", encoding="utf-8") as output:
        json.dump(data, output, indent=2, ensure_ascii=False)
    print(f"Wrote {output_path}")


def main():
    load_dotenv(ROOT / ".env")
    datahub_api_key = os.getenv("VITE_TRAVELDATAHUB_API_KEY")
    maptiler_api_key = os.getenv("VITE_MAPTILER_API_KEY")
    if not datahub_api_key:
        raise SystemExit("Missing VITE_TRAVELDATAHUB_API_KEY in .env")
    if not maptiler_api_key:
        raise SystemExit("Missing VITE_MAPTILER_API_KEY in .env")

    businesses = fetch_businesses(datahub_api_key, maptiler_api_key)
    products = fetch_certified_products(datahub_api_key)
    write_json("businesses.json", businesses)
    write_json("cyclist-certified-products.json", products)


if __name__ == "__main__":
    main()