import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import slugify from "../functions/slugify";
import PillFilter from "./PillFilter";
import trailColors from "../trailColors";

const difficulties = [
    {
        value: 'easy',
        label: 'Helppo',
        color: trailColors['easy']
    },
    {
        value: 'moderate',
        label: 'Keskitaso',
        color: trailColors['moderate']
    },
    {
        value: 'hard',
        label: 'Vaikea',
        color: trailColors['hard']
    }
];

const roadTypes = [
    {
        value: 'gravel',
        label: 'Gravel',
        color: trailColors['gravel']
    },
    {
        value: 'mtb',
        label: 'Maastopyöräily',
        color: trailColors['mtb']
    },
    {
        value: 'trek',
        label: 'Retkipyöräily',
        color: trailColors['trek']
    },
    {
        value: 'road',
        label: 'Maantiepyöräily',
        color: trailColors['road']
    },
    {
        value: 'winter',
        label: 'Talvipyöräily',
        color: trailColors['winter']
    }
];

function TrailList({trails, filters = { selectedTypes: ['gravel', 'mtb', 'trek', 'road', 'winter'], length: 20, sort: "shortest", color: "by-difficulty" }, onFilterChange}) {

    const [groups, setGroups] = useState([]);
    const [selectedDifficulties, setSelectedDifficulties] = useState(['easy', 'moderate', 'hard']);
    const [selectedTypes, setSelectedTypes] = useState([...roadTypes.map(({ value }) => value)]);

    const handleDifficultySelect = (category) => {
        setSelectedDifficulties((currentDifficulties) => {
            const nextDifficulties = currentDifficulties.includes(category)
                ? currentDifficulties.filter((value) => value !== category)
                : [...currentDifficulties, category];

            return nextDifficulties.length > 0
                ? nextDifficulties
                : difficulties.map(({ value }) => value);
        });
    };

    const handleTypeSelect = (category) => {
        setSelectedTypes((currentTypes) => {
            const nextTypes = currentTypes.includes(category)
                ? currentTypes.filter((value) => value !== category)
                : [...currentTypes, category];

            return nextTypes.length > 0
                ? nextTypes
                : selectedTypes.map(({ value }) => value);
        });
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
        onFilterChange(nextFilters)
    }

    useEffect(() => {
        handleFilterChange({ ...filters, selectedTypes });
    }, [selectedTypes, onFilterChange]);

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
            <div
                    style={{
                    marginBottom: "0.5rem",
                }}>
                <h2>Vaativuus</h2>
                <PillFilter items={difficulties} selectedItems={selectedDifficulties} onSelect={handleDifficultySelect} />

                <h2>Pituus</h2>
                <em>TODO</em>

                <h2>Maasto</h2>
                <PillFilter items={roadTypes} selectedItems={selectedTypes} onSelect={handleTypeSelect} />

            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto",  border: "1px solid #ddd", borderRadius: "1rem", boxShadow: "0 1px 6px rgba(0,0,0,0.1)" }}>
                <ListView trails={trails} groups={groups} filters={filters} selectedTypes={selectedTypes} />
            </div>
        </div>
    )
}

export default TrailList;

function ListView({ trails, groups, filters, selectedTypes }) {

    const shownTrails = trails
        .filter(t => {
            if (!selectedTypes.includes(t.category)) {
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
                            <div className="flex-column" key={t.name} style={{ padding: '0.5rem', borderRadius: "0.5rem", cursor: "pointer", boxShadow: `0 0 3px 0px ${trailColors[t.category]}` }} onClick={() => navigate(`/trails/${slugify(t.name)}`)}>
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
                            <div className="flex-column" key={t.name} style={{ padding: '0.5rem', borderRadius: "0.5rem", cursor: "pointer", boxShadow: `0 0 3px 0px ${trailColors[t.category]}` }} onClick={() => navigate(`/trails/${slugify(t.name)}`)}>
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