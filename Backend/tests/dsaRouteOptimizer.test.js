const test = require("node:test");
const assert = require("node:assert/strict");
const {
  WeightedGraph,
  PriorityQueue,
  createRegionalAgriNetwork,
  RouteOptimizer,
  haversineKm,
} = require("../dsa/routeOptimizer");

test("PriorityQueue maintains min priority at root", () => {
  const pq = new PriorityQueue();
  pq.push("nodeA", 50);
  pq.push("nodeB", 10);
  pq.push("nodeC", 30);

  assert.equal(pq.size, 3);
  assert.equal(pq.pop().element, "nodeB");
  assert.equal(pq.pop().element, "nodeC");
  assert.equal(pq.pop().element, "nodeA");
  assert.equal(pq.isEmpty(), true);
});

test("WeightedGraph Dijkstra finds shortest paths accurately", () => {
  const graph = new WeightedGraph();
  // Build triangle network: A -> B (10), B -> C (15), A -> C (30)
  graph.addEdge("A", "B", 10);
  graph.addEdge("B", "C", 15);
  graph.addEdge("A", "C", 30);

  const result = graph.dijkstra("A");

  // Shortest path A to C is through B (10 + 15 = 25 < 30)
  assert.equal(result.getDistance("C"), 25);
  assert.deepEqual(result.getPath("C"), ["A", "B", "C"]);
});

test("Regional Agricultural Network Dijkstra routing", () => {
  const network = createRegionalAgriNetwork();

  // Route from Nalgonda CC to Vijayawada Wholesale Terminal
  // Nalgonda -> Suryapet (42) -> Vijayawada (135) = 177 km
  const result = network.dijkstra("NALGONDA_CC", "VIJAYAWADA_BUYER");

  const distance = result.getDistance("VIJAYAWADA_BUYER");
  assert.equal(distance, 177);

  const path = result.getPath("VIJAYAWADA_BUYER");
  assert.deepEqual(path, ["NALGONDA_CC", "SURYAPET_WH", "VIJAYAWADA_BUYER"]);
});

test("Multi-Stop logistics delivery route optimization", () => {
  const network = createRegionalAgriNetwork();

  // Shipment starts at HYD_HUB, needs to visit SURYAPET_WH and NALGONDA_CC, then finish at VIJAYAWADA_BUYER
  const result = network.optimizeDeliveryRoute(
    "HYD_HUB",
    ["SURYAPET_WH", "NALGONDA_CC"],
    "VIJAYAWADA_BUYER"
  );

  assert.ok(result.totalDistanceKm > 0);
  assert.ok(result.optimalSequence.length >= 4);

  // Sequence should visit Nalgonda before Suryapet when traveling from Hyderabad
  const seqIds = result.optimalSequence.map((n) => n.id);
  assert.equal(seqIds[0], "HYD_HUB");
  assert.equal(seqIds[1], "NALGONDA_CC");
  assert.equal(seqIds[2], "SURYAPET_WH");
  assert.equal(seqIds[3], "VIJAYAWADA_BUYER");
});

test("haversineKm calculates great-circle distance between coordinates", () => {
  // Hyderabad: 17.385, 78.4867. Warangal: 17.9689, 79.5941 (~135 km geodesic)
  const d = haversineKm(
    { latitude: 17.385, longitude: 78.4867 },
    { latitude: 17.9689, longitude: 79.5941 }
  );

  assert.ok(d > 130 && d < 150);
});
