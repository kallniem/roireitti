import { useState } from 'react';

const poiCategories = [
    { value: 'all', label: 'Kaikki' },
    { value: 'accommodation', label: 'Majoitus' },
    { value: 'bicycle_shop', label: 'Pyöräliikkeet' },
    { value: 'restaurant', label: 'Ravintolat' },
    { value: 'activity', label: 'Aktiviteetit' },
    { value: 'shop', label: 'Kaupat' },
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

    return (
        <div className="poi-list">
            <PillFilter
                categories={poiCategories}
                selectedCategories={selectedCategories}
                onSelect={handleCategorySelect}
            />
        </div>
    );
}

function PillFilter({ categories, selectedCategories, onSelect }) {
    return (
        <div className="poi-pill-filter" aria-label="Suodata palveluita">
            {categories.map((category) => (
                <button
                    className={`poi-pill${selectedCategories.includes(category.value) ? ' is-selected' : ''}`}
                    key={category.value}
                    type="button"
                    aria-pressed={selectedCategories.includes(category.value)}
                    onClick={() => onSelect(category.value)}
                >
                    {category.label}
                </button>
            ))}
        </div>
    );
}

export default PoiList;