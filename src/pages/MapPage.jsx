import { useState } from 'react';
import { useNavigate } from 'react-router';
import MapView from '../components/MapView';
import TrailList from '../components/TrailList';
import trails from "../offline-data/trails.json";
import TrailLine from '../components/TrailLine';
import InfoCard from '../components/InfoCard';

import routeIcon from "../assets/route.svg"
import homeIcon from "../assets/home.svg"
import { MapProvider } from 'react-map-gl/maplibre';

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
        'poi-circle',
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
                    interactiveLayerIds={interactiveLayerIds}>
                    
                    <div className='flex-column map-side-buttons'>
                        {!showMenu &&
                        <>
                            <div className='flex-column justify-center' onClick={() => {setShowMenu(true)}}>
                                <img src={routeIcon} />
                            </div>
                            <div className='flex-column justify-center' onClick={() => {navigateTo("/")}}>
                                <img src={homeIcon} />
                            </div>
                        </>
                        }
                    </div>

                    {selected.object &&
                        <InfoCard key={`${selected.type}-${selected.object.id || selected.object.name}`} item={selected} onClose={() => setSelected({object: null, type: null})}/>
                    }

                    {showMenu &&
                        <div className='flex-column trail-menu'>
                                <div className='flex-row align-center justify-center' style={{ cursor: 'pointer', width: '2rem', height: '2rem', borderRadius: '50%', border: '1px solid black'}} onClick={() => {setShowMenu(false)}}>✕</div>
                                <TrailList trails={trails} filters={filter} onFilterChange={(filters) => handleFilterChange(filters)}/>
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