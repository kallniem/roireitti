import { useNavigate, useParams } from "react-router";
import dummyTrails from "../dummyTrails.json";
import { useState } from "react";
import TrailView from "../components/TrailView";
import { fetchRovaniemiBikeRoutes } from "../functions/lipas";
import slugify from "../functions/slugify";

const typeLabels = {
    mtb: "Maastopyöräilyreitit",
    cycling: "Pyöräilyreitit",
}

function TrailsPage() {

    const navigate = useNavigate();
    const { slug } = useParams();
    const [types, setTypes] = useState([]);
    const [groups, setGroups] = useState([]);
    const [filters, setFilters] = useState({
        type: "",
        length: 20,
    });

    const trails = dummyTrails; // In a real app, you'd fetch this data from an API
    const trail = trails.find(t => slugify(t.name) === slug);

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


    return (
        <>
            <nav className="breadcrumb">
                <ol>
                    <li><span href="#">Reitit</span></li>
                    {trail ?
                        <>
                        <li><span href="#">{typeLabels[trail.category]}</span></li>
                        <li><span aria-label="Current page" href="#">{trail.name}</span></li>
                        </>
                        :
                        <li><span aria-label="Current page" href="#">{filters.type ? typeLabels[filters.type] : "Kaikki reitit"}</span></li>
                    }
                </ol>
            </nav>

            {trail?
                <TrailView trail={trail} />
                :
                <>
                <div className="secondary" 
                        style={{
                        padding: "1rem",
                        borderRadius: "1rem",
                    }}>
                    <div className="flex-row row-stack" style={{ gap: "0.5rem" }}>
                        <div className="flex-column align-center justify-space-between">
                            <p>Reittityypit</p>
                            <select name="type" id="type" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
                                <option value="">Kaikki reitit</option>
                                {Object.entries(types).map(([index, label]) => (
                                    <option key={index} value={label}>{typeLabels[label]}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-column align-center justify-space-between">
                            <p>Pituus</p>
                            <input type="range" name="length" id="length" min="0" max="20" step="0.1" onChange={e => setFilters({ ...filters, length: e.target.value })} />
                        </div>
                    </div>
                </div>
                <TrailList trails={trails} groups={groups} filters={filters} />
                </>
            }
        </>
    )
}

export default TrailsPage;

function TrailList({ trails, groups, filters }) {

    const shownTrails = trails.filter(t => {
        if (filters.type && t.category !== filters.type) {
            return false;
        }
        return true;
    });
    const shownGroups = groups.filter(g => shownTrails.some(t => t.group === g));

    const navigate = useNavigate();

    return (
        <div className="flex-column secondary" style={{ borderRadius: "1rem", padding: "2rem", marginTop: "2rem", gap: "0.5rem" }}>
            {shownGroups.map(g => (
                <div key={g}>
                    <h2>{g}</h2>
                    <div className="flex-column" style={{ gap: "0.5rem" }}>
                        {shownTrails.filter(t => t.group === g).map(t => (
                            <div key={t.name} className="card" style={{ padding: "1rem", cursor: "pointer" }} onClick={() => navigate(`/trails/${slugify(t.name)}`)}>
                                <h3>{t.name}</h3>
                                <p>{t.lengthKm} km</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            {shownTrails.filter(t => !t.group).length > 0 && (
                <div>
                    <h2>Yksittäiset reitit</h2>
                    <div className="flex-column row-stack" style={{ gap: "0.5rem" }}>
                        {shownTrails.filter(t => !t.group).map(t => (
                            <div key={t.name} className="card" style={{ padding: "1rem", cursor: "pointer" }} onClick={() => navigate(`/trails/${slugify(t.name)}`)}>
                                <h3>{t.name}</h3>
                                <p>{t.lengthKm} km</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}