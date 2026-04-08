import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

function TrailView({ trail }) {
    return (
            <div className="flex-row" style={{ gap: "2rem"}}>
                
                <div style={{ flex: 1 }}>
                    <div>
                        <div
                        className="flex-column justify-start secondary"
                        style={{
                        width: "100%",
                        aspectRatio: "4/3",
                        padding: "1rem",
                        borderRadius: "1rem",
                        }}
                        >
                            <h1>{trail.name}</h1>
                            <p>{trail.description}</p>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1 }}>
                    <div>
                        <div
                        className="flex-column justify-center align-center secondary"
                        style={{
                        width: "100%",
                        aspectRatio: "4/3",
                        padding: "1rem",
                        borderRadius: "1rem",
                        }}
                        >
                            <h2>Reittitiedot</h2>
                            <p><strong>Pituus:</strong> {trail.length} km</p>
                            <p><strong>Vaativuus:</strong> {trail.difficulty}</p>
                            <Map
                                initialViewState={{
                                    longitude: trail.location.longitude,
                                    latitude: trail.location.latitude,
                                    zoom: 14
                                }}
                                mapStyle={`https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_API_KEY}`}
                            />
                        </div>
                    </div>
                </div>
            </div>
    )
}

export default TrailView;