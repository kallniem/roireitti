import { useState } from 'react';
import businesses from '../offline-data/businesses.json';
import products from '../offline-data/cyclist-certified-products.json';
import PillFilter from './PillFilter';

const categoryLabels = {
    accommodation: 'Majoitus',
    bicycle_shop: 'Pyöräliikkeet',
    bike_shop: 'Pyöräliikkeet',
    restaurant: 'Ravintolat',
    food_and_drink: 'Ravintolat',
    activity: 'Aktiviteetit',
    shop: 'Kaupat',
};

const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const businessesById = new Map(businesses.map((business) => [business.id, business]));
const certifiedProducts = products.flatMap((product) => {
    const business = businessesById.get(product.company?.id);
    const isWelcomeCyclistCertified = product.productCertificates?.some(
        ({ certificate }) => certificate === 'welcome_cyclist_certificate'
    );

    return business && isWelcomeCyclistCertified ? [{ product, business }] : [];
});
const categories = [...new Set(
    certifiedProducts.map(({ business }) => business.category).filter(Boolean)
)];
const poiCategories = [
    { value: 'all', label: 'Kaikki' },
    ...categories.map((category) => ({
        value: category,
        label: categoryLabels[category] || category,
    })),
];

function PoiList() {
    const [selectedCategories, setSelectedCategories] = useState(['all']);

    const handleCategorySelect = (category) => {
        if (category === 'all') {
            setSelectedCategories(['all']);
            return;
        }

        setSelectedCategories((currentCategories) => {
            const categories = currentCategories.filter((value) => value !== 'all');
            const nextCategories = categories.includes(category)
                ? categories.filter((value) => value !== category)
                : [...categories, category];

            return nextCategories.length > 0 ? nextCategories : ['all'];
        });
    };

    const visibleProducts = certifiedProducts.filter(({ business }) =>
        selectedCategories.includes('all') || selectedCategories.includes(business.category)
    );

    const weekDay = new Date().getDay();

    return (
        <div className="poi-list">
            <PillFilter
                items={poiCategories}
                selectedItems={selectedCategories}
                onSelect={handleCategorySelect}
                ariaLabel="Suodata palveluita"
            />
            <div className="poi-service-list" aria-live="polite">
                {visibleProducts.map(({ product, business }) => {
                    const address = business.postalAddresses?.[0] || product.postalAddresses?.[0];
                    const productInfo = product.productInformations?.find(
                        (info) => info.language === 'fi'
                    ) || product.productInformations?.find(
                        (info) => info.language === 'en'
                    ) || product.productInformations?.[0];
                    const productImage = product.productImages?.find(
                        (image) => image.coverPhoto && (image.thumbnailUrl || image.largeUrl || image.originalUrl)
                    ) || product.productImages?.find(
                        (image) => image.thumbnailUrl || image.largeUrl || image.originalUrl
                    );
                    const imageUrl = productImage?.thumbnailUrl || productImage?.largeUrl || productImage?.originalUrl;
                    const website = product.urlPrimary || product.webshopUrlPrimary || business.websiteUrl || business.webshopUrl;
                    const todayHours = product.productHours?.default?.find(
                        (hours) => hours.weekday === weekdays[weekDay]
                    );

                    return (
                        <article className="poi-service flex-row no-stack" key={product.id}>
                            <div className="poi-service-image">
                                {imageUrl && (
                                    <img src={imageUrl} alt={productImage.altText || productInfo?.name || ''} />
                                )}
                            </div>
                            <div style={{ padding: '0.75rem' }}>
                                <h3>{productInfo?.name?.trim() || business.businessName.trim()}</h3>
                                <p>{business.businessName.trim()}</p>
                                {address && (
                                    <p>
                                        {[address.streetName, address.postalCode, address.city].filter(Boolean).join(', ')}
                                    </p>
                                )}
                                {website && (
                                    <p><a href={website} target="_blank" rel="noreferrer">Verkkosivu</a></p>
                                )}
                                {todayHours ? (
                                    <p>
                                        {todayHours.open
                                            ? <><strong>Avoinna: </strong>{todayHours.opens?.slice(0, 5)}-{todayHours.closes?.slice(0, 5)}</>
                                            : <strong>Suljettu</strong>}
                                    </p>
                                )
                                :
                                (
                                    <p>Aukioloaikoja ei ole ilmoitettu</p>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}

export default PoiList;