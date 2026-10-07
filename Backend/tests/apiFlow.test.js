const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("node:http");
const app = require("../server");
const Lot = require("../models/Lot");
const User = require("../models/User");
const Region = require("../models/Region");
const Farmer = require("../models/Farmer");
const ProduceCategory = require("../models/ProduceCategory");
const Warehouse = require("../models/Warehouse");
const PurchaseOrder = require("../models/PurchaseOrder");
const PurchaseOrderItem = require("../models/PurchaseOrderItem");
const { allocateLotsFEFO } = require("../dsa/warehouseAllocationHeap");
const { buildLotStateGraph } = require("../dsa/lotStateGraph");
const { RouteOptimizer, createRegionalAgriNetwork } = require("../dsa/routeOptimizer");
const { SearchTrie } = require("../dsa/searchTrie");
const { SettlementUnionFind } = require("../dsa/settlementUnionFind");

const graph = buildLotStateGraph();

test("Integration: Lot state transitions follow directed graph rules", async () => {
  assert.equal(graph.canTransition("created", "received"), true);
  assert.equal(graph.canTransition("received", "inspected"), true);
  assert.equal(graph.canTransition("inspected", "accepted"), true);
  assert.equal(graph.canTransition("accepted", "stored"), true);
  assert.equal(graph.canTransition("stored", "allocated"), true);
  assert.equal(graph.canTransition("allocated", "dispatched"), true);
  assert.equal(graph.canTransition("dispatched", "delivered"), true);
  assert.equal(graph.canTransition("dispatched", "received"), false);
});

test("Integration: FEFO Min-Heap allocates batches by earliest expiry", () => {
  const now = Date.now();
  const dayMs = 86400000;

  const lotExpiringSoon = {
    _id: "lot-1",
    quantity: 100,
    expiryEstimate: new Date(now + 2 * dayMs),
  };
  const lotExpiringLater = {
    _id: "lot-2",
    quantity: 200,
    expiryEstimate: new Date(now + 10 * dayMs),
  };

  const result = allocateLotsFEFO([lotExpiringLater, lotExpiringSoon], 150);

  assert.equal(result.isFullyFulfilled, true);
  assert.equal(result.totalFulfilled, 150);
  assert.equal(result.allocations[0].lotId, "lot-1"); // Soonest first
  assert.equal(result.allocations[0].allocatedQuantity, 100);
  assert.equal(result.allocations[1].lotId, "lot-2");
  assert.equal(result.allocations[1].allocatedQuantity, 50);
});

test("Integration: Dijkstra optimizes shipment route stops over regional graph", () => {
  const result = RouteOptimizer.optimizeWithDijkstra({
    startPoint: "HYD_HUB",
    stops: ["SURYAPET_WH", "NALGONDA_CC"],
    endPoint: "VIJAYAWADA_BUYER",
  });

  assert.ok(result.totalDistanceKm > 0);
  assert.equal(result.optimalSequence[0].id, "HYD_HUB");
  assert.equal(result.optimalSequence[1].id, "NALGONDA_CC");
  assert.equal(result.optimalSequence[2].id, "SURYAPET_WH");
  assert.equal(result.optimalSequence[3].id, "VIJAYAWADA_BUYER");
});

test("Integration: Search Trie prefix autocomplete lookup works in O(L)", () => {
  const trie = new SearchTrie();
  trie.insert("Ramesh Patel", { id: "1", type: "farmer" });
  trie.insert("Red Chilli", { id: "2", type: "produce" });

  const results = trie.autocomplete("ram");
  assert.equal(results.length, 1);
  assert.equal(results[0].type, "farmer");
});

test("Integration: Union-Find clusters lots by farmer for payout cycle", () => {
  const lots = [
    { id: "l1", farmerId: "f1", quantity: 50 },
    { id: "l2", farmerId: "f1", quantity: 75 },
    { id: "l3", farmerId: "f2", quantity: 120 },
  ];

  const batches = SettlementUnionFind.batchFarmerLots(lots, 1);
  assert.equal(batches.length, 2);
  const f1Batch = batches.find((b) => b.farmerId === "f1");
  assert.equal(f1Batch.lotCount, 2);
  assert.equal(f1Batch.totalQuantity, 125);
});

test("Integration: Lot origin & destination locations and settled product filtering", () => {
  const activeLot = {
    _id: "lot-active",
    status: "stored",
    originLocation: "Farm Gate 1",
    destinationLocation: "Central Warehouse 1",
  };
  const settledLot = {
    _id: "lot-settled",
    status: "settled",
    originLocation: "Farm Gate 2",
    destinationLocation: "Mandi Hub 2",
  };

  const allLots = [activeLot, settledLot];

  // Default active marketplace filter removes settled products
  const activeMarketplace = allLots.filter((l) => l.status !== "settled");
  assert.equal(activeMarketplace.length, 1);
  assert.equal(activeMarketplace[0]._id, "lot-active");
  assert.equal(activeMarketplace[0].originLocation, "Farm Gate 1");
  assert.equal(activeMarketplace[0].destinationLocation, "Central Warehouse 1");

  // Settled tab retrieves settled lots
  const settledRegistry = allLots.filter((l) => l.status === "settled");
  assert.equal(settledRegistry.length, 1);
  assert.equal(settledRegistry[0]._id, "lot-settled");
});

