function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineKm(start, end) {
  if (!start || !end) {
    return 0;
  }

  const latitudeDelta = toRadians(end.latitude - start.latitude);
  const longitudeDelta = toRadians(end.longitude - start.longitude);

  const a =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(toRadians(start.latitude)) *
      Math.cos(toRadians(end.latitude)) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

class RouteOptimizer {
  static optimizeStops(stops, startPoint = null) {
    if (!Array.isArray(stops) || stops.length === 0) {
      return { route: [], totalDistanceKm: 0, distanceKm: 0 };
    }

    const route = [...stops];
    const unvisited = route.map((stop, index) => ({ ...stop, index }));
    const ordered = [];
    let currentPoint = startPoint || unvisited.shift();
    let totalDistanceKm = 0;

    if (currentPoint) {
      ordered.push({ ...currentPoint });
    }

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      for (let index = 0; index < unvisited.length; index += 1) {
        const candidate = unvisited[index];
        const distance = haversineKm(currentPoint, candidate);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      }

      const nextStop = unvisited.splice(nearestIndex, 1)[0];
      totalDistanceKm += nearestDistance;
      ordered.push({ ...nextStop });
      currentPoint = nextStop;
    }

    return {
      route: ordered,
      totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
      distanceKm: Number(totalDistanceKm.toFixed(2)),
    };
  }

  static calculateRouteDistance(route) {
    if (!Array.isArray(route) || route.length < 2) {
      return 0;
    }

    let totalDistanceKm = 0;

    for (let index = 1; index < route.length; index += 1) {
      totalDistanceKm += haversineKm(route[index - 1], route[index]);
    }

    return Number(totalDistanceKm.toFixed(2));
  }
}

module.exports = {
  haversineKm,
  RouteOptimizer,
};
