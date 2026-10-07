/**
 * AgriTrade - DSA Module 4.3: Logistics Route Optimization — Weighted Graph + Dijkstra's Algorithm
 *
 * Problem Solved:
 * A produce shipment often visits multiple collection centers or warehouses to aggregate
 * lots before reaching a buyer's destination. Dispatching vehicles by guesswork wastes fuel,
 * increases transit time, and risks produce spoilage.
 *
 * DSA Characteristics:
 * - Weighted Graph: Nodes represent farms, collection centers, warehouses, and buyer destinations.
 *   Edge weights represent road distance (km) or transit time (minutes).
 * - Priority Queue (Binary Min-Heap) for Dijkstra: O((V + E) log V) shortest-path calculation.
 * - Multi-stop Route Optimizer: Solves waypoint ordering using all-pairs Dijkstra distance matrix.
 * - Full path reconstruction: Returns turn-by-turn waypoint nodes and leg-by-leg metrics.
 */

// Haversine formula to compute geodesic distance between two latitude/longitude points in km
function haversineKm(start, end) {
  if (!start || !end) return 0;
  const lat1 = Number(start.latitude ?? start.lat ?? 0);
  const lon1 = Number(start.longitude ?? start.lng ?? start.lon ?? 0);
  const lat2 = Number(end.latitude ?? end.lat ?? 0);
  const lon2 = Number(end.longitude ?? end.lng ?? end.lon ?? 0);

  if (lat1 === lat2 && lon1 === lon2) return 0;

  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const earthRadiusKm = 6371;
  return Number((earthRadiusKm * c).toFixed(2));
}

/**
 * Min-Heap based Priority Queue for Dijkstra's Algorithm
 */
class PriorityQueue {
  constructor() {
    this.heap = [];
  }

  get size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  push(element, priority) {
    this.heap.push({ element, priority });
    this.bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.isEmpty()) return null;
    const min = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = end;
      this.bubbleDown(0);
    }
    return min;
  }

  bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.heap[index].priority >= this.heap[parent].priority) break;
      [this.heap[index], this.heap[parent]] = [this.heap[parent], this.heap[index]];
      index = parent;
    }
  }

  bubbleDown(index) {
    const length = this.heap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < length && this.heap[left].priority < this.heap[smallest].priority) {
        smallest = left;
      }
      if (right < length && this.heap[right].priority < this.heap[smallest].priority) {
        smallest = right;
      }
      if (smallest === index) break;
      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
}

/**
 * Weighted Graph representation of the agricultural logistics network.
 */
class WeightedGraph {
  constructor() {
    this.nodes = new Map(); // nodeId -> nodeData
    this.adjacencyList = new Map(); // nodeId -> Array<{ to: nodeId, weight: number, meta?: Object }>
  }

  addNode(id, data = {}) {
    const nodeId = String(id);
    if (!this.nodes.has(nodeId)) {
      this.nodes.set(nodeId, { id: nodeId, ...data });
      this.adjacencyList.set(nodeId, []);
    }
    return this;
  }

  getNode(id) {
    return this.nodes.get(String(id)) || null;
  }

  hasNode(id) {
    return this.nodes.has(String(id));
  }

  /**
   * Add weighted edge between two nodes.
   * @param {string} fromNode
   * @param {string} toNode
   * @param {number} weight Road distance (km) or transit time (minutes)
   * @param {Object} [meta] Additional metadata (road name, condition, speed limit)
   * @param {boolean} [bidirectional=true]
   */
  addEdge(fromNode, toNode, weight, meta = {}, bidirectional = true) {
    const from = String(fromNode);
    const to = String(toNode);
    const w = Number(weight);

    this.addNode(from);
    this.addNode(to);

    this.adjacencyList.get(from).push({ to, weight: w, meta });
    if (bidirectional) {
      this.adjacencyList.get(to).push({ to: from, weight: w, meta });
    }
    return this;
  }

  getNeighbors(nodeId) {
    return this.adjacencyList.get(String(nodeId)) || [];
  }

  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  getAllEdges() {
    const edges = [];
    for (const [from, neighbors] of this.adjacencyList.entries()) {
      for (const { to, weight, meta } of neighbors) {
        if (from < to) {
          edges.push({ from, to, weight, meta });
        }
      }
    }
    return edges;
  }

