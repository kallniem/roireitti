import { useEffect, useState } from "react";
import { Source, Layer, Marker, Popup } from "react-map-gl/maplibre";

function TrailLine({ trail, index, categoryColor = '#377eb8', isSelected = false, onSelect }) {
    const [geojson, setGeojson] = useState(null);
    const [elevationRange, setElevationRange] = useState([0, 0]);
    const [hoverInfo, setHoverInfo] = useState(null);
    const [elevationProfile, setElevationProfile] = useState([]);


    useEffect(() => {
            function calculateDistance(coord1, coord2) {
                const R = 6371; // Earth radius in km
                const toRadians = (deg) => deg * Math.PI / 180;
                const [lng1, lat1, elev1] = coord1;
                const [lng2, lat2, elev2] = coord2;

                const dLat = toRadians(lat2) - toRadians(lat1);
                const dLng = toRadians(lng2) - toRadians(lng1);
                const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const horizontalDist = R * c;

                // Include elevation change in distance
                const elevDiff = (elev2 - elev1) / 1000;
                return Math.sqrt(horizontalDist ** 2 + elevDiff ** 2);
            }

            if (!trail) {
                return;
            }

            const geojsonData = {
                type: "FeatureCollection",
                features: [
                    {
                        type: "Feature",
                        geometry: trail.geometry,
                        properties: {
                            name: trail.name
                        }
                    }
                ]
            };

            const lineStrings = trail.geometry.type === 'MultiLineString'
                ? trail.geometry.coordinates
                : [trail.geometry.coordinates];

            const elevations = lineStrings.flatMap(coords => coords.map(coord => coord[2] || 0));
            setElevationRange([
                Math.min(...elevations),
                Math.max(...elevations)
            ]);

            const profiles = [];
            lineStrings.forEach((coords, routeIndex) => {
                const profile = [];
                let cumulativeDistance = 0;

                for (let i = 0; i < coords.length; i++) {
                    if (i > 0) {
                        cumulativeDistance += calculateDistance(coords[i - 1], coords[i]);
                    }
                    profile.push({
                        distance: cumulativeDistance,
                        elevation: coords[i][2] || 0,
                        routeIndex
                    });
                }
                profiles.push(profile);
            });

            setGeojson(geojsonData);
            setElevationProfile(profiles);
    }, [trail]);


    if (!geojson) return null;

    return (
        <>
            <Source id={`route-${index}`} type='geojson' data={geojson}>
                <Layer
                    id={`route-line-halo-${index}`}
                    type='line'
                    paint={{
                        'line-width': isSelected ? 12 : 0,
                        'line-color': 'rgba(0,0,0,0.15)'
                    }}
                    layout={{
                        'line-cap': 'round',
                        'line-join': 'round'
                    }}
                />
                <Layer
                    id={`route-line-${index}`}
                    type='line'
                    paint={{
                        'line-width': isSelected ? 8 : 5,
                        'line-color': categoryColor,
                        'line-opacity': isSelected ? 1 : 0.9
                    }}
                    layout={{
                        'line-cap': 'round',
                        'line-join': 'round'
                    }}
                    onClick={() => { if (typeof onSelect === 'function') onSelect(); }}
                />
            </Source>
        </>
    )
}

export default TrailLine;