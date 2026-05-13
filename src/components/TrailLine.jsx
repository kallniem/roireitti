import { useEffect, useState } from "react";
import { Source, Layer, Marker, Popup } from "react-map-gl/maplibre";

function TrailLine({ trail, index }) {

    const [geojson, setGeojson] = useState(null);
    const [elevationRange, setElevationRange] = useState([0, 0]);
    const [hoverInfo, setHoverInfo] = useState(null);
    const [elevationProfile, setElevationProfile] = useState([]);
    const [routeColors, setRouteColors] = useState({});
    const [viewState, setViewState] = useState({
        zoom: 14,
        longitude: 25.7294,
        latitude: 66.5039,
    })

    const colors = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#a65628', '#f781bf', '#999999'];

    const getNearestPoint = (lngLat, points) => {
        // This needs to work for extreme latitudes, so treat each point as a point on a sphere rather than using simple Cartesian distance
        const R = 6371; // Earth radius in km
        const toRadians = (deg) => deg * Math.PI / 180;
        const latRad = toRadians(lngLat.lat);
        const lngRad = toRadians(lngLat.lng);
        let nearest = null;
        let nearestDist = Infinity;
        for (const point of points) {
            const [plng, plat] = point;
            const platRad = toRadians(plat);
            const plngRad = toRadians(plng);
            const dLat = platRad - latRad;
            const dLng = plngRad - lngRad;
            const a = Math.sin(dLat / 2) ** 2 + Math.cos(latRad) * Math.cos(platRad) * Math.sin(dLng / 2) ** 2;
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const dist = R * c;
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = point;
            }
        }
        
        if (nearestDist < 0.5) { // Only consider points within 500m
            return nearest;
        }
    }

    useEffect(() => {

            function splitIntoSegments(feature) {
                const segments = [];
                const isMulti = feature.geometry.type === 'MultiLineString';
                const lineStrings = isMulti
                    ? feature.geometry.coordinates
                    : [feature.geometry.coordinates];

                lineStrings.forEach((coords, routeIndex) => {
                    for (let i = 0; i < coords.length - 1; i++) {
                        const start = coords[i];
                        const end = coords[i + 1];
                        const elevation = (start[2] + end[2]) / 2;

                        segments.push({
                            type: 'Feature',
                            properties: { elevation, routeIndex },
                            geometry: {
                                type: 'LineString',
                                coordinates: [start, end]
                            }
                        });
                    }
                });

                return segments;
            }

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
            };

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

            const newGeojsonData = {
                type: 'FeatureCollection',
                features: geojsonData.features.flatMap(feature => {
                    if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
                        return splitIntoSegments(feature);
                    }
                    return feature;
                })
            };
            setElevationRange([
                Math.min(...newGeojsonData.features.map(f => f.properties.elevation)),
                Math.max(...newGeojsonData.features.map(f => f.properties.elevation))
                ]);

            // Calculate elevation profile for each route
            const isMulti = trail.geometry.type === 'MultiLineString';
            const lineStrings = isMulti
                ? trail.geometry.coordinates
                : [trail.geometry.coordinates];
            
            const profiles = [];
            const colorMap = {};
            
            lineStrings.forEach((coords, routeIndex) => {
                colorMap[routeIndex] = colors[routeIndex % colors.length];
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
            
            setGeojson(newGeojsonData);
            setRouteColors(colorMap);
            setElevationProfile(profiles);
            setViewState({
                longitude: newGeojsonData.features[0].geometry.coordinates[0][0],
                latitude: newGeojsonData.features[0].geometry.coordinates[0][1],
                zoom: 14
            })
            
    }, [trail]);


    return (
        <>
            <Source id={`route-${index}`} type='geojson' data={geojson}>
                <Layer
                id={`route-line-${index}`}
                type='line'
                paint={{
                        'line-width': 5,
                        'line-color': [
                            'case',
                            ...Object.entries(routeColors).flatMap(([routeIdx, color]) => [
                                ['==', ['get', 'routeIndex'], parseInt(routeIdx)],
                                color
                            ]),
                            '#999999'
                        ]
                    }}
                />
            </Source>
        </>
    )
}

export default TrailLine;