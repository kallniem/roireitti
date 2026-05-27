import { useState } from 'react';
import MapView from '../components/MapView';
import TrailList from '../components/TrailList';
import dummyTrails from "../dummyTrails.json";
import TrailLine from '../components/TrailLine';
import InfoCard from '../components/InfoCard';
import routeIcon from "../assets/route.svg"

const categoryColors = {
    mtb: '#377eb8',
    cycling: '#4daf4a',
}

function MapPage({ onMarkerClick }) {

    const trails = dummyTrails; // In a real app, you'd fetch this data from an API
    const [selectedTrailIdx, setSelectedTrailIdx] = useState(null);
    const [viewState, setViewState] = useState({
        zoom: 14,
        longitude: 25.7294,
        latitude: 66.5039,
    });
    const [filter, setFilter] = useState({ type: '' });
    const [showMenu, setShowMenu] = useState(false)
    const [selected, setSelected] = useState({
        "object": null,
        "type": null
    })

    const handleFilterChange = (filters) => {
        console.log(filters);
        setFilter(filters);
    }

    const handleMapMove = (evt) => {
        setViewState(evt.viewState);
    }

    const handleMarkerSelect = (marker) => {
        setSelected({"object": marker, type: "marker"});
        setViewState((current) => ({
            ...current,
            longitude: marker.longitude,
            latitude: marker.latitude,
        }));
    }

    const interactiveLayerIds = trails.map((_, i) => `route-line-${i}`);

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
            <MapView
                viewState={viewState}
                onMove={handleMapMove}
                onMapClick={handleMapClick}
                onMarkerClick={(marker) => handleMarkerSelect(marker)}
                interactiveLayerIds={interactiveLayerIds}>
                
                {showMenu?
                <div className='flex-column trail-menu'>
                        <div className='flex-row align-center justify-center' style={{ cursor: 'pointer', width: '2rem', height: '2rem', borderRadius: '50%', border: '1px solid black'}} onClick={() => {setShowMenu(false)}}>✕</div>
                        <TrailList trails={trails} onFilterChange={(filters) => handleFilterChange(filters)}/>
                </div>
                :
                <div className='flex-column' style={{
                    cursor: 'pointer',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '3rem',
                    height: '3rem',
                    backgroundColor: 'white',
                    padding: '15px',
                    boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
                    zIndex: 10,
                    borderTop: '1px solid #ddd',
                    borderRadius: '50%',
                    margin: '0.5rem',
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'center',
                    alignContent: 'center'
                }} onClick={() => {setShowMenu(true)}}>
                    <img src={routeIcon} />
                </div>
                }

                {selected.object &&
                    <InfoCard item={selected} onClose={() => setSelected({object: null, type: null})}/>
                }
                {trails.filter(trail => trail.category === filter.type || filter.type === '').map((trail, index) => (
                    <TrailLine
                        key={index}
                        trail={trail}
                        index={index}
                        isSelected={selectedTrailIdx === index}
                        categoryColor={categoryColors[trail.category]}
                    />
                ))}
            </MapView>
        </div>
    );
}

export default MapPage;