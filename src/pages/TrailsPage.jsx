import { useNavigate, useParams } from "react-router";
import dummyTrails from "../dummyTrails.json";
import { useState } from "react";
import TrailView from "../components/TrailView";

const trailTypes = {
    city: "Kaupunkipyöräily",
    mountain: "Maastopyöräily",
    winter: "Talvipyöräily"
}

function TrailsPage() {

    const { slug } = useParams();
    const [filters, setFilters] = useState({ type: "all" });

    const trails = dummyTrails; // In a real app, you'd fetch this data from an API
    const trail = trails.find(t => t.slug === slug);

    return (
        <>
            <nav className="breadcrumb">
                <ol>
                    <li><span href="#">Reitit</span></li>
                    {trail &&
                        <>
                        <li><span href="#">{trailTypes[trail.type]}</span></li>
                        <li><span aria-label="Current page" href="#">{trail.name}</span></li>
                        </>
                    }
                    {!trail && filters.type !== "all" &&
                        <li><span aria-label="Current page" href="#">{trailTypes[filters.type]}</span></li>
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
                    {/*
                    <form>
                        <table>
                            <thead>
                                <tr>
                                    <th>Reittityypit</th>
                                    <th>Pituus</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <select name="type" id="type" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
                                            <option value="all">Kaikki reitit</option>
                                            {Object.entries(trailTypes).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <input type="range" name="length" id="length" min="0" max="20" step="0.1" onChange={e => setFilters({ ...filters, length: e.target.value })} />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </form>
                    */}
                    <div className="flex-row row-stack" style={{ gap: "0.5rem" }}>
                        <div className="flex-column align-center justify-space-between">
                            <p>Reittityypit</p>
                            <select name="type" id="type" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
                                <option value="all">Kaikki reitit</option>
                                {Object.entries(trailTypes).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-column align-center justify-space-between">
                            <p>Pituus</p>
                            <input type="range" name="length" id="length" min="0" max="20" step="0.1" onChange={e => setFilters({ ...filters, length: e.target.value })} />
                        </div>
                    </div>
                </div>
                <TrailList trails={trails.filter(trail => filters.type === "all" || trail.type === filters.type)} />
                </>
            }
        </>
    )
}

function TrailList({ trails }) {

    const navigate = useNavigate();

    return (
            <div className="flex-column" style={{ gap: "1rem", marginTop: "2rem" }}>
                {trails.map(trail => (
                    <div
                    key={trail.slug}
                    className="flex-row justify-space-between align-center secondary"
                    onClick={() => navigate(`/trails/${trail.slug}`)}
                    style={{
                        width: "100%",
                        padding: "1rem",
                        borderRadius: "1rem",
                        cursor: "pointer",
                    }}
                    >
                        <h3>{trail.name}</h3>
                        <span>{trail.length} km</span>
                    </div>
                ))}
            </div>
        )
}

export default TrailsPage;