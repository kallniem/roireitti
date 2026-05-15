import { useState } from 'react';
import MapView from '../components/MapView';
import TrailList from '../components/TrailList';
import dummyTrails from "../dummyTrails.json";
import TrailLine from '../components/TrailLine';
import InfoCard from '../components/InfoCard';

const categoryColors = {
    mtb: '#377eb8',
    cycling: '#4daf4a',
}

function MapPage({ onMarkerClick }) {

    const trails = dummyTrails; // In a real app, you'd fetch this data from an API
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [viewState, setViewState] = useState({
        zoom: 14,
        longitude: 25.7294,
        latitude: 66.5039,
    });
    const [filter, setFilter] = useState({ type: '' });

    const handleFilterChange = (filters) => {
        console.log(filters);
        setFilter(filters);
    }

    const handleMapMove = (evt) => {
        setViewState(evt.viewState);
    }

    const handleMarkerSelect = (marker) => {
        setSelectedMarker(marker);
        setViewState((current) => ({
            ...current,
            longitude: marker.longitude,
            latitude: marker.latitude,
        }));
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
                onMarkerClick={(marker) => handleMarkerSelect(marker)}
                interactiveLayerIds={[/* layer ids here */]}>
                <div className='flex-column' style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '20rem',
                    backgroundColor: 'white',
                    padding: '15px',
                    boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
                    zIndex: 10,
                    borderTop: '1px solid #ddd',
                    borderRadius: '1rem',
                    margin: '0.5rem',
                    overflow: 'hidden',
                    }}>
                        <TrailList trails={trails} onFilterChange={(filters) => handleFilterChange(filters)}/>
                </div>
                {selectedMarker &&
                    <InfoCard item={selectedMarker} onClose={() => setSelectedMarker(null)}/>
                }
                {trails.filter(trail => trail.category === filter.type || filter.type === '').map((trail, index) => (
                    <TrailLine key={index} trail={trail} index={index} categoryColor={categoryColors[trail.category]} />
                ))}
            </MapView>
        </div>
    );
}

export default MapPage;