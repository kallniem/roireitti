function calculateDuration(distanceKm) {
    const averageSpeedKmPerHour = 23; // Average biking speed in a leisurely pace
    const durationInHours = distanceKm / averageSpeedKmPerHour;

    if (durationInHours < 1) {
        const durationInMinutes = Math.round(durationInHours * 60);
        return `${durationInMinutes} min`;
    }
    return `${Math.round(durationInHours * 10) / 10} h`;
}

export default calculateDuration;