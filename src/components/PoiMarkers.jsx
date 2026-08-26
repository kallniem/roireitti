import { useMemo, useEffect, useRef } from 'react';
import { Source, Layer, useMap } from 'react-map-gl/maplibre';

import swimmingAreas from '../offline-data/swimming-areas.json';
import businesses from '../offline-data/businesses.json';
import huts from '../offline-data/huts.json';

import swimmingIcon from '../assets/poi/swimming.svg';
import accommodationIcon from '../assets/poi/accommodation.svg';
import bicycleIcon from '../assets/poi/bicycle.svg';
import experienceIcon from '../assets/poi/experience.svg';
import hutIcon from '../assets/poi/hut.svg';
import shopIcon from '../assets/poi/shop.svg';
import restaurantIcon from '../assets/poi/restaurant.svg';

function PoiMarkers({ selectedMarkerId = -1 }) {
    const { current: map } = useMap();
    const imagesLoaded = useRef(false);

    // Load images into the map
    useEffect(() => {
        if (!map || imagesLoaded.current) return;

        const loadImages = async () => {
            try {
                const loadImage = (src) => {
                    return new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => resolve(img);
                        img.onerror = reject;
                        img.src = src;
                    });
                };

                const images = await Promise.all([
                    loadImage(swimmingIcon).then((img) => ({ id: 'swimming-icon', img })),
                    loadImage(accommodationIcon).then((img) => ({ id: 'accommodation-icon', img })),
                    loadImage(bicycleIcon).then((img) => ({ id: 'bicycle-icon', img })),
                    loadImage(experienceIcon).then((img) => ({ id: 'experience-icon', img })),
                    loadImage(hutIcon).then((img) => ({ id: 'hut-icon', img })),
                    loadImage(shopIcon).then((img) => ({ id: 'shop-icon', img })),
                    loadImage(restaurantIcon).then((img) => ({ id: 'restaurant-icon', img })),
                ]);

                images.forEach(({ id, img }) => {
                    if (!map.hasImage(id)) {
                        map.addImage(id, img);
                    }
                });

                imagesLoaded.current = true;
            } catch (error) {
                console.error('Failed to load marker images:', error);
            }
        };

        loadImages();
    }, [map]);
    const poiGeojson = useMemo(() => {

        const businessFeatures = businesses
            .filter((business) => business.coordinates)
            .map((business) => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: business.coordinates,
                },
                properties: {
                    id: business.id,
                    longitude: business.coordinates[0],
                    latitude: business.coordinates[1],
                    title: business.businessName,
                    description: business.description,
                    socialMedia: business.socialMedia,
                    data_source: business.data_source,
                    category: business.category || 'business',
                },
            }));

        const hutFeatures = huts.features.map((hut) => ({
            type: 'Feature',
            geometry: hut.geometry,
            properties: {
                id: hut.id,
                longitude: hut.geometry.coordinates[0],
                latitude: hut.geometry.coordinates[1],
                title: hut.properties.nimi_fi || hut.properties.nimi_en || hut.properties.nimi_se || 'Laavu',
                description: hut.properties.lisatieto_fi || hut.properties.tyyppi_nimi_fi || hut.properties.www || '',
                category: 'hut',
            },
        }));

        const swimmingAreaFeatures = swimmingAreas.features.map((area) => ({
            type: 'Feature',
            geometry: area.geometry,
            properties: {
                id: area.properties.id,
                longitude: area.geometry.coordinates[0],
                latitude: area.geometry.coordinates[1],
                title: area.properties.title,
                description: area.properties.description,
                category: 'swimming_area',
                data_source: area.properties.data_source
            },
        }));

        return {
            type: 'FeatureCollection',
            features: [...businessFeatures, ...hutFeatures, ...swimmingAreaFeatures],
        };
    }, []);

    const selectedIdStr = String(selectedMarkerId);

    return (
        <Source id="pois" type="geojson" data={poiGeojson}>
            <Layer
                id="poi-unselected"
                type="symbol"
                filter={["!=", ["to-string", ["get", "id"]], selectedIdStr]}
                layout={{
                    'icon-image': [
                        'match',
                        ['get', 'category'],
                        'activity', 'experience-icon',
                        'accommodation', 'accommodation-icon',
                        'bicycle_shop', 'bicycle-icon',
                        'hut', 'hut-icon',
                        'swimming_area', 'swimming-icon',
                        'restaurant', 'restaurant-icon',
                        'shop-icon',
                    ],
                    'icon-size': 0.5,
                    'icon-allow-overlap': false,
                    'icon-ignore-placement': false,
                }}
                paint={{
                    'icon-opacity': 1,
                }}
            />

            <Layer
                id="poi-selected"
                type="symbol"
                
                filter={["==", ["to-string", ["get", "id"]], selectedIdStr]}
                layout={{
                    'icon-image': [
                        'match',
                        ['get', 'category'],
                        'activity', 'experience-icon',
                        'accommodation', 'accommodation-icon',
                        'bicycle_shop', 'bicycle-icon',
                        'hut', 'hut-icon',
                        'swimming_area', 'swimming-icon',
                        'restaurant', 'restaurant-icon',
                        'shop-icon',
                    ],
                    'icon-size': 0.7,
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true,
                }}
                paint={{
                    'icon-opacity': 1,
                }}
            />
        </Source>
    );
}

export default PoiMarkers;