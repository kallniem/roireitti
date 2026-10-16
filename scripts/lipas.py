import json
from pathlib import Path

import requests


ROOT = Path(__file__).resolve().parent.parent
LIPAS_BASE = "https://lipas.fi/api/sports-sites/type"
NATURE_SPOTS_URL = "https://lipas.fi/geoserver/lipas/ows"
TYPE_CODES = {"mtb": 4411, "cycling": 4412}
ROVANIEMI_CITY_CODE = 698


def fetch_category(category):
    code = TYPE_CODES[category]
    response = requests.get(f"{LIPAS_BASE}/{code}", params={"lang": "fi"}, timeout=60)
    response.raise_for_status()
    data = response.json()
    routes = []

    for site in data:
        location = site.get("location") or {}
        city = location.get("city") or {}
        if city.get("city-code") != ROVANIEMI_CITY_CODE:
            continue

        geometries = location.get("geometries") or {}
        features = geometries.get("features") or []
        lines = []
        for feature in features:
            geometry = feature.get("geometry") or {}
            if geometry.get("type") == "LineString":
                lines.append(geometry.get("coordinates"))
            elif geometry.get("type") == "MultiLineString":
                lines.extend(geometry.get("coordinates") or [])

        lines = [line for line in lines if line]
        if not lines:
            continue

        geometry = (
            {"type": "LineString", "coordinates": lines[0]}
            if len(lines) == 1
            else {"type": "MultiLineString", "coordinates": lines}
        )
        properties = site.get("properties") or {}
        routes.append(
            {
                "id": site.get("lipas-id"),
                "name": site.get("name"),
                "category": category,
                "lengthKm": properties.get("route-length-km") or 0,
                "description": site.get("comment"),
                "municipality": city.get("city-name") or "Rovaniemi",
                "geometry": geometry,
            }
        )

    return routes


def fetch_rovaniemi_bike_routes():
    routes = []
    for category in ("cycling", "mtb"):
        try:
            routes.extend(fetch_category(category))
        except (requests.RequestException, ValueError, KeyError) as error:
            print(f"Failed to fetch Lipas {category} routes: {error}")

    return sorted(routes, key=lambda route: (route.get("name") or "").casefold())


def fetch_nature_spots():
    params = {
        "service": "WFS",
        "version": "1.0.0",
        "request": "GetFeature",
        "typeName": "lipas:lipas_301_laavu_kota_kammi",
        "srsName": "EPSG:4326",
        "outputFormat": "application/json",
    }
    response = requests.get(NATURE_SPOTS_URL, params=params, timeout=60)
    response.raise_for_status()
    return response.json()


def write_json(filename, data):
    output_path = ROOT / filename
    with output_path.open("w", encoding="utf-8") as output:
        json.dump(data, output, indent=2, ensure_ascii=False)
    print(f"Wrote {output_path}")


def main():
    write_json("lipas-routes.json", fetch_rovaniemi_bike_routes())
    write_json("lipas-nature-spots.json", fetch_nature_spots())


if __name__ == "__main__":
    main()