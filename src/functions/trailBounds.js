export default function getTrailBounds(selected) {
    const trail = selected?.object;
    if (selected?.type !== 'trail' || !trail?.geometry) {
        return null;
    }

    const lineStrings = trail.geometry.type === 'MultiLineString'
        ? trail.geometry.coordinates
        : [trail.geometry.coordinates];

    const coordinates = lineStrings.flatMap((line) => line.map((coord) => [coord[0], coord[1]]));

    if (coordinates.length === 0) {
        return null;
    }

    const lngs = coordinates.map(([lng]) => lng);
    const lats = coordinates.map(([, lat]) => lat);

    return [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
    ];
}
