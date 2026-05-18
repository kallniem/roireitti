import { useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import PoiMarkers from './PoiMarkers';

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

function MapView({ children, viewState: externalViewState, onMove, onMarkerClick, onMapClick, ...props }) {

    const [selectedMarker, setSelectedMarker] = useState(null);
    const [internalViewState, setInternalViewState] = useState({
        zoom: 14,
        longitude: 25.7294,
        latitude: 66.5039,
    });

    const currentViewState = externalViewState ?? internalViewState;

    const handleMove = (evt) => {
        if (!externalViewState) {
            setInternalViewState(evt.viewState);
        }
        if (typeof onMove === 'function') {
            onMove(evt);
        }
    };

    const handleMarkerclick = (markerObject) => {
        try {
            onMarkerClick(markerObject)
        } catch {
            setSelectedMarker(markerObject)
        }
    }

    const handleMapClick = (evt) => {
        if (typeof onMapClick === 'function') {
            onMapClick(evt);
        }
    }

    return (
            <Map
                {...currentViewState}
                {...props}
                onMove={handleMove}
                onClick={handleMapClick}
                mapStyle={`https://api.maptiler.com/maps/topo-v4/style.json?key=${MAPTILER_API_KEY}`}>
                {selectedMarker && (
                    <Popup
                        longitude={selectedMarker.longitude}
                        latitude={selectedMarker.latitude}
                        onClose={() => setSelectedMarker(null)}
                        closeButton={true}
                        closeOnClick={false}
                    >
                        <div className="flex-column" style={{ maxWidth: '260px' }}>
                            <h2 style={{ margin: '0 0 8px 0' }}>
                                {selectedMarker.title}
                            </h2>
                            <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                {selectedMarker.description.split('\n')[0]}
                            </p>
                            {selectedMarker.data_source != undefined &&
                                <em style={{marginTop: '40px'}}>{selectedMarker.data_source}</em>
                            }
                            
                        </div>
                    </Popup>
                )}
                <PoiMarkers onMarkerClick={(marker) => handleMarkerclick(marker)} />
                { children }
            </Map>
    );
}

export default MapView;