import { useState } from 'react';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import businesses from "../businesses.json";
import huts from "../huts.json"

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

const businessMarkerStyle = {
    width: '28px',
    height: '28px',
    backgroundColor: '#2563EB',
    color: 'white',
    border: '3px solid white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.25)',
};

const hutMarkerStyle = {
    width: '28px',
    height: '28px',
    backgroundColor: '#009900',
    color: 'white',
    border: '3px solid white',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.25)',
};

function MapPage() {

    const [selectedMarker, setSelectedMarker] = useState(null);

    return (
            <div
            className="flex-column justify-center align-center"
            style={{
            width: "100%",
            height: "100%",
            }}
            >
            <Map
                initialViewState={{
                    zoom: 14,
                    longitude: 25.7294,
                    latitude: 66.5039,
                }}
                mapStyle={`https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_API_KEY}`}>
                {businesses.map((business) => (
                    business.coordinates && (
                        <Marker
                            key={business.id}
                            longitude={business.coordinates.features[0].geometry.coordinates[0]}
                            latitude={business.coordinates.features[0].geometry.coordinates[1]}
                            title={business.businessName}
                            onClick={() => setSelectedMarker({
                                id: business.id,
                                longitude: business.coordinates.features[0].geometry.coordinates[0],
                                latitude: business.coordinates.features[0].geometry.coordinates[1],
                                title: business.businessName,
                                description: business.description.split('\n')[0],
                            })}
                        >
                            <div style={businessMarkerStyle}>Y</div>
                        </Marker>
                    )
                ))}
                {huts.features.map((hut) => (
                        <Marker
                            key={hut.id}
                            longitude={hut.geometry.coordinates[0]}
                            latitude={hut.geometry.coordinates[1]}
                            title={hut.properties.nimi_fi}
                            onClick={() => setSelectedMarker({
                                id: hut.id,
                                longitude: hut.geometry.coordinates[0],
                                latitude: hut.geometry.coordinates[1],
                                title: hut.properties.nimi_fi || hut.properties.nimi_en || hut.properties.nimi_se || 'Laavu',
                                description: hut.properties.lisatieto_fi || hut.properties.tyyppi_nimi_fi || hut.properties.www || '',
                            })}
                        >
                            <div style={hutMarkerStyle}>L</div>
                        </Marker>
                ))}
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
                                {selectedMarker.description}
                            </p>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
}

export default MapPage;