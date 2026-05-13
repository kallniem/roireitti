import { useNavigate } from "react-router";
import { useState } from "react";
import { fetchRovaniemiBikeRoutes } from "../functions/lipas";
import slugify from "../functions/slugify";

const typeLabels = {
    mtb: "Maastopyöräilyreitit",
    cycling: "Pyöräilyreitit",
}

function TrailList({trails, onFilterChange}) {

    const navigate = useNavigate();
    const [types, setTypes] = useState([]);
    const [groups, setGroups] = useState([]);
    const [filters, setFilters] = useState({
        type: "",
        length: 20,
    });

    useState(() => {
        //fetchRovaniemiBikeRoutes().then(console.log);
        const types = []
        for (const t of trails) {
            if (!types.includes(t.category)) {
                types.push(t.category);
            }
        }
        setTypes(types);

        const groups = []
        for (const t of trails) {
            if (t.group && !groups.includes(t.group)) {
                groups.push(t.group);
            }
        }
        setGroups(groups);
    }, []);

    const handleFilterChange = (filters) => {
        setFilters(filters)
        onFilterChange(filters)
    }


    return (
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
            <div
                    style={{
                    padding: "1rem",
                    borderRadius: "1rem",
                }}>
                <div className="flex-row" style={{ gap: "0.5rem" }}>
                    <div className="flex-column align-center justify-space-between">
                        <p>Reittityypit</p>
                        <select name="type" id="type" value={filters.type} onChange={e => handleFilterChange({ ...filters, type: e.target.value })}>
                            <option value="">Kaikki reitit</option>
                            {Object.entries(types).map(([index, label]) => (
                                <option key={index} value={label}>{typeLabels[label]}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-column align-center justify-space-between">
                        <p>Pituus</p>
                        <input type="range" name="length" id="length" min="0" max="20" step="0.1" style={{ width: "100%" }} onChange={e => handleFilterChange({ ...filters, length: e.target.value })} />
                    </div>
                </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
                <ListView trails={trails} groups={groups} filters={filters} />
            </div>
        </div>
    )
}

export default TrailList;

function ListView({ trails, groups, filters }) {

    const shownTrails = trails.filter(t => {
        if (filters.type && t.category !== filters.type) {
            return false;
        }
        return true;
    });
    const shownGroups = groups.filter(g => shownTrails.some(t => t.group === g));

    const navigate = useNavigate();

    return (
        <div className="flex-column" style={{ padding: "1rem", gap: "0.5rem" }}>
            {shownGroups.map(g => (
                <div key={g}>
                    <h2>{g}</h2>
                    <div className="flex-column" style={{ gap: "0.5rem" }}>
                        {shownTrails.filter(t => t.group === g).map(t => (
                            <div key={t.name} style={{ marginLeft: "1rem", cursor: "pointer" }} onClick={() => navigate(`/trails/${slugify(t.name)}`)}>
                                <span>{t.name}</span>
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
                            <div key={t.name} style={{ marginLeft: "1rem", cursor: "pointer" }} onClick={() => navigate(`/trails/${slugify(t.name)}`)}>
                                <span>{t.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}