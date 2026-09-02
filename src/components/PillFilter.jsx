function PillFilter({ items, selectedItems, onSelect, ariaLabel = "Filter options" }) {
    return (
        <div className="pill-filter" aria-label={ariaLabel}>
            {items.map((item) => (
                <button
                    className={`pill${selectedItems.includes(item.value) ? ' is-selected' : ''}`}
                    style={item.color && selectedItems.includes(item.value) ? {backgroundColor: item.color, borderColor: item.color} : {borderColor: item.color}}
                    key={item.value}
                    type="button"
                    aria-pressed={selectedItems.includes(item.value)}
                    onClick={() => onSelect(item.value)}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
}

export default PillFilter;
