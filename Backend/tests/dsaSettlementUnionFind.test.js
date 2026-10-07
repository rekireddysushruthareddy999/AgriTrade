const test = require("node:test");
const assert = require("node:assert/strict");
const {
  SettlementUnionFind,
  buildSettlementUnionFind,
} = require("../dsa/settlementUnionFind");

test("SettlementUnionFind performs union and find with path compression and rank", () => {
  const dsu = buildSettlementUnionFind();

  dsu.add("lot-1");
  dsu.add("lot-2");
  dsu.add("lot-3");
  dsu.add("lot-4");

  assert.equal(dsu.isConnected("lot-1", "lot-2"), false);

  dsu.union("lot-1", "lot-2");
  assert.equal(dsu.isConnected("lot-1", "lot-2"), true);

  dsu.union("lot-2", "lot-3");
  // Transitive connectivity
  assert.equal(dsu.isConnected("lot-1", "lot-3"), true);
  assert.equal(dsu.isConnected("lot-1", "lot-4"), false);

  assert.equal(dsu.size("lot-1"), 3);
  assert.equal(dsu.size("lot-4"), 1);
});

test("SettlementUnionFind batchFarmerLots clusters lots by farmer into single settlement groups", () => {
  const lots = [
    { id: "lot-f1-a", farmerId: "farmer-1", quantity: 100 },
    { id: "lot-f1-b", farmerId: "farmer-1", quantity: 200 },
    { id: "lot-f2-a", farmerId: "farmer-2", quantity: 150 },
    { id: "lot-f1-c", farmerId: "farmer-1", quantity: 50 },
  ];

  const batches = SettlementUnionFind.batchFarmerLots(lots, 1);

  // Exactly 2 batches: one for farmer-1 (3 lots) and one for farmer-2 (1 lot)
  assert.equal(batches.length, 2);

  const f1Batch = batches.find((b) => b.farmerId === "farmer-1");
  assert.ok(f1Batch);
  assert.equal(f1Batch.lotCount, 3);
  assert.equal(f1Batch.totalQuantity, 350);
  assert.ok(f1Batch.batchGroupId.includes("BATCH_C1"));

  const f2Batch = batches.find((b) => b.farmerId === "farmer-2");
  assert.ok(f2Batch);
  assert.equal(f2Batch.lotCount, 1);
  assert.equal(f2Batch.totalQuantity, 150);
});
