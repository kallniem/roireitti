function calculateIncline(elevationSeries, currentPoint, seekDistance) {
    const currentElevation = elevationSeries[currentPoint].elevation;
    const currentDistance = elevationSeries[currentPoint].distance;
    
    // Elevation-series distances are in kilometers; seekDistance is in meters.
    const seekMax = currentDistance + seekDistance / 1000;

    const relevantPoints = elevationSeries.slice(currentPoint).filter((point) => {
        const distance = point.distance;
        return distance >= currentDistance && distance <= seekMax;
    });

    if (relevantPoints.length === 1 && currentPoint + 1 < elevationSeries.length) {
        relevantPoints.push(elevationSeries[currentPoint + 1]);
    }

    const averageIncline = relevantPoints.reduce((sum, point) => sum + point.elevation, 0) / relevantPoints.length;
    const incline = averageIncline - currentElevation;
    return incline * -1; // Return negative incline for downhill, positive for uphill
}

export default calculateIncline;