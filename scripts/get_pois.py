import requests
import json

url = "https://api.lipas.fi/v2/lois?page=1&page-size=100&statuses=active&statuses=out-of-service-temporarily"

response = requests.get(url)
data = response.json()
all_pois = data["items"]

total_pages = data["pagination"]["total-pages"]
for page in range(2, total_pages + 1):
    response = requests.get(f"https://api.lipas.fi/v2/lois?page={page}&page-size=100&statuses=active&statuses=out-of-service-temporarily")
    data = response.json()
    all_pois.extend(data["items"])
    print(f"Fetched page {page}/{total_pages}")
    print(f"Total POIs so far: {len(all_pois)}")


with open("pois.json", "w") as f:
    json.dump(all_pois, f, indent=2)