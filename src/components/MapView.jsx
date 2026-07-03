import { useState } from 'react';
import { Map, Source, Layer } from 'react-map-gl/maplibre';
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

function MapView({ children, viewState: externalViewState, onMove, onMarkerClick, onMapClick, selectedMarkerId, ...props }) {

    const [internalViewState, setInternalViewState] = useState({
        zoom: 14,
        longitude: 25.7294,
        latitude: 66.5039
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

    const handleMapClick = (evt) => {
        const poiFeature = evt?.features?.find((feature) => feature.layer?.id === 'poi-circle');
        if (poiFeature) {
            if (typeof onMarkerClick === 'function') {
                onMarkerClick(poiFeature.properties);
            }
            return;
        }

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
                maxPitch={85}
                mapStyle={`https://api.maptiler.com/maps/topo-v4/style.json?key=${MAPTILER_API_KEY}`}
                sky={sky}
                terrain={terrain}
                >
                <PoiMarkers selectedMarkerId={selectedMarkerId} />
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
    );
}

export default MapView;