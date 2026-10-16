import json
import os
from pathlib import Path
from urllib.parse import quote

import requests
from dotenv import load_dotenv


ROOT = Path(__file__).resolve().parent.parent
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
    companies = post_datahub_query(BUSINESSES_QUERY, datahub_api_key).get("company", [])
    businesses = []

    for company in companies:
        business_id = company.get("businessEntity", {}).get("businessId")
        if business_id not in AFFILIATES:
            continue

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
    return post_datahub_query(CERTIFIED_PRODUCTS_QUERY, datahub_api_key)


def write_json(filename, data):
    output_path = ROOT / filename
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