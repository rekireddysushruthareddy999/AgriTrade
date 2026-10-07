/**
 * AgriTrade - DSA Module 4.1: Warehouse Allocation Engine (FEFO) — Min-Heap
 *
 * Problem Solved:
 * Perishable produce spoils if allocated FIFO (First-In, First-Out) or randomly.
 * AgriTrade allocates stock to purchase orders using First-Expired-First-Out (FEFO),
 * prioritizing lots closest to expiration date to minimize spoilage and waste.
 *
 * DSA Characteristics:
 * - Binary Min-Heap keyed on `expiryEstimate` (timestamp / freshness score).
 * - O(log n) insert on lot storage.
 * - O(1) peek for "what lot should ship next."
 * - O(log n) pop for lot dispatch / order allocation.
 */

class WarehouseAllocationHeap {
  /**
   * @param {Function} [compareFn] Comparator: returns negative if a has higher priority (earlier expiry) than b.
   */
  constructor(compareFn = null) {
    this.heap = [];
    this.compareFn =
      compareFn ||
      ((a, b) => {
        const timeA = WarehouseAllocationHeap.getExpiryTimestamp(a);
        const timeB = WarehouseAllocationHeap.getExpiryTimestamp(b);
        if (timeA !== timeB) return timeA - timeB;
        // Secondary priority: higher grade (A > B > C) or earlier harvest
        const gradeRank = { A: 1, B: 2, C: 3, D: 4, F: 5 };
        const gA = gradeRank[a?.grade] || 99;
        const gB = gradeRank[b?.grade] || 99;
        if (gA !== gB) return gA - gB;
        return Number(a?.quantity || 0) - Number(b?.quantity || 0);
      });
  }

  /**
   * Helper to normalize expiry timestamps across dates, strings, or numbers.
   */
  static getExpiryTimestamp(item) {
    if (!item) return Number.POSITIVE_INFINITY;
    if (item.expiryEstimate) {
      const parsed = new Date(item.expiryEstimate).getTime();
      return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
    }
    if (item.priority !== undefined) {
      return Number(item.priority);
    }
    return Number.POSITIVE_INFINITY;
  }

  get size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  /**
   * O(1) peek at the root element (soonest-to-expire lot).
   */
  peek() {
    return this.heap[0] || null;
  }

  /**
   * O(log n) insert of a new lot into the heap.
   */
  push(item) {
    if (!item) return this.heap.length;
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
    return this.heap.length;
  }

  /**
   * O(log n) extract the soonest-to-expire lot from the heap.
   */
  pop() {
    if (this.heap.length === 0) {
      return null;
    }

    const first = this.heap[0];
    const last = this.heap.pop();

    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }

    return first;
  }

  bubbleUp(index) {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compareFn(this.heap[index], this.heap[parentIndex]) >= 0) {
        break;
      }
      [this.heap[index], this.heap[parentIndex]] = [
        this.heap[parentIndex],
        this.heap[index],
      ];
      index = parentIndex;
    }
  }

  bubbleDown(index) {
    const length = this.heap.length;
    while (true) {
      const leftIndex = 2 * index + 1;
      const rightIndex = 2 * index + 2;
      let smallestIndex = index;

      if (
        leftIndex < length &&
        this.compareFn(this.heap[leftIndex], this.heap[smallestIndex]) < 0
      ) {
        smallestIndex = leftIndex;
      }

      if (
        rightIndex < length &&
        this.compareFn(this.heap[rightIndex], this.heap[smallestIndex]) < 0
      ) {
        smallestIndex = rightIndex;
      }

      if (smallestIndex === index) {
        break;
      }

      [this.heap[index], this.heap[smallestIndex]] = [
        this.heap[smallestIndex],
        this.heap[index],
      ];
      index = smallestIndex;
    }
  }

  toArray() {
    return [...this.heap];
  }

  /**
   * Build a min-heap from an existing array of lots in O(n) time.
   */
  static fromList(lots, compareFn = null) {
    const heapInstance = new WarehouseAllocationHeap(compareFn);
    if (!Array.isArray(lots)) return heapInstance;

    // Linear-time bottom-up heapify
    heapInstance.heap = lots.filter(Boolean).map((lot) => ({ ...lot }));
    for (let i = Math.floor(heapInstance.heap.length / 2) - 1; i >= 0; i--) {
      heapInstance.bubbleDown(i);
    }
    return heapInstance;
  }
}

/**
 * FEFO Allocation Engine:
 * Allocates available lots to fulfill a requested quantity for a Purchase Order Item.
 * Lots closest to expiry are popped and assigned first.
 *
 * @param {Array<Object>} availableLots Available lots of the target produce category.
 * @param {number} requestedQuantity Total quantity needed.
 * @returns {Object} Allocation plan with assigned lots, quantities, and fulfillment status.
 */