  /**
   * Dijkstra's Algorithm:
   * Finds the shortest path and minimum distance from startNode to all reachable nodes (or targetNode).
   *
   * Time Complexity: O((V + E) log V) with PriorityQueue.
   *
   * @param {string} startNode
   * @param {string} [targetNode] Optional target for early exit.
   * @returns {{ distances: Object, previous: Object, getPath: Function, getDistance: Function }}
   */
  dijkstra(startNode, targetNode = null) {
    const start = String(startNode);
    const target = targetNode ? String(targetNode) : null;

    if (!this.hasNode(start)) {
      throw new Error(`Start node "${start}" does not exist in graph.`);
    }

    const distances = {};
    const previous = {};
    const pq = new PriorityQueue();

    for (const nodeId of this.nodes.keys()) {
      distances[nodeId] = Number.POSITIVE_INFINITY;
      previous[nodeId] = null;
    }

    distances[start] = 0;
    pq.push(start, 0);

    const visited = new Set();

    while (!pq.isEmpty()) {
      const { element: current, priority: currentDist } = pq.pop();

      if (visited.has(current)) continue;
      visited.add(current);

      // Early exit if single target is reached
      if (target && current === target) {
        break;
      }

      for (const neighbor of this.getNeighbors(current)) {
        if (visited.has(neighbor.to)) continue;

        const candidateDist = currentDist + neighbor.weight;
        if (candidateDist < distances[neighbor.to]) {
          distances[neighbor.to] = candidateDist;
          previous[neighbor.to] = current;
          pq.push(neighbor.to, candidateDist);
        }
      }
    }

    const getPath = (dest) => {
      const destId = String(dest);
      if (distances[destId] === Number.POSITIVE_INFINITY) return [];
      const path = [];
      let curr = destId;
      while (curr !== null) {
        path.unshift(curr);
        curr = previous[curr];
      }
      return path;
    };

    const getDistance = (dest) => {
      const destId = String(dest);
      const d = distances[destId];
      return d !== undefined && d !== Number.POSITIVE_INFINITY ? Number(d.toFixed(2)) : null;
    };

    return {
      distances,
      previous,
      getPath,
      getDistance,
    };
  }

  /**
   * Multi-Stop Optimization using Dijkstra shortest path calculations:
   * Solves waypoint routing for shipments visiting multiple collection centers / warehouses
   * before reaching the final buyer destination.
   *
   * @param {string} startNode Origin hub (collection center / warehouse)
   * @param {Array<string>} stopNodes Intermediate stops (pickups / inspections)
   * @param {string} [endNode] Final delivery destination (buyer warehouse)
   * @returns {{ optimalSequence: Array, totalDistanceKm: number, legDetails: Array, fullPathNodes: Array }}
   */
  optimizeDeliveryRoute(startNode, stopNodes = [], endNode = null) {
    const origin = String(startNode);
    const destination = endNode ? String(endNode) : null;
    const remainingStops = stopNodes.map((s) => String(s)).filter((s) => s !== origin && s !== destination);

    const orderedStops = [origin];
    let currentNode = origin;
    let totalDistanceKm = 0;
    const legDetails = [];
    const fullPathNodes = [origin];

    // Compute pairwise shortest paths greedily using Dijkstra
    while (remainingStops.length > 0) {
      const dijkstraResult = this.dijkstra(currentNode);
      let nearestIndex = 0;
      let nearestDist = Number.POSITIVE_INFINITY;

      for (let i = 0; i < remainingStops.length; i++) {
        const candidate = remainingStops[i];
        const dist = dijkstraResult.getDistance(candidate);
        if (dist !== null && dist < nearestDist) {
          nearestDist = dist;
          nearestIndex = i;
        }
      }

      if (nearestDist === Number.POSITIVE_INFINITY) {
        // Fallback: unreachable via graph edges, attach directly
        const next = remainingStops.splice(0, 1)[0];
        orderedStops.push(next);
        fullPathNodes.push(next);
        currentNode = next;
        continue;
      }

      const nextStop = remainingStops.splice(nearestIndex, 1)[0];
      const legPath = dijkstraResult.getPath(nextStop);

      totalDistanceKm += nearestDist;
      orderedStops.push(nextStop);

      // Append intermediate path nodes
      if (legPath.length > 1) {
        fullPathNodes.push(...legPath.slice(1));
      }

      legDetails.push({
        from: currentNode,
        to: nextStop,
        distanceKm: nearestDist,
        estimatedTimeMinutes: Math.round((nearestDist / 50) * 60), // Avg speed: 50 km/h
        pathWaypoints: legPath.map((id) => this.getNode(id) || { id }),
      });

      currentNode = nextStop;
    }

    // Connect to destination if provided
    if (destination && destination !== currentNode) {
      const finalDijkstra = this.dijkstra(currentNode, destination);
      const distToDest = finalDijkstra.getDistance(destination);

      if (distToDest !== null) {
        totalDistanceKm += distToDest;
        const legPath = finalDijkstra.getPath(destination);
        if (legPath.length > 1) {
          fullPathNodes.push(...legPath.slice(1));
        }

        legDetails.push({
          from: currentNode,
          to: destination,
          distanceKm: distToDest,
          estimatedTimeMinutes: Math.round((distToDest / 50) * 60),
          pathWaypoints: legPath.map((id) => this.getNode(id) || { id }),
        });
      }

      orderedStops.push(destination);
    }

    return {
      optimalSequence: orderedStops.map((id) => this.getNode(id) || { id }),
      totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
      legDetails,
      fullPathNodes: fullPathNodes.map((id) => this.getNode(id) || { id }),
    };
  }
}

