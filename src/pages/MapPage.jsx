import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

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
                // API key allowed origin is taking care of misuse prevention, so we can safely include it in the client code
                mapStyle="https://api.maptiler.com/maps/streets/style.json?key=wdyEO2ww7kJA1nDgVHFE"
            />
        </div>
    );
}

export default MapPage;