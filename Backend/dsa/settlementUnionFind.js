class SettlementUnionFind {
  constructor(items = []) {
    this.parent = new Map();
    this.rank = new Map();

    for (const item of items) {
      this.add(item);
    }
  }

  add(item) {
    if (this.parent.has(item)) {
      return this;
    }

    this.parent.set(item, item);
    this.rank.set(item, 0);
    return this;
  }

  find(item) {
    if (!this.parent.has(item)) {
      throw new Error(`Settlement item not found: ${item}`);
    }

    if (this.parent.get(item) !== item) {
      this.parent.set(item, this.find(this.parent.get(item)));
    }

    return this.parent.get(item);
  }

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

  size(item) {
    const root = this.find(item);
    const group = this.getGroups().find((members) => members.includes(root));
    return group ? group.length : 0;
  }
}

function buildSettlementUnionFind(items = []) {
  return new SettlementUnionFind(items);
}

module.exports = {
  SettlementUnionFind,
  buildSettlementUnionFind,
};
