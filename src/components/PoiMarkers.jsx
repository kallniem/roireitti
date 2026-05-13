import businesses from "../businesses.json";
import huts from "../huts.json"
import hutIcon from "../assets/hut.svg"
import shopIcon from "../assets/shop.svg"
import { Marker } from 'react-map-gl/maplibre';

const markerStyle = {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
};

function PoiMarkers({ onMarkerClick }) {

    const handleMarkerClick = (poiObject) => {
        onMarkerClick(poiObject)
    }

    return (
        <>
        {businesses.map((business) => (
                    business.coordinates && (
                        <Marker
                            key={business.id}
                            longitude={business.coordinates[0]}
                            latitude={business.coordinates[1]}
                            title={business.businessName}
                            onClick={() => handleMarkerClick({
                                id: business.id,
                                longitude: business.coordinates[0],
                                latitude: business.coordinates[1],
                                title: business.businessName,
                                description: business.description,
                                socialMedia: business.socialMedia,
                                dataSource: business.data_source,
                            })}
                        >
                            <div style={{ ...markerStyle, backgroundColor: '#2563EB', border: '3px solid white', borderRadius: '50%', boxShadow: '0 1px 6px rgba(0, 0, 0, 0.25)'}}>
                                <img src={shopIcon} style={{ ...markerStyle, padding: '0.4rem'}}/>
                            </div>
                        </Marker>
                    )
                ))}
                {huts.features.map((hut) => (
                        <Marker
                            key={hut.id}
                            longitude={hut.geometry.coordinates[0]}
                            latitude={hut.geometry.coordinates[1]}
                            title={hut.properties.nimi_fi}
                            onClick={() => handleMarkerClick({
                                id: hut.id,
                                longitude: hut.geometry.coordinates[0],
                                latitude: hut.geometry.coordinates[1],
                                title: hut.properties.nimi_fi || hut.properties.nimi_en || hut.properties.nimi_se || 'Laavu',
                                description: hut.properties.lisatieto_fi || hut.properties.tyyppi_nimi_fi || hut.properties.www || '',
                            })}
                        >
                            <div style={{ ...markerStyle,     backgroundColor: '#009900', color: 'white', border: '3px solid white', borderRadius: '10px', boxShadow: '0 1px 6px rgba(0, 0, 0, 0.25)'}}>
                                <img src={hutIcon} style={{ ...markerStyle, padding: '0.4rem'}}/>
                            </div>
                        </Marker>
                ))}
            </>
    )
}

export default PoiMarkers;