/**
 * Built-in Regional Agricultural Network
 * Pre-seeded with major agricultural corridors and hubs in Telangana/Andhra region.
 */
function createRegionalAgriNetwork() {
  const graph = new WeightedGraph();

  // Nodes: Major Agricultural Markets, Collection Centers & Buyer Hubs
  const hubs = [
    { id: "HYD_HUB", name: "Hyderabad Central Logistics Hub", type: "hub", latitude: 17.385, longitude: 78.4867 },
    { id: "NALGONDA_CC", name: "Nalgonda Collection Center", type: "collection_center", latitude: 17.0575, longitude: 79.2684 },
    { id: "SURYAPET_WH", name: "Suryapet Grain Warehouse", type: "warehouse", latitude: 17.1439, longitude: 79.6239 },
    { id: "WARANGAL_MKT", name: "Warangal Cotton & Chilli Yard", type: "market", latitude: 17.9689, longitude: 79.5941 },
    { id: "KHAMMAM_CC", name: "Khammam Collection Center", type: "collection_center", latitude: 17.2473, longitude: 80.1514 },
    { id: "KARIMNAGAR_WH", name: "Karimnagar Cold Storage", type: "warehouse", latitude: 18.4386, longitude: 79.1288 },
    { id: "NIZAMABAD_MKT", name: "Nizamabad Turmeric Market", type: "market", latitude: 18.6725, longitude: 78.0941 },
    { id: "MAHBUBNAGAR_CC", name: "Mahbubnagar Groundnut Depot", type: "collection_center", latitude: 16.7488, longitude: 78.0035 },
    { id: "GUNTUR_BUYER", name: "Guntur Agri Processing Plant", type: "buyer", latitude: 16.3067, longitude: 80.4365 },
    { id: "VIJAYAWADA_BUYER", name: "Vijayawada Wholesale Terminal", type: "buyer", latitude: 16.5062, longitude: 80.648 },
  ];

  for (const hub of hubs) {
    graph.addNode(hub.id, hub);
  }

  // Pre-configured weighted road connections (distance in km)
  const roadEdges = [
    ["HYD_HUB", "NALGONDA_CC", 102],
    ["HYD_HUB", "WARANGAL_MKT", 148],
    ["HYD_HUB", "MAHBUBNAGAR_CC", 100],
    ["HYD_HUB", "NIZAMABAD_MKT", 175],
    ["HYD_HUB", "KARIMNAGAR_WH", 164],
    ["NALGONDA_CC", "SURYAPET_WH", 42],
    ["SURYAPET_WH", "KHAMMAM_CC", 65],
    ["SURYAPET_WH", "VIJAYAWADA_BUYER", 135],
    ["WARANGAL_MKT", "KARIMNAGAR_WH", 72],
    ["WARANGAL_MKT", "KHAMMAM_CC", 118],
    ["KHAMMAM_CC", "VIJAYAWADA_BUYER", 120],
    ["VIJAYAWADA_BUYER", "GUNTUR_BUYER", 34],
    ["MAHBUBNAGAR_CC", "NALGONDA_CC", 125],
    ["KARIMNAGAR_WH", "NIZAMABAD_MKT", 145],
  ];

  for (const [u, v, weight] of roadEdges) {
    graph.addEdge(u, v, weight);
  }

  return graph;
}

