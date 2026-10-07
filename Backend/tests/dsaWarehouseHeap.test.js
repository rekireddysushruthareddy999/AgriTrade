const test = require("node:test");
const assert = require("node:assert/strict");
const {
  WarehouseAllocationHeap,
  allocateLotsFEFO,
  getNearExpiryLotsFromHeap,
} = require("../dsa/warehouseAllocationHeap");

test("WarehouseAllocationHeap maintains min-heap property on expiryEstimate", () => {
  const heap = new WarehouseAllocationHeap();

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const lot1 = { id: "lot-1", expiryEstimate: new Date(now + 10 * dayMs) };
  const lot2 = { id: "lot-2", expiryEstimate: new Date(now + 2 * dayMs) };
  const lot3 = { id: "lot-3", expiryEstimate: new Date(now + 5 * dayMs) };
  const lot4 = { id: "lot-4", expiryEstimate: new Date(now + 1 * dayMs) };

  heap.push(lot1);
  heap.push(lot2);
  heap.push(lot3);
  heap.push(lot4);

  assert.equal(heap.size, 4);

  // Peek should return the soonest to expire (lot4: 1 day) in O(1)
  assert.equal(heap.peek().id, "lot-4");

  // Popping extracts items in ascending order of expiry
  assert.equal(heap.pop().id, "lot-4");
  assert.equal(heap.pop().id, "lot-2");
  assert.equal(heap.pop().id, "lot-3");
  assert.equal(heap.pop().id, "lot-1");
  assert.equal(heap.isEmpty(), true);
});

test("allocateLotsFEFO fulfills purchase order items using First-Expired-First-Out", () => {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const lots = [
    { id: "lot-fresh", quantity: 300, expiryEstimate: new Date(now + 15 * dayMs) },
    { id: "lot-expiring-soon", quantity: 150, expiryEstimate: new Date(now + 2 * dayMs) },
    { id: "lot-mid", quantity: 200, expiryEstimate: new Date(now + 6 * dayMs) },
  ];

  // Request 250 units
  const result = allocateLotsFEFO(lots, 250);

  assert.equal(result.isFullyFulfilled, true);
  assert.equal(result.totalFulfilled, 250);
  assert.equal(result.remainingNeeded, 0);

  // First allocated lot MUST be the soonest to expire (lot-expiring-soon, 150 units)
  assert.equal(result.allocations[0].lotId, "lot-expiring-soon");
  assert.equal(result.allocations[0].allocatedQuantity, 150);

  // Next allocated lot should be lot-mid (100 units partial)
  assert.equal(result.allocations[1].lotId, "lot-mid");
  assert.equal(result.allocations[1].allocatedQuantity, 100);
  assert.equal(result.allocations[1].remainingLotQuantity, 100);
});

test("allocateLotsFEFO handles insufficient stock gracefully", () => {
  const lots = [
    { id: "lot-1", quantity: 50, expiryEstimate: new Date(Date.now() + 50000) },
  ];

  const result = allocateLotsFEFO(lots, 200);
  assert.equal(result.isFullyFulfilled, false);
  assert.equal(result.totalFulfilled, 50);
  assert.equal(result.remainingNeeded, 150);
});

test("getNearExpiryLotsFromHeap detects lots expiring within threshold window", () => {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const lots = [
    { id: "lot-critical", expiryEstimate: new Date(now + 1 * dayMs) },
    { id: "lot-safe", expiryEstimate: new Date(now + 20 * dayMs) },
    { id: "lot-warning", expiryEstimate: new Date(now + 3 * dayMs) },
  ];

  const expiring = getNearExpiryLotsFromHeap(lots, 4);
  assert.equal(expiring.length, 2);
  assert.equal(expiring[0].id, "lot-critical");
  assert.equal(expiring[1].id, "lot-warning");
});
