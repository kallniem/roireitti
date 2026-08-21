import { Map, Layer, Source, Popup, Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useState, useMemo } from 'react';
import MapView from '../components/MapView';
import slugify from '../functions/slugify';
import { useNavigate, useParams } from 'react-router';
import TrailLine from '../components/TrailLine';
import ElevationProfile from '../components/ElevationProfile';

import rulerIcon from '../assets/ruler.svg';
import clockIcon from '../assets/clock.svg';
import gaugeLowIcon from '../assets/gauge-low.svg';

import panoramaIcon from '../assets/panorama.svg';
import fullScreenIcon from '../assets/full-screen.svg';
import minimizeIcon from '../assets/minimize.svg';
import backIcon from '../assets/back.svg'

import cameraIcon from '../assets/camera.svg'

import trails from "../offline-data/trails.json";
import photoSpheres from "../offline-data/photo-spheres.json";

import getTrailBounds from '../functions/trailBounds';

import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";

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
    const navigate = useNavigate();

    const [geojson, setGeojson] = useState(null);
    const [elevationData, setElevationData] = useState(null);
    const [hoverInfo, setHoverInfo] = useState(null);
    const [panoramaIdx, setPanoramaIdx] = useState(null);
    const [activeView, setActiveView] = useState("default")

    const trailBounds = useMemo(() => getTrailBounds({ type: 'trail', object: trail }), [trail]);

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

    const toggleView = (view) => {
        if (activeView == view) {
            setActiveView("default")
        } else {
            setActiveView(view)
        }
    }

    const switchToPano = (idx) => {
        setPanoramaIdx(idx)
        setActiveView("panorama")
    }

    const handlePanorama = (int) => {
        let newPanoramaIdx = panoramaIdx + int;
        if (newPanoramaIdx == photoSpheres[slug].length) {
            newPanoramaIdx = 0;
        };
        if (newPanoramaIdx == -1) {
            newPanoramaIdx = photoSpheres[slug].length -1;
        };
        setPanoramaIdx(newPanoramaIdx)
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
            
    }, [trail]);

    // Render the MapView once and change its container styles so it stays mounted
    const mapComponent = (
        <MapView
            interactiveLayerIds={['route-line']}
            fitBounds={trailBounds}
            duration={0}
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
                        anchor="center">
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
                            }}>
                            {label}
                        </div>
                    </Marker>
                );
            })}

            {photoSpheres[slug] && photoSpheres[slug].map((image, index) => 
                <Marker
                    key={index}
                    anchor="center"
                    longitude={image.coordinates[0]}
                    latitude={image.coordinates[1]}>
                        <img src={cameraIcon} style={{ width: 28, height: 28 }} onClick={() => {switchToPano(index)}} />
                </Marker>
            )}
            {panoramaIdx != null && activeView == "panorama" &&
                <Marker
                    key={photoSpheres[slug][panoramaIdx].name}
                    anchor="center"
                    longitude={photoSpheres[slug][panoramaIdx].coordinates[0]}
                    latitude={photoSpheres[slug][panoramaIdx].coordinates[1]}>
                    <img className="marker-grow" src={cameraIcon} style={{ width: 28, height: 28 }} />
                </Marker>
            }

            <div className='flex-row no-stack bottom-menu'>
                <div className='flex-column justify-center' onClick={() => toggleView('map')}>
                    <img className='icon-button' src={activeView == "map" ? minimizeIcon : fullScreenIcon} alt="Map view" />
                </div>
            </div>
        </MapView>
    );
    
    // Always render the map component so it stays mounted between view switches.
    // Change container styles depending on `activeView` to emulate full-screen, minimap, or normal layouts.
    const mapWrapperStyle = (() => {
        if (activeView === 'map') {
            return { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000 };
        }
        if (activeView === 'panorama') {
            return {
                position: 'absolute',
                bottom: '1rem',
                left: '1rem',
                width: 'clamp(280px, 35vw, 40rem)',
                height: 'clamp(280px, 35vw, 20rem)',
                zIndex: 900,
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                borderRadius: '0.5rem',
                overflow: 'hidden'
            };
        }
        return { height: '60vh', width: '100%' };
    })();

    return (
        <>
            {/* Map container - always mounted */}
            <div style={mapWrapperStyle}>
                {mapComponent}
                {activeView === 'map' && elevationData && (
                    <div style={{
                        display: 'block',
                        position: 'absolute',
                        width: 'clamp(15rem, 70vw, 50rem)',
                        backgroundColor: '#ffffff',
                        bottom: '0.5rem',
                        left: '0.5rem',
                        zIndex: 11,
                        borderRadius: '0.5rem',
                        overflow: 'hidden',
                    }}>
                        <ElevationProfile data={elevationData} height={80} />
                    </div>
                )}
            </div>

            {activeView === 'panorama' && (
                <>
                    <ReactPhotoSphereViewer
                        src={photoSpheres[slug][panoramaIdx].image}
                        height={"100%"}
                        width={"100%"}
                        navbar={false}
                        loadingTxt={"Ladataan..."}>
                    </ReactPhotoSphereViewer>
                    <div className='flex-column align-center justify-center' style={{
                            position: 'absolute',
                            top: '0.5rem',
                            width: '100%'}}>
                        <div className='flex-row no-stack align-center justify-center' style={{ gap: '1rem' }}>
                            <p style={{cursor: 'pointer'}} onClick={() => handlePanorama(-1)}>〈</p>
                            <p>{trail.name}</p>
                            <p style={{cursor: 'pointer'}} onClick={() => handlePanorama(1)}>〉</p>
                        </div>
                        <span><i>{photoSpheres[slug][panoramaIdx].name}</i></span>
                    </div>
                </>
            )}

            {activeView !== 'map' && activeView !== 'panorama' && (
                <>

                {/* Back button */}
                <div className='flex-column align-start justify-center' style={{
                        position: 'absolute',
                        top: '1rem',
                        left: '1rem'}}>
                    <img className='icon-button' src={backIcon} alt="Back" onClick={() => navigate('/')} />
                </div>

                <div className="flex-column" style={{ gap: "0.5rem"}}>
                    <div style={{ width: '100%', padding: '1rem' }}>

                        {elevationData && (
                            <div className="flex-row justify-space-between align-center reverse-on-stack">
                                <div style={{width: "100%"}}>
                                    <h2>{trail.name}</h2>
                                    <p>—</p>
                                </div>
                                <ElevationProfile data={elevationData} height={80} />
                            </div>
                        )}

                        <div className="flex-column align-center" style={{ width: '100%', padding: '1rem' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <td>
                                            <div className="flex-row no-stack justify-start align-center">
                                                <img src={rulerIcon} alt="Test" style={{ width: 24, marginRight: 6 }} />
                                                <strong>Pituus</strong>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex-row no-stack justify-start align-center">
                                                <img src={clockIcon} alt="Test" style={{ width: 24, marginRight: 6 }} />
                                                <strong>Kesto</strong>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex-row no-stack justify-start align-center">
                                                <img src={gaugeLowIcon} alt="Test" style={{ width: 24, marginRight: 6 }} />
                                                <strong>Vaikeusaste</strong>
                                            </div>
                                        </td>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <div className="flex-row no-stack justify-start align-center" style={{ marginLeft: 30}}>
                                                {trail.lengthKm ? `${trail.lengthKm} km` : '—'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex-row no-stack justify-start align-center" style={{ marginLeft: 30}}>
                                                {trail.duration ? trail.duration : '—'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex-row no-stack justify-start align-center" style={{ marginLeft: 30}}>
                                                {trail.difficulty ? trail.difficulty : '—'}
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div style={{ display: 'block', width: '100%', height: '1px', backgroundColor: 'black'}}></div>
                            <h4>Reittikuvaus</h4>
                            <p>{trail.description}</p>
                    </div>
                </div>
                </>
            )}
        </>
    )
}

function PhotoViewer({ images, onHighlightedImage }) {

    if (!images || images.length === 0) {
        return null;
    }

    const [selectedImage, setSelectedImage] = useState(images[0]);
    onHighlightedImage(selectedImage);

    const baseStyle = { flex: "1 1 calc(20% - 0.5rem)", minWidth: "100px", height: "100px", backgroundColor: "#ccc", borderRadius: "4px", border: "0.125rem solid transparent" };

    return (
        <>
        {/*
        <div className="flex-row no-stack" style={{ gap: "0.125rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {images.map((img, index) => (
                <div
                    key={index}
                    style={{
                            ...baseStyle,
                            ...(selectedImage === img ? {borderRadius: "4px", border: "0.125rem solid #ff7300", boxShadow: "0 0 5px #DB5C2F"} : {})
                        }}
                    onClick={() => {
                        setSelectedImage(img);
                        onHighlightedImage(img);
                    }}>
                    <img
                        src={img.image}
                        alt={img.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px" }}/>
                </div>
            ))}
        </div>
        */}
        <ReactPhotoSphereViewer
            src={selectedImage.image}
            height={"100%"}
            width={"100%"}
            navbar={false}
            minFov={80}
            loadingTxt={"Ladataan..."}>
        </ReactPhotoSphereViewer>
        </>
    )
}

export default TrailPage;