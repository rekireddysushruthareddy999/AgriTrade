const LOT_STATUSES = Object.freeze([
  "available",
  "reserved",
  "inspected",
  "shipped",
  "settled",
  "expired",
]);

const LOT_TRANSITIONS = Object.freeze({
  available: ["reserved", "expired"],
  reserved: ["available", "inspected"],
  inspected: ["shipped", "expired"],
  shipped: ["settled", "expired"],
  settled: [],
  expired: [],
});

class LotStateGraph {
  constructor(transitions = LOT_TRANSITIONS) {
    this.transitions = Object.freeze({
      ...Object.fromEntries(
        Object.entries(transitions).map(([state, nextStates]) => [
          state,
          Array.isArray(nextStates) ? [...nextStates] : [],
        ]),
      ),
    });
  }

  getNextStates(state) {
    if (!state) {
      return [];
    }
    return [...(this.transitions[state] || [])];
  }

  canTransition(fromState, toState) {
    if (!fromState || !toState) {
      return false;
    }
    return this.getNextStates(fromState).includes(toState);
  }

  shortestPath(fromState, toState) {
    if (!fromState || !toState) {
      return [];
    }

    if (fromState === toState) {
      return [fromState];
    }

    const queue = [[fromState]];
    const visited = new Set([fromState]);

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      for (const next of this.getNextStates(current)) {
        if (next === toState) {
          return [...path, next];
        }

        if (!visited.has(next)) {
          visited.add(next);
          queue.push([...path, next]);
        }
      }
    }

    return [];
  }

  validateSequence(states) {
    if (!Array.isArray(states) || states.length === 0) {
      return { valid: false, reason: "States list is empty." };
    }

    for (let index = 0; index < states.length - 1; index += 1) {
      const current = states[index];
      const next = states[index + 1];

      if (!this.canTransition(current, next)) {
        return {
          valid: false,
          reason: `Invalid transition from ${current} to ${next}.`,
          invalidIndex: index,
        };
      }
    }

    return { valid: true, reason: "Sequence is valid." };
  }
}

function buildLotStateGraph() {
  return new LotStateGraph();
}

module.exports = {
  LOT_STATUSES,
  LOT_TRANSITIONS,
  LotStateGraph,
  buildLotStateGraph,
};
