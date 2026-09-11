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
import downloadIcon from '../assets/download.svg'

import cameraIcon from '../assets/poi/camera.svg'

import trails from "../offline-data/trails.json";
import photoSpheres from "../offline-data/photo-spheres.json";

import getTrailBounds from '../functions/trailBounds';
import downloadGPX from '../functions/downloadGPX';
import calculateDuration from '../functions/calculateDuration';
import trailTypes from '../trailTypes';

import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";

function TrailPage() {

    const { slug } = useParams();
    const trail = trails.find(t => slugify(t.name) === slug);
    const navigate = useNavigate();

    const [geojson, setGeojson] = useState(null);
    const [elevationData, setElevationData] = useState(null);
    const [hoverInfo, setHoverInfo] = useState(null);
    const [panoramaIdx, setPanoramaIdx] = useState(null);
    const [flyToLocation, setFlyToLocation] = useState(null);
    const [activeView, setActiveView] = useState("default")

    const trailBounds = useMemo(() => getTrailBounds({ type: 'trail', object: trail }), [trail]);

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
        if (panoramaIdx == null) return;

        setFlyToLocation(photoSpheres[slug][panoramaIdx].coordinates.slice(0, 2));
    }, [panoramaIdx, slug]);

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
            series.push({ distance: 0, elevation: pts[0][2] ?? 0, coordinate: pts[0].slice(0, 2) });
            for (let i = 1; i < pts.length; i++) {
                const prev = pts[i - 1];
                const cur = pts[i];
                const d = calculateDistance(prev, cur);
                cum += d;
                series.push({ distance: cum, elevation: cur[2] ?? 0, coordinate: cur.slice(0, 2) });
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
            flyToLocation={flyToLocation}
            onMouseMove={(e) => {
                if (!geojson) return;

                const points = geojson.features.flatMap(f => {
                    const coords = f.geometry.coordinates;
                    return f.geometry.type === 'LineString'
                        ? coords
                        : coords.flat();
                });
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
                    latitude={image.coordinates[1]}
                    style={ panoramaIdx === index && activeView == "panorama" ? { zIndex: 2 } : { zIndex: 1 }}>
                        <img className={ panoramaIdx === index && activeView == "panorama" ? "marker-grow" : null} src={cameraIcon} style={{ width: 28, height: 28 }} onClick={() => {switchToPano(index)}} />
                </Marker>
            )}

            {hoverInfo && (
                <Marker
                    longitude={hoverInfo.longitude}
                    latitude={hoverInfo.latitude}
                    anchor="top"
                    style={{ zIndex: 3 }}>
                    <div
                        aria-hidden="true"
                        className="flex-column align-center justify-center"
                        style={{ margin: '-0.55rem 0 0 0'}}>
                        <div
                            style={{
                                width: 16,
                                height: 16,
                                backgroundColor: '#2b7a2b',
                                borderRadius: '50%',
                                border: '3px solid #ffffff',
                                boxShadow: '0 0 6px rgba(0,0,0,0.25)'
                            }}/>
                        <div
                            style={{
                                marginTop: '0.35rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '999px',
                                backgroundColor: 'rgba(255,255,255,0.95)',
                                border: '1px solid rgba(0,0,0,0.08)',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                color: '#1f2937',
                                whiteSpace: 'nowrap'
                            }}>
                            {Math.round(hoverInfo.elevation)} m
                        </div>
                    </div>
                </Marker>
            )}

            {/* Maximize/minimize toggle */}
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
        return { minHeight: '60vh', width: '100%' };
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
                        <ElevationProfile
                            data={elevationData}
                            height={80}
                            onHover={(point) => setHoverInfo(point ? {
                                longitude: point.coordinate[0],
                                latitude: point.coordinate[1],
                                elevation: point.elevation
                            } : null)}
                        />
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
                    <div className="flex-column" style={{ gap: "0.5rem"}}>
                        <div style={{ width: '100%', padding: '1rem' }}>

                            {elevationData && (
                                <div className="flex-row justify-space-between align-center reverse-on-stack">
                                    <div style={{width: "100%"}}>
                                        <h2>{trail.name}</h2>
                                        <p>{trailTypes[trail.category].label}</p>
                                    </div>
                                    <ElevationProfile
                                        data={elevationData}
                                        height={80}
                                        onHover={(point) => setHoverInfo(point ? {
                                            longitude: point.coordinate[0],
                                            latitude: point.coordinate[1],
                                            elevation: point.elevation
                                        } : null)}
                                    />
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
                                                    {trail.duration ? trail.duration : (trail.lengthKm ? calculateDuration(trail.lengthKm) : '—')}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex-row no-stack justify-start align-center" style={{ marginLeft: 30}}>
                                                    {trail.difficulty ? trailTypes[trail.difficulty].label : '—'}
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <hr/>
                                <h4>Reittikuvaus</h4>
                                <p>{trail.description}</p>
                                <h4>Huomiot reitiltä</h4>
                            <hr/>
                                <h4>Käyttäjien ilmoittamat huomiot reitiltä</h4>
                                <em>
                                    Käyttäjien ilmoittamat huomiot on tarkoitettu varjoittamaan muita reitinkäyttäjiä yllättävistä reitillä ilmenneistä esteistä, vaurioista tai muista asioista jotka vaikuttavat reitillä turvallisesti ajamiseen.
                                    <br/>
                                    <br/>
                                    Voit kommentoida tai poistaa toisten tekemiä huomioita, jos havaitset ettei tilanne ole enää ajankohtainen. Huomiot poistuvat automaattisesti 3kk kuluttua ilmoituksen tekemisestä.
                                </em>
                                <h4>Käyttäjien ilmoitukset</h4>
                                <div style={{ border: '2px solid #DD5D36', padding: 10, borderRadius: "0.25rem"}}>
                                    {/* TODO */}
                                </div>
                                <h4>Lähetä huomio reitistä</h4>
                                <em>Huomasitko reitillä jotain, mikä vaikuttaa reitin turvalliseen käyttöön? Lähetä ilmoitus tästä varoittaaksesi muita reitin käyttäjiä.</em>
                                <div style={{ backgroundColor: '#f5f0e9', margin: 10, padding: 10, borderRadius: "0.25rem" }}>
                                    <form style={{ fontSize: 12 }}>
                                        <p>Valitse seuraavista vaihtoehdoista tai kuvaile reitillä oleva ongelma:</p>

                                        <input type="radio" id="fallen-tree" name="note" value="fallen-tree"/>
                                        <label htmlFor="fallen-tree">Kaatunut puu</label><br/>
                                        
                                        <input type="radio" id="other-obstruction" name="note" value="other-obstruction"/>
                                        <label htmlFor="other-obstruction">Muu este</label><br/>

                                        <input type="radio" id="dangerous-hole" name="note" value="dangerous-hole"/>
                                        <label htmlFor="dangerous-hole">Vaarallinen kuoppa</label><br/>

                                        <input type="radio" id="flood" name="note" value="flood"/>
                                        <label htmlFor="flood">Reitti tulvii</label><br/>

                                        <input type="radio" id="overgrown" name="note" value="overgrown"/>
                                        <label htmlFor="overgrown">Reitti on kasvanut umpeen</label><br/>

                                        <input type="radio" id="other" name="note" value="other"/>
                                        <input type="text" id="other-text" name="other-text" placeholder="Muu huomio..." /><br/>

                                        <strong>Lisätiedot</strong>
                                        <textarea id="additional-info" name="additional-info" placeholder="Lisätietoja..." style={{ width: "100%", height: 80, marginTop: 5}}></textarea>
                                        <button type="submit" style={{ marginTop: 10, backgroundColor: '#5F793E', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none'}} disabled>Lähetä</button>
                                    </form>
                                </div>
                        </div>
                    </div>

                    {/* Back and download buttons */}
                    <div className='flex-row no-stack align-center justify-space-between top-menu'>
                        <img className='icon-button' src={backIcon} alt="Back" onClick={() => navigate('/')} />
                        <div className='flex-row no-stack align-center justify-center'
                            style={{
                                cursor: 'pointer',
                                backgroundColor: 'white',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '1rem',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                                zIndex: 1000}}
                            onClick={() => downloadGPX(trail, slug)}>
                            <img style={{ width: 16, marginRight: 6 }} src={downloadIcon} alt="Download" />
                            GPX
                        </div>
                    </div>
                </>
            )}
        </>
    )
}

export default TrailPage;