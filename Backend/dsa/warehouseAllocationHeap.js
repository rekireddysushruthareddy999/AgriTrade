class WarehouseAllocationHeap {
  constructor(compareFn = (a, b) => a.priority - b.priority) {
    this.heap = [];
    this.compareFn = compareFn;
  }

  get size() {
    return this.heap.length;
  }

  peek() {
    return this.heap[0] || null;
  }

  push(item) {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
    return this.heap.length;
  }

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
}

function allocateWarehouses(warehouses, lots) {
  if (!Array.isArray(warehouses) || !Array.isArray(lots)) {
    return [];
  }

  const prioritizedWarehouses = warehouses
    .map((warehouse) => ({
      id: warehouse.id || warehouse.warehouseId || warehouse.name,
      warehouse,
      priority:
        Number(
          warehouse.costPerUnit ?? warehouse.cost ?? warehouse.priority ?? 0,
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
      (warehouse) => warehouse.capacity >= requiredQuantity,
    );

    if (!selection) {
      assignments.push({
        lotId: lot.id || lot.lotId || lot.name,
        allocated: false,
        reason: "No warehouse with enough capacity.",
      });
      continue;
    }

    selection.capacity -= requiredQuantity;
    assignments.push({
      lotId: lot.id || lot.lotId || lot.name,
      warehouseId: selection.id,
      allocated: true,
      quantity: requiredQuantity,
    });
  }

  return assignments;
}

module.exports = {
  WarehouseAllocationHeap,
  allocateWarehouses,
};
