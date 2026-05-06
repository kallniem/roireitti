// Lipas.fi avoin REST API
// Tyyppikoodit: 4411 = Maastopyöräilyreitti, 4412 = Pyöräilyreitti

const LIPAS_BASE = "https://lipas.fi/api/sports-sites/type";

const TYPE_CODES = {
  mtb: 4411,
  cycling: 4412,
};

const ROVANIEMI_CITY_CODE = 698;

async function fetchCategory(category) {
  const code = TYPE_CODES[category];

  const res = await fetch(`${LIPAS_BASE}/${code}?lang=fi`);
  if (!res.ok) {
    throw new Error(`Lipas ${category} (${code}) virhe ${res.status}`);
  }

  const data = await res.json();

  return data
    .filter((s) => s.location?.city?.["city-code"] === ROVANIEMI_CITY_CODE)
    .map((s) => {
      const features = s.location?.geometries?.features ?? [];
      const lines = [];

      for (const f of features) {
        const g = f.geometry;
        if (!g) continue;

        if (g.type === "LineString") {
          lines.push(g.coordinates);
        } else if (g.type === "MultiLineString") {
          g.coordinates.forEach((c) => lines.push(c));
        }
      }

      if (lines.length === 0) return null;

      const geometry =
        lines.length === 1
          ? { type: "LineString", coordinates: lines[0] }
          : { type: "MultiLineString", coordinates: lines };

      return {
        id: s["lipas-id"],
        name: s.name,
        category,
        lengthKm: s.properties?.["route-length-km"] ?? 0,
        description: s.comment,
        municipality: s.location?.city?.["city-name"] ?? "Rovaniemi",
        geometry,
      };
    })
    .filter((r) => r !== null);
}

export async function fetchRovaniemiBikeRoutes() {
  const [mtb, cycling] = await Promise.all([
    fetchCategory("mtb").catch((e) => {
      console.error(e);
      return [];
    }),
    fetchCategory("cycling").catch((e) => {
      console.error(e);
      return [];
    }),
  ]);

  return [...cycling, ...mtb].sort((a, b) =>
    a.name.localeCompare(b.name, "fi")
  );
}

async function fetchNatureSpots() {
  const res = await fetch("https://lipas.fi/geoserver/lipas/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=lipas:lipas_301_laavu_kota_kammi&srsName=EPSG:4326&outputFormat=application/json")
  return
}