import json
from math import asin, cos, radians, sin, sqrt

with open("src\huts.json", "r", encoding="utf8") as f:
    huts = json.load(f)
    pois = huts["features"]

center = [66.87891799542544, 23.69655105345897] # Rovaniemi center
radius_km = 180
filtered_pois = []

# Calculate distance using Haversine formula
def haversine(lon1, lat1, lon2, lat2):
    # convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    # haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371  # Radius of earth in kilometers
    return c * r

for poi in pois:
    geometry = poi["geometry"]
    if geometry["type"] == "Point":
        lon, lat = geometry["coordinates"]
        distance = haversine(center[0], center[1], lon, lat)
        if distance <= radius_km:
            filtered_pois.append(poi)


print(f"Total POIs: {len(pois)}, Filtered POIs: {len(filtered_pois)}")

with open("pois.json", "w", encoding="utf8") as f:
    json.dump(filtered_pois, f, indent=2)