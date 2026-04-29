import { Map, Layer, Source, Popup, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useState } from 'react';

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

/*  TODO: Show the start and end points with for example a flag icon
    Add a histogram of elevation
*/

// const types = ["fill", "line", "symbol", "circle", "heatmap", "fill-extrusion", "raster", "hillshade", "color-relief", "background"];

function TrailView({ trail }) {

    const [geojson, setGeojson] = useState(null);
    const [elevationRange, setElevationRange] = useState([0, 0]);
    const [colorScale, setColorScale] = useState(() => () => '#000');
    const [hoverInfo, setHoverInfo] = useState(null);

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
                const coords = feature.geometry.type === 'MultiLineString'
                    ? feature.geometry.coordinates.flat()
                    : feature.geometry.coordinates;

                for (let i = 0; i < coords.length - 1; i++) {
                    const start = coords[i];
                    const end = coords[i + 1];

                    const elevation = (start[2] + end[2]) / 2;

                    segments.push({
                    type: 'Feature',
                    properties: { elevation },
                    geometry: {
                        type: 'LineString',
                        coordinates: [start, end]
                    }
                    });
                }

                return segments;
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
                        aspectRatio: "4/3",
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
                        aspectRatio: "4/3",
                        padding: "1rem",
                        borderRadius: "1rem",
                        }}
                        >
                            <h2>Reittitiedot</h2>
                            <p><strong>Pituus:</strong> {trail.lengthKm} km</p>
                            <p><strong>Vaativuus:</strong> {trail.difficulty}</p>
                            <Map
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

                                            // Color by elevation
                                            'line-color': [
                                            'interpolate',
                                            ['linear'],
                                            ['get', 'elevation'],
                                            elevationRange[0], '#0000ff',     // low (blue)
                                            elevationRange[0] + (elevationRange[1] - elevationRange[0]) * 0.25, '#00ffff',
                                            elevationRange[0] + (elevationRange[1] - elevationRange[0]) * 0.5, '#ffff00',
                                            elevationRange[0] + (elevationRange[1] - elevationRange[0]) * 0.75, '#ff0000',
                                            elevationRange[1], '#d7191c'    // high (red)
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
                        </div>
                    </div>
                </div>
            </div>
    )
}

export default TrailView;