function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getTrackPoints(geometry) {
  if (!geometry) return [];

  const lineStrings = geometry.type === 'MultiLineString'
    ? geometry.coordinates
    : [geometry.coordinates];

  return lineStrings.flat().filter((coord) => Array.isArray(coord) && coord.length >= 2);
}

function downloadGPX(trail, slug) {
  if (!trail?.geometry) return;

  const trackPoints = getTrackPoints(trail.geometry);

  const trkptXml = trackPoints
    .map(([lon, lat, ele]) => {
      const elevation = Number.isFinite(ele) ? `<ele>${ele}</ele>` : '';
      return `    <trkpt lat="${lat}" lon="${lon}">
      ${elevation}
    </trkpt>`;
    })
    .join('\n');

  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="roireitti" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(trail.name)}</name>
  </metadata>
  <trk>
    <name>${escapeXml(trail.name)}</name>
    <trkseg>
${trkptXml}
    </trkseg>
  </trk>
</gpx>`;

  const blob = new Blob([gpx], { type: 'application/gpx+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${slug || 'trail'}.gpx`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export default downloadGPX;