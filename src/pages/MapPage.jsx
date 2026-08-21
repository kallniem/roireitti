import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import MapView from '../components/MapView';
import TrailList from '../components/TrailList';
import trails from "../offline-data/trails.json";
import TrailLine from '../components/TrailLine';
import InfoCard from '../components/InfoCard';

import routeIcon from "../assets/route.svg"
import homeIcon from "../assets/home.svg"
import crossIcon from "../assets/cross.svg"
import { MapProvider } from 'react-map-gl/maplibre';
import PoiList from '../components/PoiList';
import getTrailBounds from '../functions/trailBounds';

const categoryColors = {
    mtb: '#377eb8',
    cycling: '#4daf4a',
}

function MapPage({ onMarkerClick }) {

    const navigateTo = useNavigate();

    const [selectedTrailIdx, setSelectedTrailIdx] = useState(null);
    const [viewState, setViewState] = useState({
        zoom: 14,
        longitude: 25.7294,
        latitude: 66.5039,
        pitch: 70,
    });
    const [filter, setFilter] = useState({
        type: '',
        length: 20,
        sort: 'shortest',
    });
    const [showMenu, setShowMenu] = useState(false)
    const [selected, setSelected] = useState({
        "object": null,
        "type": null
    })

    const selectedMarkerId = selected.type === 'marker' ? selected.object?.id : null;

    const trailBounds = useMemo(() => getTrailBounds(selected), [selected]);

    const handleFilterChange = (filters) => {
        console.log(filters);
        setFilter(filters);
    }

    const handleMapMove = (evt) => {
        setViewState(evt.viewState);
    }

    const handleMarkerSelect = (marker) => {
        setSelected({"object": marker, type: "marker"});
        setSelectedTrailIdx(null);
    }

    const filteredTrails = trails
        .map((trail, originalIndex) => ({ trail, originalIndex }))
        .filter(({ trail }) => trail.category === filter.type || filter.type === '');

    const interactiveLayerIds = [
        ...filteredTrails.map(({ originalIndex }) => `route-line-${originalIndex}`),
        'poi-unselected',
    ];

    const handleMapClick = (evt) => {
        const features = evt?.features;
        if (features && features.length > 0) {
            const layerId = features[0].layer?.id;
            if (layerId && layerId.startsWith('route-line-')) {
                const idx = parseInt(layerId.replace('route-line-', ''), 10);
                if (!Number.isNaN(idx)) {
                    setSelectedTrailIdx(idx);
                    setSelected({"object": trails[idx], type: "trail"});
                }
            }
        }
    }

    return (
        <div
            className="flex-column justify-center align-center"
            style={{
                width: "100%",
                height: "100%",
            }}
        >
            <MapProvider>
                <MapView
                    viewState={viewState}
                    onMove={handleMapMove}
                    onMapClick={handleMapClick}
                    onMarkerClick={(marker) => handleMarkerSelect(marker)}
                    selectedMarkerId={selectedMarkerId}
                    fitBounds={trailBounds}
                    interactiveLayerIds={interactiveLayerIds}>
                    
                    <div className='flex-column map-side-buttons'>
                        {!showMenu &&
                        <>
                            <div className='flex-column justify-center' onClick={() => {setShowMenu("trail")}}>
                                <img src={routeIcon} />
                            </div>
                            <div className='flex-column justify-center' onClick={() => {setShowMenu("poi")}}>
                                <img src={homeIcon} />
                            </div>
                        </>
                        }
                    </div>

                    {selected.object &&
                        <InfoCard key={`${selected.type}-${selected.object.id || selected.object.name}`} item={selected} onClose={() => setSelected({object: null, type: null})}/>
                    }

                    {showMenu == "trail" &&
                        <div className='flex-column side-menu'>
                                <div className='flex-row justify-space-between align-center no-stack' style={{gap: "1rem", padding: "0 0.5rem"}}>
                                    <div className='flex-row align-center no-stack' style={{gap: "1rem"}}>
                                        <img width="24" height="24" src={routeIcon} />
                                        <h2>Suodata reittejä</h2>
                                    </div>
                                    <img width="24" height="24" src={crossIcon} style={{ cursor: 'pointer'}} onClick={() => {setShowMenu(false)}} />
                                </div>
                                <TrailList trails={trails} filters={filter} onFilterChange={(filters) => handleFilterChange(filters)}/>
                        </div>
                    }

                    {showMenu == "poi" &&
                        <div className='flex-column side-menu'>
                                <div className='flex-row justify-space-between align-center no-stack' style={{gap: "1rem", padding: "0 0.5rem"}}>
                                    <div className='flex-row align-center no-stack' style={{gap: "1rem"}}>
                                        <img width="24" height="24" src={homeIcon} />
                                        <h2>Palvelut ja nähtävyydet</h2>
                                    </div>
                                    <img width="24" height="24" src={crossIcon} style={{ cursor: 'pointer'}} onClick={() => {setShowMenu(false)}} />
                                </div>
                                <PoiList />
                        </div>
                    }

                    {filteredTrails.map(({ trail, originalIndex }) => (
                        <TrailLine
                            key={originalIndex}
                            trail={trail}
                            index={originalIndex}
                            isSelected={selectedTrailIdx === originalIndex}
                            categoryColor={categoryColors[trail.category]}
                        />
                    ))}
                </MapView>
            </MapProvider>
        </div>
    );
}

export default MapPage;