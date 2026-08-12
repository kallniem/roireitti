import { useState, useEffect } from 'react';
import { Map, Source, Layer, useMap } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import PoiMarkers from './PoiMarkers';

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

const sky = {
  'sky-color': '#80ccff',
  'sky-horizon-blend': 0.5,
  'horizon-color': '#ccddff',
  'horizon-fog-blend': 0.5,
  'fog-color': '#fcf0dd',
  'fog-ground-blend': 0.2
};

const terrain = {source: 'terrain', exaggeration: 2};

function FlyToMarker({ flyToLocation }) {
    const { current: map } = useMap();

    useEffect(() => {
        if (!map || !flyToLocation) return;

        map.flyTo({
            center: flyToLocation,
            speed: 0.5,
            curve: 1,
            essential: true,
        });
    }, [map, flyToLocation]);

    return null;
}

function FitToBounds({ fitBounds }) {
    const { current: map } = useMap();

    useEffect(() => {
        if (!map || !fitBounds) return;

        map.fitBounds(fitBounds, {
            padding: 20,
            duration: 1000,
            essential: true
        });
        
    }, [map, fitBounds]);

    return null;
}

function MapView({ children, viewState: externalViewState, onMove, onMarkerClick, onMapClick, selectedMarkerId, fitBounds, ...props }) {

    const [internalViewState, setInternalViewState] = useState({
        zoom: 14,
        longitude: 25.7294,
        latitude: 66.5039
    });
    const [flyToLocation, setFlyToLocation] = useState(null);

    const currentViewState = externalViewState ?? internalViewState;

    const handleMove = (evt) => {
        if (!externalViewState) {
            setInternalViewState(evt.viewState);
        }
        if (typeof onMove === 'function') {
            onMove(evt);
        }
    };

    const handleMapClick = (evt) => {
        const poiFeature = evt?.features?.find((feature) => feature.layer?.id === 'poi-unselected');
        if (poiFeature) {
            if (typeof onMarkerClick === 'function') {
                onMarkerClick(poiFeature.properties);
            }
            setFlyToLocation([poiFeature.properties.longitude, poiFeature.properties.latitude]);
            return;
        }

        if (typeof onMapClick === 'function') {
            onMapClick(evt);
        }
    }

    return (
        <>
            <Map
                id="map"
                {...currentViewState}
                {...props}
                onMove={handleMove}
                onClick={handleMapClick}
                maxPitch={85}
                mapStyle={`https://api.maptiler.com/maps/topo-v4/style.json?key=${MAPTILER_API_KEY}`}
                sky={sky}
                terrain={terrain}
                >
                <PoiMarkers selectedMarkerId={selectedMarkerId} />
                <FlyToMarker flyToLocation={flyToLocation} />
                <FitToBounds fitBounds={fitBounds} />
                { children }
                <Source
                    id="terrain"
                    type="raster-dem"
                    url={`https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_API_KEY}`}
                    tileSize={256}
                />
                <Source
                    id="hillshade"
                    type="raster-dem"
                    url={`https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_API_KEY}`}
                    tileSize={256}
                >
                <Layer
                    type="hillshade"
                    layout={{visibility: 'visible'}}
                    paint={{'hillshade-shadow-color': '#473B24'}}
                />
                </Source>
                </Map>
            </>
    );
}

export default MapView;