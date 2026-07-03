import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
];
const OUTPUT_FILE = fileURLToPath(new URL('../swimming-areas.json', import.meta.url));
const ROVANIEMI_BBOX = [66.1, 25.5, 66.8, 26.3];

function buildQuery() {
  return `
[out:json][timeout:25];
(
  node["natural"="beach"](${ROVANIEMI_BBOX.join(',')});
  way["natural"="beach"](${ROVANIEMI_BBOX.join(',')});
  relation["natural"="beach"](${ROVANIEMI_BBOX.join(',')});
  node["leisure"="swimming_area"](${ROVANIEMI_BBOX.join(',')});
  way["leisure"="swimming_area"](${ROVANIEMI_BBOX.join(',')});
  relation["leisure"="swimming_area"](${ROVANIEMI_BBOX.join(',')});
);
out center tags;
`;
}

function getCoordinates(element) {
  if (element.type === 'node' && typeof element.lat === 'number' && typeof element.lon === 'number') {
    return [element.lon, element.lat];
  }

  if (element.center && typeof element.center.lat === 'number' && typeof element.center.lon === 'number') {
    return [element.center.lon, element.center.lat];
  }

  return null;
}

function normalizeType(tags) {
  if (!tags) return 'swimming_area';
  if (tags.natural === 'beach') return 'beach';
  if (tags.leisure === 'swimming_area') return 'swimming_area';
  return 'swimming_area';
}

function buildFeature(element) {
  const coordinates = getCoordinates(element);
  if (!coordinates) return null;

  const tags = element.tags || {};
  const type = normalizeType(tags);
  const title = tags.name || (type === 'beach' ? 'Beach' : 'Swimming area');
  const description = [tags.description, tags.note, tags['official_name'], tags['operator']]
    .filter(Boolean)
    .join(' • ');

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates,
    },
    properties: {
      id: `${element.type}-${element.id}`,
      title,
      description: description || '',
      category: type,
      data_source: 'OpenStreetMap / Overpass',
      osm_type: element.type,
      osm_id: element.id,
      tags,
    },
  };
}

async function fetchOverpass(url) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'Accept': 'application/json',
      'User-Agent': 'roireitti-fetch-swimming-areas/1.0 (+https://github.com/roireitti)'
    },
    body: new URLSearchParams({ data: buildQuery() }).toString(),
    timeout: 120000,
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed with ${response.status} from ${url}`);
  }

  return response.json();
}

async function fetchSwimmingAreas() {
  let lastError;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const json = await fetchOverpass(endpoint);
      const features = (json.elements || [])
        .map(buildFeature)
        .filter(Boolean);

      return {
        type: 'FeatureCollection',
        features,
      };
    } catch (error) {
      lastError = error;
      console.warn(`Overpass endpoint failed: ${endpoint} — ${error.message}`);
    }
  }

  throw lastError || new Error('All Overpass endpoints failed');
}

async function main() {
  const result = await fetchSwimmingAreas();
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`Wrote ${result.features.length} features to ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
