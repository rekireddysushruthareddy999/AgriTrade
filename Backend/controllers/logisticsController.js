const {
  RouteOptimizer,
  WeightedGraph,
  createRegionalAgriNetwork,
  haversineKm,
} = require("../dsa/routeOptimizer");
const Warehouse = require("../models/Warehouse");
const Farm = require("../models/Farm");
const { successResponse } = require("../utils/apiResponse");

const regionalNetwork = createRegionalAgriNetwork();

/**
 * Helper to resolve locations by ID or coordinates
 */
const resolveLocationNode = async (item) => {
  if (!item) return null;

  // If already an object with coordinates
  if (typeof item === "object" && (item.latitude || item.lat)) {
    return {
      id: item.id || `LOC_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: item.name || item.label || "Custom Location",
      latitude: Number(item.latitude || item.lat),
      longitude: Number(item.longitude || item.lng || item.lon),
      type: item.type || "waypoint",
    };
  }

  const strId = String(item.id || item);

  // Check if predefined in regional network
  if (regionalNetwork.hasNode(strId)) {
    return regionalNetwork.getNode(strId);
  }

  // Look up in database Warehouse
  try {
    const warehouse = await Warehouse.findById(strId).lean();
    if (warehouse) {
      return {
        id: String(warehouse._id),
        name: warehouse.name,
        location: warehouse.location,
        latitude: warehouse.coordinates?.latitude || 17.385,
        longitude: warehouse.coordinates?.longitude || 78.4867,
        type: "warehouse",
      };
    }
  } catch (e) {
    // Not a valid ObjectId, ignore
  }

  // Look up in Farm
  try {
    const farm = await Farm.findById(strId).lean();
    if (farm) {
      return {
        id: String(farm._id),
        name: `Farm at ${farm.location}`,
        location: farm.location,
        latitude: farm.coordinates?.latitude || 17.057,
        longitude: farm.coordinates?.longitude || 79.268,
        type: "farm",
      };
    }
  } catch (e) {
    // Ignore
  }

  // Fallback representation
  return { id: strId, name: strId, type: "location" };
};

/**
 * POST /api/logistics/optimize-route
 * Optimizes shipment routing across multiple collection centers/warehouses to buyer destination
 * using Dijkstra's shortest path algorithm over the weighted logistics graph.
 */
const optimizeRoute = async (req, res) => {
  const { stops = [], startPoint = null, endPoint = null } = req.body || {};

  if (!Array.isArray(stops) || stops.length < 1) {
    return res.status(400).json({
      success: false,
      message: "At least one stop is required for route optimization.",
    });
  }

  // Resolve all location inputs
  const resolvedStart = startPoint ? await resolveLocationNode(startPoint) : null;
  const resolvedEnd = endPoint ? await resolveLocationNode(endPoint) : null;
  const resolvedStops = await Promise.all(stops.map(resolveLocationNode));

  const result = RouteOptimizer.optimizeWithDijkstra({
    stops: resolvedStops,
    startPoint: resolvedStart,
    endPoint: resolvedEnd,
    customGraph: regionalNetwork,
  });

  return successResponse(res, 200, "Logistics route optimized using Dijkstra algorithm.", {
    ...result,
    algorithm: "Dijkstra's Algorithm over Weighted Graph",
  });
};

/**
 * GET /api/logistics/network
 * Returns nodes and weighted edges of the agricultural transportation network for visualization.
 */
const getNetworkGraph = async (req, res) => {
  const nodes = regionalNetwork.getAllNodes();
  const edges = regionalNetwork.getAllEdges();

  return successResponse(res, 200, "Regional logistics network graph retrieved.", {
    nodes,
    edges,
    totalNodes: nodes.length,
    totalEdges: edges.length,
  });
};

/**
 * POST /api/logistics/shortest-path
 * Computes shortest path between two specific points using Dijkstra.
 */
const getShortestPath = async (req, res) => {
  const { from, to } = req.body || {};
  if (!from || !to) {
    return res.status(400).json({
      success: false,
      message: '"from" and "to" location IDs are required.',
    });
  }

  const startId = String(from);
  const targetId = String(to);

  if (!regionalNetwork.hasNode(startId) || !regionalNetwork.hasNode(targetId)) {
    return res.status(404).json({
      success: false,
      message: "One or both specified nodes are not found in the regional network graph.",
    });
  }

  const dijkstraResult = regionalNetwork.dijkstra(startId, targetId);
  const path = dijkstraResult.getPath(targetId);
  const distanceKm = dijkstraResult.getDistance(targetId);

  return successResponse(res, 200, "Shortest path calculated via Dijkstra.", {
    from: regionalNetwork.getNode(startId),
    to: regionalNetwork.getNode(targetId),
    path: path.map((id) => regionalNetwork.getNode(id)),
    distanceKm,
    estimatedMinutes: Math.round((distanceKm / 50) * 60),
  });
};

module.exports = {
  optimizeRoute,
  getNetworkGraph,
  getShortestPath,
};
