const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

// Rough bounding box around Rovaniemi, Finland.
const ROVANIEMI_BBOX = [66.1, 25.5, 66.8, 26.3];

function buildOverpassQuery() {
  return `
  [out:json][timeout:25];
  (
    node["tourism"~"attraction|viewpoint|information|museum|artwork|gallery"](${ROVANIEMI_BBOX.join(',')});
    way["tourism"~"attraction|viewpoint|information|museum|artwork|gallery"](${ROVANIEMI_BBOX.join(',')});
    relation["tourism"~"attraction|viewpoint|information|museum|artwork|gallery"](${ROVANIEMI_BBOX.join(',')});
    node["historic"~"monument|memorial"](${ROVANIEMI_BBOX.join(',')});
    way["historic"~"monument|memorial"](${ROVANIEMI_BBOX.join(',')});
    relation["historic"~"monument|memorial"](${ROVANIEMI_BBOX.join(',')});
    node["leisure"~"park|garden|picnic_table|recreation_ground"](${ROVANIEMI_BBOX.join(',')});
    way["leisure"~"park|garden|picnic_table|recreation_ground"](${ROVANIEMI_BBOX.join(',')});
    relation["leisure"~"park|garden|picnic_table|recreation_ground"](${ROVANIEMI_BBOX.join(',')});
    node["natural"="beach"](${ROVANIEMI_BBOX.join(',')});
    way["natural"="beach"](${ROVANIEMI_BBOX.join(',')});
    relation["natural"="beach"](${ROVANIEMI_BBOX.join(',')});
    node["amenity"="parking"](${ROVANIEMI_BBOX.join(',')});
    way["amenity"="parking"](${ROVANIEMI_BBOX.join(',')});
    relation["amenity"="parking"](${ROVANIEMI_BBOX.join(',')});
    node["tourism"="picnic_site"](${ROVANIEMI_BBOX.join(',')});
    way["tourism"="picnic_site"](${ROVANIEMI_BBOX.join(',')});
    relation["tourism"="picnic_site"](${ROVANIEMI_BBOX.join(',')});
  );
  out center tags;
  `;
}

function getElementCoordinates(element) {
  if (element.type === 'node' && typeof element.lat === 'number' && typeof element.lon === 'number') {
    return [element.lon, element.lat];
  }

  if (element.center && typeof element.center.lat === 'number' && typeof element.center.lon === 'number') {
    return [element.center.lon, element.center.lat];
  }

  return null;
}

function normalizeCategory(tags) {
  if (!tags) return 'poi';

  if (tags.amenity === 'parking') return 'parking';
  if (tags.natural === 'beach') return 'beach';
  if (tags.tourism) {
    const tourism = tags.tourism;
    if (['viewpoint', 'attraction', 'information', 'museum', 'artwork', 'gallery', 'picnic_site'].includes(tourism)) {
      return tourism === 'picnic_site' ? 'park' : 'sight';
    }
  }
  if (tags.historic) return 'sight';
  if (tags.leisure) {
    const leisure = tags.leisure;
    if (['park', 'garden', 'recreation_ground', 'picnic_table'].includes(leisure)) {
      return leisure === 'park' || leisure === 'garden' || leisure === 'recreation_ground' ? 'park' : 'sight';
    }
  }
  if (tags.natural) {
    return tags.natural === 'beach' ? 'beach' : 'sight';
  }

  return 'poi';
}

function buildProperties(element) {
  const tags = element.tags || {};
  const category = normalizeCategory(tags);
  const title = tags.name || tags['official_name'] || tags.operator || tags.source || category;
  const description = [
    tags.description,
    tags['image'],
    tags.wikipedia ? `Wikipedia: ${tags.wikipedia}` : null,
    tags.wikidata ? `Wikidata: ${tags.wikidata}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return {
    id: `${element.type}-${element.id}`,
    title,
    description: description || `${tags.tourism || tags.leisure || tags.historic || tags.natural || 'Point of interest'}`,
    category,
    data_source: 'OpenStreetMap / Overpass',
    osm_type: element.type,
    osm_id: element.id,
    raw_tags: tags,
  };
}

export async function fetchOverpassPois() {
  const response = await fetch(OVERPASS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: `data=${encodeURIComponent(buildOverpassQuery())}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API error ${response.status}`);
  }

  const data = await response.json();

  const features = (data.elements || [])
    .map((element) => {
      const coordinates = getElementCoordinates(element);
      if (!coordinates) return null;

      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates,
        },
        properties: buildProperties(element),
      };
    })
    .filter(Boolean);

  return {
    type: 'FeatureCollection',
    features,
  };
}
