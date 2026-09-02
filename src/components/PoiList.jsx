import { useState } from 'react';
import businesses from '../offline-data/businesses.json';
import PillFilter from './PillFilter';

const poiCategories = [
    { value: 'all', label: 'Kaikki' },
    { value: 'accommodation', label: 'Majoitus' },
    { value: 'bicycle_shop', label: 'Pyöräliikkeet' },
    { value: 'restaurant', label: 'Ravintolat' },
    { value: 'activity', label: 'Aktiviteetit' },
    { value: 'shop', label: 'Kaupat' },
];

const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

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

    const visibleBusinesses = businesses.filter((business) =>
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
                {visibleBusinesses.map((business) => {
                    const address = business.postalAddresses?.[0];
                    const website = business.websiteUrl || business.webshopUrl;
                    const todayHours = business.businessHours?.default?.find(
                        (hours) => hours.weekday === weekdays[weekDay]
                    );

                    return (
                        <article className="poi-service flex-row no-stack" key={business.id}>
                            <div style={{ borderRadius: '1rem 0 0 1rem', display: 'block', backgroundColor: '#293250', width: '5rem', flexShrink: 0}}></div>
                            <div style={{ padding: '0.75rem'}}>
                                <h3>{business.businessName.trim()}</h3>
                                {address && (
                                    <p>
                                        {[address.streetName, address.postalCode, address.city].filter(Boolean).join(', ')}
                                    </p>
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