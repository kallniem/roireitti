import json
from pathlib import Path

import requests


OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.openstreetmap.fr/api/interpreter",
]
OUTPUT_FILE = Path(__file__).resolve().parent.parent / "swimming-areas.json"
ROVANIEMI_BBOX = [66.1, 25.5, 66.8, 26.3]


def build_query():
    bbox = ",".join(map(str, ROVANIEMI_BBOX))
    return f"""
[out:json][timeout:25];
(
  node["natural"="beach"]({bbox});
  way["natural"="beach"]({bbox});
  relation["natural"="beach"]({bbox});
  node["leisure"="swimming_area"]({bbox});
  way["leisure"="swimming_area"]({bbox});
  relation["leisure"="swimming_area"]({bbox});
);
out center tags;
"""


def get_coordinates(element):
    if element.get("type") == "node":
        lat = element.get("lat")
        lon = element.get("lon")
        if isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
            return [lon, lat]

    center = element.get("center") or {}
    lat = center.get("lat")
    lon = center.get("lon")
    if isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
        return [lon, lat]

    return None


def build_feature(element):
    coordinates = get_coordinates(element)
    if coordinates is None:
        return None

    tags = element.get("tags") or {}
    category = "beach" if tags.get("natural") == "beach" else "swimming_area"
    title = tags.get("name") or ("Beach" if category == "beach" else "Swimming area")
    description = " • ".join(
        value
        for value in (
            tags.get("description"),
            tags.get("note"),
            tags.get("official_name"),
            tags.get("operator"),
        )
        if value
    )

    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": coordinates,
        },
        "properties": {
            "id": f"{element['type']}-{element['id']}",
            "title": title,
            "description": description,
            "category": category,
            "data_source": "OpenStreetMap / Overpass",
            "osm_type": element["type"],
            "osm_id": element["id"],
            "tags": tags,
        },
    }


def fetch_overpass(url):
    response = requests.post(
        url,
        data={"data": build_query()},
        headers={
            "Accept": "application/json",
            "User-Agent": "roireitti-fetch-swimming-areas/1.0 (+https://github.com/roireitti)",
        },
        timeout=120,
    )
    if not response.ok:
        raise requests.HTTPError(
            f"Overpass request failed with {response.status_code} from {url}"
        )
    return response.json()


def fetch_swimming_areas():
    last_error = None

    for endpoint in OVERPASS_ENDPOINTS:
        try:
            data = fetch_overpass(endpoint)
            features = [
                feature
                for element in data.get("elements", [])
                if (feature := build_feature(element)) is not None
            ]
            return {"type": "FeatureCollection", "features": features}
        except (requests.RequestException, ValueError) as error:
            last_error = error
            print(f"Overpass endpoint failed: {endpoint} - {error}")

    raise last_error or RuntimeError("All Overpass endpoints failed")


def main():
    result = fetch_swimming_areas()
    with OUTPUT_FILE.open("w", encoding="utf-8") as output:
        json.dump(result, output, indent=2, ensure_ascii=False)
    print(f"Wrote {len(result['features'])} features to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()