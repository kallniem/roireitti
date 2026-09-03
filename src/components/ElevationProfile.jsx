import { useMemo, useState } from 'react'

function ElevationProfile({ data, height = 140, onHover }) {
    const margin = { top: 8, right: 10, bottom: 24, left: 36 };
    const w = 700; // viewBox width
    const h = height;
    const innerW = w - margin.left - margin.right;
    const innerH = h - margin.top - margin.bottom;
    const [hoveredPoint, setHoveredPoint] = useState(null);

    const { pathD, minElev, maxElev, ticks, points } = useMemo(() => {
        if (!data || data.length === 0) {
            return { pathD: { line: '', area: '' }, minElev: 0, maxElev: 0, totalKm: 0, ticks: [], points: [] };
        }

        const elevations = data.map(p => p.elevation);
        const distances = data.map(p => p.distance);
        const minElev = Math.min(...elevations);
        const maxElev = Math.max(...elevations);
        const totalKm = distances[distances.length - 1] ?? 0;

        const yScale = (e) => {
            if (maxElev === minElev) return innerH / 2;
            return innerH - ((e - minElev) / (maxElev - minElev)) * innerH;
        };

        const xScale = (d) => (d / totalKm) * innerW || 0;

        const points = data.map(p => {
            const x = margin.left + xScale(p.distance);
            const y = margin.top + yScale(p.elevation);
            return { ...p, x, y };
        });

        const linePath = points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');

        // area path (closed)
        const areaD = `${linePath} L ${margin.left + innerW} ${margin.top + innerH} L ${margin.left} ${margin.top + innerH} Z`;

        // ticks every 25% of distance
        const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => ({ x: margin.left + t * innerW, label: (t * totalKm).toFixed(1) }));

        return { pathD: { line: linePath, area: areaD }, minElev, maxElev, totalKm, ticks, points };
    }, [data, innerH, innerW, margin.left, margin.top]);

    if (!data || data.length === 0) return null;

    const handleMouseMove = (event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const viewBoxX = Math.max(0, Math.min(w, ((event.clientX - bounds.left) / bounds.width) * w));
        const point = points.reduce((closest, candidate) => (
            Math.abs(candidate.x - viewBoxX) < Math.abs(closest.x - viewBoxX) ? candidate : closest
        ));

        setHoveredPoint(point);
        onHover?.(point);
    };

    const handleMouseLeave = () => {
        setHoveredPoint(null);
        onHover?.(null);
    };

    return (
        <div style={{ width: '100%', overflow: 'hidden' }} aria-hidden>
            <svg viewBox={`0 0 ${w} ${h}`} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                <defs>
                    <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#4daf4a" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#4daf4a" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <g>
                    <path d={pathD.area} fill="url(#grad)" stroke="none" />
                    <path d={pathD.line} fill="none" stroke="#2b7a2b" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                </g>

                {hoveredPoint && (
                    <g pointerEvents="none">
                        <line x1={hoveredPoint.x} x2={hoveredPoint.x} y1={margin.top} y2={h - margin.bottom} stroke="#333" strokeWidth={1} strokeDasharray="3 2" />
                        <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r={3} fill="#2b7a2b" stroke="#fff" strokeWidth={1} />
                    </g>
                )}

                {/* X axis ticks (distance km) */}
                <g>
                    {ticks.map((t, i) => (
                        <g key={i}>
                            <line x1={t.x} x2={t.x} y1={h - margin.bottom} y2={h - margin.bottom + 6} stroke="#888" />
                            <text x={t.x} y={h - 4} fontSize={10} fill="#333" textAnchor="middle">{t.label} km</text>
                        </g>
                    ))}
                </g>

                {/* Y axis labels */}
                <g>
                    <text x={10} y={margin.top + 10} fontSize={11} fill="#333">{Math.round(maxElev)} m</text>
                    <text x={10} y={h - margin.bottom - 2} fontSize={11} fill="#333">{Math.round(minElev)} m</text>
                </g>
            </svg>
        </div>
    );
}

export default ElevationProfile;
