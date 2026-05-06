import { Map, Layer, Source, Popup, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useState } from 'react';

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

//  TODO: Show the start and end points with for example a flag icon

// const types = ["fill", "line", "symbol", "circle", "heatmap", "fill-extrusion", "raster", "hillshade", "color-relief", "background"];

function TrailView({ trail }) {

    const [geojson, setGeojson] = useState(null);
    const [elevationRange, setElevationRange] = useState([0, 0]);
    const [hoverInfo, setHoverInfo] = useState(null);
    const [elevationProfile, setElevationProfile] = useState([]);
    const [routeColors, setRouteColors] = useState({});

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
        setGeojson(newGeojsonData);
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
        
        setRouteColors(colorMap);
        setElevationProfile(profiles);
            
    }, [trail]);

    const initialTrailCoordinate = trail.geometry.type === 'LineString'
        ? trail.geometry.coordinates[0]
        : trail.geometry.coordinates[0]?.[0];
    
    return (
            <div className="flex-row" style={{ gap: "2rem"}}>
                
                <div style={{ flex: 1 }}>
                    <div>
                        <div
                        className="flex-column justify-start secondary"
                        style={{
                        width: "100%",
                        padding: "1rem",
                        borderRadius: "1rem",
                        }}
                        >
                            <h1>{trail.name}</h1>
                            <p>{trail.description}</p>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1 }}>
                    <div>
                        <div
                        className="flex-column justify-center align-center secondary"
                        style={{
                        width: "100%",
                        padding: "1rem",
                        borderRadius: "1rem",
                        }}
                        >
                            <h2>Reittitiedot</h2>
                            <p><strong>Pituus:</strong> {trail.lengthKm} km</p>
                            <p><strong>Vaativuus:</strong> {trail.difficulty}</p>
                            <Map
                                style={{
                                    minHeight: "30rem",
                                    width: "100%",
                                }}
                                interactiveLayerIds={['route-line']}
                                initialViewState={{
                                    longitude: initialTrailCoordinate?.[0],
                                    latitude: initialTrailCoordinate?.[1],
                                    zoom: 14
                                }}
                                mapStyle={`https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_API_KEY}`}
                                onMouseMove={(e) => {
                                    if (!geojson) return;

                                    const points = geojson.features.flatMap(f => {
                                        const coords = f.geometry.coordinates;
                                        return f.geometry.type === 'LineString'
                                            ? coords
                                            : coords.flat();
                                    });

                                    const nearest = getNearestPoint(e.lngLat, points);

                                    if (nearest) {
                                        setHoverInfo({
                                        longitude: nearest[0],
                                        latitude: nearest[1],
                                        elevation: nearest[2]
                                        });
                                    } else {
                                        setHoverInfo(null);
                                    }
                                }}>
                                <Source id='route' type='geojson' data={geojson}>
                                    <Layer
                                    id='route-line'
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

                                {hoverInfo && (
                                <>
                                    <Marker
                                    longitude={hoverInfo.longitude}
                                    latitude={hoverInfo.latitude}
                                    anchor="center"
                                    >
                                    <div
                                        style={{
                                        width: 20,
                                        height: 20,
                                        background: '#333333',
                                        borderRadius: '50%',
                                        border: '2px solid white',
                                        }}
                                    />
                                    </Marker>


                                    <Popup
                                        longitude={hoverInfo.longitude}
                                        latitude={hoverInfo.latitude}
                                        closeButton={false}
                                        closeOnClick={false}
                                        offset={10}
                                    >
                                        <div>
                                        <strong>Korkeus:</strong> {Math.round(hoverInfo.elevation)} m
                                        </div>
                                    </Popup>
                                </>
                                )}
                                
                            </Map>
                            <h3>Korkeusprofiili</h3>
                            {elevationProfile.length > 0 ? (
                                <svg
                                className="flex-column justify-center align-center"
                                style={{
                                width: "100%",
                                height: "100%",
                                }}
                                >
                                    {(() => {
                                        const width = 800;
                                        const height = 200;
                                        const padding = 40;
                                        const maxDist = Math.max(...elevationProfile.flat().map(p => p.distance));
                                        const [minElev, maxElev] = elevationRange;
                                        const elevRange = maxElev - minElev || 1;
                                        
                                        return (
                                            <>
                                                {elevationProfile.map((profileData, routeIdx) => {
                                                    const points = profileData.map(p => ({
                                                        x: padding + (p.distance / maxDist) * (width - 2 * padding),
                                                        y: height - padding - ((p.elevation - minElev) / elevRange) * (height - 2 * padding)
                                                    }));
                                                    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                                                    return (
                                                        <path key={`route-${routeIdx}`} d={pathData} stroke={routeColors[routeIdx]} strokeWidth="2" fill="none" />
                                                    );
                                                })}
                                                
                                                {/* X-axis */}
                                                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#333" strokeWidth="1" />
                                                
                                                {/* Y-axis */}
                                                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#333" strokeWidth="1" />
                                                
                                                {/* X-axis label */}
                                                <text x={width / 2} y={height - 5} textAnchor="middle" fontSize="12" fill="#666">
                                                    Matka (km)
                                                </text>
                                                
                                                {/* Y-axis label */}
                                                <text x="15" y={height / 2} textAnchor="middle" fontSize="12" fill="#666" transform={`rotate(-90 15 ${height / 2})`}>
                                                    Korkeus (m)
                                                </text>
                                                
                                                {/* Tick marks and labels */}
                                                {[0, 0.25, 0.5, 0.75, 1].map(frac => (
                                                    <g key={`x-${frac}`}>
                                                        <line 
                                                            x1={padding + frac * (width - 2 * padding)} 
                                                            y1={height - padding} 
                                                            x2={padding + frac * (width - 2 * padding)} 
                                                            y2={height - padding + 5} 
                                                            stroke="#333" 
                                                            strokeWidth="1" 
                                                        />
                                                        <text 
                                                            x={padding + frac * (width - 2 * padding)} 
                                                            y={height - padding + 18} 
                                                            textAnchor="middle" 
                                                            fontSize="11" 
                                                            fill="#666"
                                                        >
                                                            {(frac * maxDist).toFixed(1)}
                                                        </text>
                                                    </g>
                                                ))}
                                                
                                                {[0, 0.25, 0.5, 0.75, 1].map(frac => (
                                                    <g key={`y-${frac}`}>
                                                        <line 
                                                            x1={padding - 5} 
                                                            y1={height - padding - frac * (height - 2 * padding)} 
                                                            x2={padding} 
                                                            y2={height - padding - frac * (height - 2 * padding)} 
                                                            stroke="#333" 
                                                            strokeWidth="1" 
                                                        />
                                                        <text 
                                                            x={padding - 10} 
                                                            y={height - padding - frac * (height - 2 * padding) + 4} 
                                                            textAnchor="end" 
                                                            fontSize="11" 
                                                            fill="#666"
                                                        >
                                                            {Math.round(minElev + frac * elevRange)}
                                                        </text>
                                                    </g>
                                                ))}
                                            </>
                                        );
                                    })()}
                                </svg>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                                    Ladataan korkeustietoja...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
    )
}

export default TrailView;