import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

function MapPage() {
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
                mapStyle={`https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_API_KEY}`}
            />
        </div>
    );
}

export default MapPage;