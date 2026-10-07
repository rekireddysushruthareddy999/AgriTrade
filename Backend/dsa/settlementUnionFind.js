/**
 * AgriTrade - DSA Module 4.5: Settlement Batching — Union-Find (Disjoint Set)
 *
 * Problem Solved:
 * A single farmer may supply multiple produce lots across different purchase orders
 * and warehouses within the same settlement/payout cycle. Issuing separate micro-payouts
 * per lot creates massive administrative and banking overhead.
 *
 * DSA Characteristics:
 * - Disjoint Set Union (DSU) with Path Compression and Union by Rank.
 * - Nearly O(1) amortized operations (Inverse Ackermann complexity α(N)).
 * - Automatically clusters lots by farmer and payment cycle into unified payout sets.
 */

class SettlementUnionFind {
  constructor(items = []) {
    this.parent = new Map();
    this.rank = new Map();
    this.metadata = new Map();

    for (const item of items) {
      this.add(item);
    }
  }

  /**
   * Initializes a new singleton set for an item.
   * O(1) time.
   */
  add(item, data = null) {
    const key = String(item);
    if (this.parent.has(key)) return this;

    this.parent.set(key, key);
    this.rank.set(key, 0);
    if (data) {
      this.metadata.set(key, data);
    }
    return this;
  }

  has(item) {
    return this.parent.has(String(item));
  }

  /**
   * Find operation with full path compression.
   * Points visited nodes directly to the root representative.
   * Amortized O(α(N)) time.
   */
  find(item) {
    const key = String(item);
    if (!this.parent.has(key)) {
      this.add(key);
      return key;
    }

    if (this.parent.get(key) !== key) {
      // Path compression
      this.parent.set(key, this.find(this.parent.get(key)));
    }

    return this.parent.get(key);
  }

  /**
   * Union operation with Union by Rank.
   * Attaches the shallower tree under the root of the deeper tree.
   * Amortized O(α(N)) time.
   */
  union(firstItem, secondItem) {
    const rootA = this.find(firstItem);
    const rootB = this.find(secondItem);

    if (rootA === rootB) {
      return rootA;
    }

    const rankA = this.rank.get(rootA) || 0;
    const rankB = this.rank.get(rootB) || 0;

    if (rankA < rankB) {
      this.parent.set(rootA, rootB);
      return rootB;
    }

    if (rankA > rankB) {
      this.parent.set(rootB, rootA);
      return rootA;
    }

    this.parent.set(rootB, rootA);
    this.rank.set(rootA, rankA + 1);
    return rootA;
  }

  isConnected(itemA, itemB) {
    if (!this.has(itemA) || !this.has(itemB)) return false;
    return this.find(itemA) === this.find(itemB);
  }

  /**
   * Returns all disjoint components grouped by their root representative.
   * @returns {Array<Array<string>>}
   */
  getGroups() {
    const groups = new Map();

    for (const item of this.parent.keys()) {
      const root = this.find(item);
      if (!groups.has(root)) {
        groups.set(root, []);
      }
      groups.get(root).push(item);
    }

    return Array.from(groups.values());
  }

  /**
   * Get total count of items in the group containing `item`.
   */
  size(item) {
    const key = String(item);
    if (!this.parent.has(key)) return 0;
    const root = this.find(key);
    const group = this.getGroups().find((members) => members.includes(root));
    return group ? group.length : 0;
  }

  /**
   * High-Level Settlement Batching Utility:
   * Takes a collection of lots eligible for payout in a given cycle,
   * unions all lots belonging to the same farmer, and creates batched settlement payloads.
   *
   * @param {Array<Object>} lots
   * @param {number} cycle
   * @returns {Array<Object>} Batched settlement groups ready for calculation.
   */
  static batchFarmerLots(lots = [], cycle = 1) {
    if (!Array.isArray(lots) || lots.length === 0) return [];

    const dsu = new SettlementUnionFind();
    const lotsByFarmer = new Map();

    // Group lots by farmerId
    for (const lot of lots) {
      const lotId = String(lot._id || lot.id);
      const farmerId = String(lot.farmerId?._id || lot.farmerId || "UNKNOWN_FARMER");

      dsu.add(lotId, lot);

      if (!lotsByFarmer.has(farmerId)) {
        lotsByFarmer.set(farmerId, []);
      }
      lotsByFarmer.get(farmerId).push(lot);
    }

    // Perform union operations for all lots belonging to the same farmer
    for (const [farmerId, farmerLots] of lotsByFarmer.entries()) {
      if (farmerLots.length > 1) {
        const firstLotId = String(farmerLots[0]._id || farmerLots[0].id);
        for (let i = 1; i < farmerLots.length; i++) {
          const subsequentLotId = String(farmerLots[i]._id || farmerLots[i].id);
          dsu.union(firstLotId, subsequentLotId);
        }
      }
    }

    // Extract grouped sets
    const lotIdToLotMap = new Map();
    lots.forEach((l) => lotIdToLotMap.set(String(l._id || l.id), l));

    const batches = [];
    const disjointGroups = dsu.getGroups();

    for (const memberIds of disjointGroups) {
      const groupLots = memberIds
        .map((id) => lotIdToLotMap.get(id))
        .filter(Boolean);

      if (groupLots.length === 0) continue;

      const primaryLot = groupLots[0];
      const farmerId = primaryLot.farmerId?._id || primaryLot.farmerId;
      const totalQuantity = groupLots.reduce((sum, l) => sum + Number(l.quantity || 0), 0);
      const batchGroupId = `BATCH_C${cycle}_F${String(farmerId).slice(-6)}_${Date.now().toString(36)}`;

      batches.push({
        batchGroupId,
        farmerId,
        farmer: primaryLot.farmerId,
        cycle: Number(cycle),
        lotIds: memberIds,
        lots: groupLots,
        totalQuantity,
        lotCount: groupLots.length,
      });
    }

    return batches;
  }
}

function buildSettlementUnionFind(items = []) {
  return new SettlementUnionFind(items);
}

module.exports = {
  SettlementUnionFind,
  buildSettlementUnionFind,
};