/**
 * RouteOptimizer Class providing both backward-compatible API and Dijkstra graph engine.
 */
class RouteOptimizer {
  /**
   * Main Dijkstra route optimization entry point.
   * Can accept node IDs (strings) or location objects with coordinates { latitude, longitude }.
   */
  static optimizeWithDijkstra({ stops = [], startPoint = null, endPoint = null, customGraph = null }) {
    if (!Array.isArray(stops) || stops.length === 0) {
      return { optimalSequence: [], totalDistanceKm: 0, legDetails: [] };
    }

    const network = customGraph || createRegionalAgriNetwork();

    // Check if stops are coordinate objects or node IDs
    const areCoordinates = stops.some((s) => typeof s === "object" && s !== null && (s.latitude || s.lat));

    if (areCoordinates) {
      // Build dynamic coordinate-based graph or optimize via Haversine + Dijkstra
      const graph = new WeightedGraph();
      const allPoints = [];

      if (startPoint) allPoints.push({ id: "START", ...startPoint });
      stops.forEach((s, i) => allPoints.push({ id: s.id || `STOP_${i + 1}`, ...s }));
      if (endPoint) allPoints.push({ id: "END", ...endPoint });

      // Add nodes
      allPoints.forEach((p) => graph.addNode(p.id, p));

      // Add all-pairs edges with Haversine distance * road tortuosity factor (1.2)
      for (let i = 0; i < allPoints.length; i++) {
        for (let j = i + 1; j < allPoints.length; j++) {
          const dist = Number((haversineKm(allPoints[i], allPoints[j]) * 1.2).toFixed(2));
          graph.addEdge(allPoints[i].id, allPoints[j].id, dist);
        }
      }

      const startId = startPoint ? "START" : allPoints[0].id;
      const endId = endPoint ? "END" : null;
      const intermediateIds = allPoints
        .filter((p) => p.id !== startId && p.id !== endId)
        .map((p) => p.id);

      return graph.optimizeDeliveryRoute(startId, intermediateIds, endId);
    }

    // Node ID based routing
    const startId = startPoint ? String(startPoint.id || startPoint) : String(stops[0]);
    const stopIds = stops.map((s) => String(s.id || s)).filter((id) => id !== startId);
    const endId = endPoint ? String(endPoint.id || endPoint) : null;

    return network.optimizeDeliveryRoute(startId, stopIds, endId);
  }

  /**
   * Backward-compatible nearest-neighbor method for simple stop lists.
   */
  static optimizeStops(stops, startPoint = null) {
    if (!Array.isArray(stops) || stops.length === 0) {
      return { route: [], totalDistanceKm: 0, distanceKm: 0 };
    }

    // Call Dijkstra multi-stop optimizer for accurate routing
    const dijkstraResult = RouteOptimizer.optimizeWithDijkstra({
      stops,
      startPoint,
    });

    const route = dijkstraResult.optimalSequence || [];
    const totalDistanceKm = dijkstraResult.totalDistanceKm || 0;

    return {
      route,
      totalDistanceKm,
      distanceKm: totalDistanceKm,
      legDetails: dijkstraResult.legDetails,
      fullPathNodes: dijkstraResult.fullPathNodes,
    };
  }

  static calculateRouteDistance(route) {
    if (!Array.isArray(route) || route.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < route.length; i++) {
      total += haversineKm(route[i - 1], route[i]);
    }
    return Number(total.toFixed(2));
  }
}

module.exports = {
  haversineKm,
  PriorityQueue,
  WeightedGraph,
  createRegionalAgriNetwork,
  RouteOptimizer,
};
