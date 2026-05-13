import { useState } from 'react';
import MapView from '../components/MapView';
import TrailList from '../components/TrailList';
import dummyTrails from "../dummyTrails.json";
import TrailLine from '../components/TrailLine';
import InfoCard from '../components/InfoCard';

function MapPage({ onMarkerClick }) {

    const trails = dummyTrails; // In a real app, you'd fetch this data from an API
    const [selectedMarker, setSelectedMarker] = useState(null);

    const handleFilterChange = (filters) => {
        console.log(filters)
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
                onMarkerClick={(marker) => setSelectedMarker(marker)}
                interactiveLayerIds={[/* layer ids here */]}>
                <div className='flex-column' style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    maxWidth: '20rem',
                    backgroundColor: 'white',
                    padding: '15px',
                    boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
                    zIndex: 10,
                    borderTop: '1px solid #ddd',
                    borderRadius: '1rem',
                    margin: '2rem',
                    overflowY: 'clip'
                    }}>
                        <TrailList trails={trails} onFilterChange={(filters) => handleFilterChange(filters)}/>
                </div>
                {selectedMarker &&
                    <InfoCard item={selectedMarker} onClose={() => setSelectedMarker(null)}/>
                }
                {trails.map((trail, index) => (
                    <TrailLine key={index} trail={trail} index={index} />
                ))}
            </MapView>
        </div>
    );
}

export default MapPage;