function allocateLotsFEFO(availableLots = [], requestedQuantity = 0) {
  const needed = Number(requestedQuantity) || 0;
  if (needed <= 0 || !Array.isArray(availableLots) || availableLots.length === 0) {
    return {
      allocations: [],
      totalFulfilled: 0,
      remainingNeeded: needed,
      isFullyFulfilled: false,
    };
  }

  // Create Min-Heap containing all valid available lots
  const heap = WarehouseAllocationHeap.fromList(
    availableLots.filter((lot) => Number(lot.quantity || 0) > 0)
  );

  const allocations = [];
  let remainingNeeded = needed;
  let totalFulfilled = 0;

  while (!heap.isEmpty() && remainingNeeded > 0) {
    // O(log n) pop the soonest-to-expire lot
    const lot = heap.pop();
    const availableQty = Number(lot.quantity || 0);

    if (availableQty <= 0) continue;

    const allocatedQuantity = Math.min(remainingNeeded, availableQty);
    const remainingLotQuantity = availableQty - allocatedQuantity;

    allocations.push({
      lotId: lot._id || lot.id,
      lot,
      allocatedQuantity,
      remainingLotQuantity,
      expiryEstimate: lot.expiryEstimate,
      freshnessDays: Math.max(
        0,
        Math.ceil(
          (new Date(lot.expiryEstimate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      ),
    });

    totalFulfilled += allocatedQuantity;
    remainingNeeded -= allocatedQuantity;
  }

  return {
    allocations,
    totalFulfilled,
    remainingNeeded: Math.max(0, remainingNeeded),
    isFullyFulfilled: remainingNeeded <= 0,
  };
}

/**
 * Identify lots expiring within the specified days threshold using the Min-Heap.
 *
 * @param {Array<Object>} lots Lots to check.
 * @param {number} daysAhead Number of days in the look-ahead window.
 * @returns {Array<Object>} Sorted list of near-expiry lots (soonest first).
 */
function getNearExpiryLotsFromHeap(lots = [], daysAhead = 3) {
  if (!Array.isArray(lots) || lots.length === 0) return [];

  const heap = WarehouseAllocationHeap.fromList(lots);
  const cutoffTime = Date.now() + daysAhead * 24 * 60 * 60 * 1000;
  const expiringLots = [];

  while (!heap.isEmpty()) {
    const nextLot = heap.peek();
    const expiryTime = WarehouseAllocationHeap.getExpiryTimestamp(nextLot);

    // If the next lot expires after our cutoff window, no subsequent lots in the heap will expire before it
    if (expiryTime > cutoffTime) {
      break;
    }

    const popped = heap.pop();
    expiringLots.push({
      ...popped,
      daysRemaining: Math.max(
        0,
        Math.ceil((expiryTime - Date.now()) / (1000 * 60 * 60 * 24))
      ),
    });
  }

  return expiringLots;
}

/**
 * Backward-compatible helper for warehouse capacity assignment.
 */
function allocateWarehouses(warehouses, lots) {
  if (!Array.isArray(warehouses) || !Array.isArray(lots)) {
    return [];
  }

  const prioritizedWarehouses = warehouses
    .map((warehouse) => ({
      id: warehouse.id || warehouse.warehouseId || warehouse._id || warehouse.name,
      warehouse,
      priority:
        Number(
          warehouse.costPerUnit ?? warehouse.cost ?? warehouse.priority ?? 0
        ) + Number(warehouse.distance ?? 0),
      capacity: Number(warehouse.availableCapacity ?? warehouse.capacity ?? 0),
    }))
    .sort((a, b) => a.priority - b.priority);

  const assignments = [];
  const remainingWarehouses = prioritizedWarehouses.map((entry) => ({
    ...entry,
  }));

  for (const lot of lots) {
    const requiredQuantity = Number(lot.quantity ?? lot.amount ?? 0);
    const selection = remainingWarehouses.find(
      (warehouse) => warehouse.capacity >= requiredQuantity
    );

    if (!selection) {
      assignments.push({
        lotId: lot.id || lot.lotId || lot._id || lot.name,
        allocated: false,
        reason: "No warehouse with enough capacity.",
      });
      continue;
    }

    selection.capacity -= requiredQuantity;
    assignments.push({
      lotId: lot.id || lot.lotId || lot._id || lot.name,
      warehouseId: selection.id,
      allocated: true,
      quantity: requiredQuantity,
    });
  }

  return assignments;
}

module.exports = {
  WarehouseAllocationHeap,
  allocateLotsFEFO,
  getNearExpiryLotsFromHeap,
  allocateWarehouses,
};
