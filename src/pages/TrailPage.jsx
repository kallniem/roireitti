import { Map, Layer, Source, Popup, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useState } from 'react';
import MapView from '../components/MapView';
import slugify from '../functions/slugify';
import trails from "../offline-data/trails.json";
import { useParams } from 'react-router';
import TrailLine from '../components/TrailLine';
import ElevationProfile from '../components/ElevationProfile';

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;


const typeLabels = {
    mtb: "Maastopyöräilyreitit",
    cycling: "Pyöräilyreitit",
}

//  TODO: Show the start and end points with for example a flag icon

// const types = ["fill", "line", "symbol", "circle", "heatmap", "fill-extrusion", "raster", "hillshade", "color-relief", "background"];

function TrailPage() {

    const { slug } = useParams();
    const trail = trails.find(t => slugify(t.name) === slug);

    const [geojson, setGeojson] = useState(null);
    const [elevationData, setElevationData] = useState(null);
    const [hoverInfo, setHoverInfo] = useState(null);
    const [viewState, setViewState] = useState({
        zoom: 14,
        longitude: 25.7294,
        latitude: 66.5039,
    })

    const colors = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#a65628', '#f781bf', '#999999'];

    const getTrailEndpoints = (geometry) => {
        if (!geometry) return [];

        const lineStrings = geometry.type === 'MultiLineString'
            ? geometry.coordinates
            : [geometry.coordinates];

        const start = lineStrings[0]?.[0];
        const lastLine = lineStrings[lineStrings.length - 1] ?? [];
        const end = lastLine[lastLine.length - 1];

        if (!start || !end) return [];

        const samePoint = start[0] === end[0] && start[1] === end[1];

        if (samePoint) {
            return [{ type: 'both', coordinate: start }];
        }

        return [
            { type: 'start', coordinate: start },
            { type: 'end', coordinate: end }
        ];
    };

    const endpointMarkers = getTrailEndpoints(trail.geometry);

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

        // Build elevation series (distance in km, elevation in meters)
        const pts = [];
        const isMulti = trail.geometry.type === 'MultiLineString';
        const lineStrings = isMulti ? trail.geometry.coordinates : [trail.geometry.coordinates];
        lineStrings.forEach(ls => {
            ls.forEach(coord => pts.push(coord));
        });

        const series = [];
        let cum = 0;
        if (pts.length > 0) {
            series.push({ distance: 0, elevation: pts[0][2] ?? 0 });
            for (let i = 1; i < pts.length; i++) {
                const prev = pts[i - 1];
                const cur = pts[i];
                const d = calculateDistance(prev, cur);
                cum += d;
                series.push({ distance: cum, elevation: cur[2] ?? 0 });
            }
        }
        setElevationData(series);

        
        setViewState({
            longitude: newGeojsonData.features[0].geometry.coordinates[0][0],
            latitude: newGeojsonData.features[0].geometry.coordinates[0][1],
            zoom: 14
        })
            
    }, [trail]);
    
    return (
            <>
                <nav className="breadcrumb">
                    <ol>
                        <li><span href="#">Reitit</span></li>
                            <>
                            <li><span href="#">{typeLabels[trail.category]}</span></li>
                            <li><span aria-label="Current page" href="#">{trail.name}</span></li>
                            </>
                    </ol>
                </nav>
            
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
                                {elevationData && (
                                    <div style={{ width: '100%', marginTop: '1rem' }}>
                                        <h3 style={{ margin: '0 0 0.5rem 0' }}>Korkeusprofiili</h3>
                                        <ElevationProfile data={elevationData} />
                                    </div>
                                )}
                                <MapView
                                    {...viewState}
                                    onMove={evt => setViewState(evt.viewState)}
                                    style={{
                                        minHeight: "30rem",
                                        width: "100%",
                                    }}
                                    interactiveLayerIds={['route-line']}
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
                                    <TrailLine trail={trail} />
                                    {endpointMarkers.map((endpoint) => {
                                        const [lng, lat] = endpoint.coordinate;
                                        const label = endpoint.type === 'start' ? 'S' : endpoint.type === 'end' ? 'E' : 'S/E';
                                        const background = endpoint.type === 'start'
                                            ? '#4daf4a'
                                            : endpoint.type === 'end'
                                                ? '#e41a1c'
                                                : '#4f4f9f';

                                        return (
                                            <Marker
                                                key={`${endpoint.type}-${lng}-${lat}`}
                                                longitude={lng}
                                                latitude={lat}
                                                anchor="bottom"
                                            >
                                                <div
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                        borderRadius: '50%',
                                                        background,
                                                        color: '#fff',
                                                        border: '2px solid white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 700,
                                                        fontSize: '0.75rem',
                                                        boxShadow: '0 0 6px rgba(0,0,0,0.25)'
                                                    }}
                                                >
                                                    {label}
                                                </div>
                                            </Marker>
                                        );
                                    })}
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
                                </MapView>
                            </div>
                        </div>
                    </div>
                </div>
            </>
    )
}

export default TrailPage;