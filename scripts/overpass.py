import json
from pathlib import Path

import requests


ROOT = Path(__file__).resolve().parent.parent
OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter"
ROVANIEMI_BBOX = [66.1, 25.5, 66.8, 26.3]


def build_overpass_query():
    bbox = ",".join(map(str, ROVANIEMI_BBOX))
    return f"""
[out:json][timeout:25];
(
  node["tourism"~"attraction|viewpoint|information|museum|artwork|gallery"]({bbox});
  way["tourism"~"attraction|viewpoint|information|museum|artwork|gallery"]({bbox});
  relation["tourism"~"attraction|viewpoint|information|museum|artwork|gallery"]({bbox});
  node["historic"~"monument|memorial"]({bbox});
  way["historic"~"monument|memorial"]({bbox});
  relation["historic"~"monument|memorial"]({bbox});
  node["leisure"~"park|garden|picnic_table|recreation_ground"]({bbox});
  way["leisure"~"park|garden|picnic_table|recreation_ground"]({bbox});
  relation["leisure"~"park|garden|picnic_table|recreation_ground"]({bbox});
  node["natural"="beach"]({bbox});
  way["natural"="beach"]({bbox});
  relation["natural"="beach"]({bbox});
  node["amenity"="parking"]({bbox});
  way["amenity"="parking"]({bbox});
  relation["amenity"="parking"]({bbox});
  node["tourism"="picnic_site"]({bbox});
  way["tourism"="picnic_site"]({bbox});
  relation["tourism"="picnic_site"]({bbox});
);
out center tags;
"""


def _is_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def get_element_coordinates(element):
    if element.get("type") == "node":
        lat = element.get("lat")
        lon = element.get("lon")
        if _is_number(lat) and _is_number(lon):
            return [lon, lat]

    center = element.get("center") or {}
    lat = center.get("lat")
    lon = center.get("lon")
    if _is_number(lat) and _is_number(lon):
        return [lon, lat]

    return None


def normalize_category(tags):
    if not tags:
        return "poi"
    if tags.get("amenity") == "parking":
        return "parking"
    if tags.get("natural") == "beach":
        return "beach"

    tourism = tags.get("tourism")
    if tourism in {
        "viewpoint",
        "attraction",
        "information",
        "museum",
        "artwork",
        "gallery",
        "picnic_site",
    }:
        return "park" if tourism == "picnic_site" else "sight"
    if tags.get("historic"):
        return "sight"

    leisure = tags.get("leisure")
    if leisure in {"park", "garden", "recreation_ground", "picnic_table"}:
        return "sight" if leisure == "picnic_table" else "park"
    if tags.get("natural"):
        return "sight"

    return "poi"


def build_properties(element):
    tags = element.get("tags") or {}
    category = normalize_category(tags)
    title = (
        tags.get("name")
        or tags.get("official_name")
        or tags.get("operator")
        or tags.get("source")
        or category
    )
    description_parts = [
        tags.get("description"),
        tags.get("image"),
        f"Wikipedia: {tags['wikipedia']}" if tags.get("wikipedia") else None,
        f"Wikidata: {tags['wikidata']}" if tags.get("wikidata") else None,
    ]
    description = " • ".join(part for part in description_parts if part)
    description = description or tags.get("tourism") or tags.get("leisure") or tags.get("historic") or tags.get("natural") or "Point of interest"

    return {
        "id": f"{element['type']}-{element['id']}",
        "title": title,
        "description": description,
        "category": category,
        "data_source": "OpenStreetMap / Overpass",
        "osm_type": element["type"],
        "osm_id": element["id"],
        "raw_tags": tags,
    }


def fetch_overpass_pois():
    response = requests.post(
        OVERPASS_ENDPOINT,
        data={"data": build_overpass_query()},
        headers={"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"},
        timeout=120,
    )
    response.raise_for_status()
    data = response.json()
    features = []

    for element in data.get("elements", []):
        coordinates = get_element_coordinates(element)
        if coordinates is None:
            continue
        features.append(
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": coordinates},
                "properties": build_properties(element),
            }
        )

    return {"type": "FeatureCollection", "features": features}


def main():
    output_path = ROOT / "overpass-pois.json"
    data = fetch_overpass_pois()
    with output_path.open("w", encoding="utf-8") as output:
        json.dump(data, output, indent=2, ensure_ascii=False)
    print(f"Wrote {len(data['features'])} features to {output_path}")


if __name__ == "__main__":
    main()