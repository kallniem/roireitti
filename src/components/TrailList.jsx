import { useNavigate } from "react-router";
import { useEffect, useMemo, useState } from "react";
import slugify from "../functions/slugify";
import PillFilter from "./PillFilter";
import trailTypes from "../trailTypes";
import RangeSlider from "./RangeSlider";

const difficulties = ["easy", "moderate", "hard"];
const roadTypes = ["gravel", "mtb", "trek", "road", "winter"];

function TrailList({trails, filters = { selectedTypes: roadTypes, length: { min: 0, max: 0 }, sort: "shortest", color: "by-difficulty" }, onFilterChange}) {

    const [groups, setGroups] = useState([]);
    const [selectedDifficulties, setSelectedDifficulties] = useState(difficulties);
    const [selectedTypes, setSelectedTypes] = useState(roadTypes);

    const trailLengthRange = useMemo(() => {
        const lengths = trails.map((trail) => Number(trail.lengthKm) || 0);

        return {
            min: lengths.length > 0 ? Math.min(...lengths) : 0,
            max: lengths.length > 0 ? Math.max(...lengths) : 0,
        };
    }, [trails]);

    const sliderValue = filters.length && typeof filters.length === "object"
        ? filters.length
        : trailLengthRange;

    const handleDifficultySelect = (category) => {
        setSelectedDifficulties((currentDifficulties) => {
            const nextDifficulties = currentDifficulties.includes(category)
                ? currentDifficulties.filter((value) => value !== category)
                : [...currentDifficulties, category];

            return nextDifficulties.length > 0
                ? nextDifficulties
                : [...difficulties];
        });
    };

    const handleTypeSelect = (category) => {
        const nextTypes = selectedTypes.includes(category)
            ? selectedTypes.filter((value) => value !== category)
            : [...selectedTypes, category];

        const safeNextTypes = nextTypes.length > 0
            ? nextTypes
            : [...roadTypes];

        setSelectedTypes(safeNextTypes);
        handleFilterChange({ ...filters, selectedTypes: safeNextTypes });
    };

    useEffect(() => {
        const groups = []
        for (const t of trails) {
            if (t.group && !groups.includes(t.group)) {
                groups.push(t.group);
            }
        }
        setGroups(groups);
    }, [trails]);

    const handleFilterChange = (nextFilters) => {
        onFilterChange(nextFilters);
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
            <div
                    style={{
                    marginBottom: "0.5rem",
                }}>
                <h2>Vaativuus</h2>
                <PillFilter items={difficulties.map(d => ({ value: d,label: trailTypes[d].label, color: trailTypes[d].color }))} selectedItems={selectedDifficulties} onSelect={handleDifficultySelect} />

                <h2>Pituus</h2>
                <RangeSlider
                    min={trailLengthRange.min}
                    max={trailLengthRange.max}
                    step={1}
                    value={sliderValue}
                    onChange={(value) => handleFilterChange({ ...filters, length: value })}
                />

                <h2>Maasto</h2>
                <PillFilter items={roadTypes.map(t => ({ value: t, label: trailTypes[t].label, color: trailTypes[t].color }))} selectedItems={selectedTypes} onSelect={handleTypeSelect} />

            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto",  border: "1px solid #ddd", borderRadius: "1rem", boxShadow: "0 1px 6px rgba(0,0,0,0.1)" }}>
                <ListView trails={trails} groups={groups} filters={filters} selectedTypes={selectedTypes} />
            </div>
        </div>
    )
}

export default TrailList;

function ListView({ trails, groups, filters, selectedTypes }) {
    const lengthRange = filters.length && typeof filters.length === "object"
        ? filters.length
        : { min: 0, max: Number.POSITIVE_INFINITY };

    const shownTrails = trails
        .filter(t => {
            if (!selectedTypes.includes(t.category)) {
                return false;
            }

            const trailLength = Number(t.lengthKm) || 0;

            if (trailLength < (lengthRange.min ?? 0)) {
                return false;
            }

            if (trailLength > (lengthRange.max ?? Number.POSITIVE_INFINITY)) {
                return false;
            }

            return true;
        })
        .slice()
        .sort((a, b) => {
            if (filters.sort === "shortest") {
                return (a.lengthKm ?? 0) - (b.lengthKm ?? 0);
            }
            return (b.lengthKm ?? 0) - (a.lengthKm ?? 0);
        });
    const shownGroups = groups.filter(g => shownTrails.some(t => t.group === g));

    const navigate = useNavigate();

    return (
        <div className="flex-column" style={{ height: "100%", padding: "1rem", gap: "0.5rem" }}>
            {shownGroups.map(g => (
                <div key={g}>
                    <h2>{g}</h2>
                    <div className="flex-column" style={{ gap: "0.5rem" }}>
                        {shownTrails.filter(t => t.group === g).map(t => (
                            <div className="flex-column" key={t.name} style={{ padding: '0.5rem', borderRadius: "0.5rem", cursor: "pointer", boxShadow: `0 0 3px 0px ${trailTypes[t.category].color}` }} onClick={() => navigate(`/trails/${slugify(t.name)}`)}>
                                <span>{t.name}</span>
                                <span style={{fontSize: 10, fontWeight: "bold"}}>{t.lengthKm} km</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            {shownTrails.filter(t => !t.group).length > 0 && (
                <div>
                    <h2>Yksittäiset reitit</h2>
                    <div className="flex-column" style={{ gap: "0.5rem" }}>
                        {shownTrails.filter(t => !t.group).map(t => (
                            <div className="flex-column" key={t.name} style={{ padding: '0.5rem', borderRadius: "0.5rem", cursor: "pointer", boxShadow: `0 0 3px 0px ${trailTypes[t.category].color}` }} onClick={() => navigate(`/trails/${slugify(t.name)}`)}>
                                <span>{t.name}</span>
                                <span style={{fontSize: 10, fontWeight: "bold"}}>{t.lengthKm} km</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}