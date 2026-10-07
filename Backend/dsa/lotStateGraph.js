/**
 * AgriTrade - DSA Module 4.2: Lot Lifecycle Validation — Directed Graph (FSM)
 *
 * Problem Solved:
 * A produce lot moves through 8+ distinct stages across its procurement lifecycle.
 * Allowing invalid jumps (e.g., dispatched -> received, or rejected -> delivered)
 * corrupts supply chain data and financial settlement records.
 *
 * DSA Characteristics:
 * - Directed Graph implemented via Adjacency List: Map<State, Set<AllowedNextStates>>.
 * - O(1) edge lookup for instantaneous transition validation on API requests.
 * - BFS traversal to compute shortest path and determine all downstream reachable states.
 * - BFS walk provides the frontend with valid next actions dynamically.
 */

const LOT_LIFECYCLE_STATES = Object.freeze([
  "created",
  "received",
  "inspected",
  "accepted",
  "rejected",
  "stored",
  "allocated",
  "dispatched",
  "delivered",
]);

// Standard directed transitions according to the procurement brief
const STANDARD_LOT_TRANSITIONS = Object.freeze({
  created: ["received"],
  received: ["inspected"],
  inspected: ["accepted", "rejected"],
  accepted: ["stored"],
  rejected: [], // Terminal state
  stored: ["allocated", "expired"],
  allocated: ["dispatched", "stored"], // "stored" if de-allocated or order cancelled
  dispatched: ["delivered"],
  delivered: ["settled"],

  // Compatibility with legacy status values
  available: ["allocated", "reserved", "inspected", "stored", "expired"],
  reserved: ["dispatched", "available", "stored"],
  shipped: ["delivered", "settled"],
  settled: [],
  expired: [],
});

// Human-friendly action labels for UI buttons
const STATE_ACTION_LABELS = Object.freeze({
  received: "Mark as Received",
  inspected: "Submit Quality Inspection",
  accepted: "Accept Lot Quality",
  rejected: "Reject Lot Quality",
  stored: "Move to Warehouse Storage",
  allocated: "Allocate to Purchase Order",
  dispatched: "Dispatch Carrier Shipment",
  delivered: "Confirm Buyer Delivery",
  settled: "Finalize Farmer Batch Settlement",
});

class LotStateGraph {
  constructor(transitions = STANDARD_LOT_TRANSITIONS) {
    this.adjacencyList = new Map();

    for (const [state, nextStates] of Object.entries(transitions)) {
      this.adjacencyList.set(
        state.toLowerCase(),
        new Set((nextStates || []).map((s) => s.toLowerCase()))
      );
    }
  }

  /**
   * O(1) edge lookup: checks whether a direct transition from `fromState` to `toState` is allowed.
   * @param {string} fromState
   * @param {string} toState
   * @returns {boolean}
   */
  canTransition(fromState, toState) {
    if (!fromState || !toState) return false;
    const normalizedFrom = String(fromState).trim().toLowerCase();
    const normalizedTo = String(toState).trim().toLowerCase();

    const allowed = this.adjacencyList.get(normalizedFrom);
    return allowed ? allowed.has(normalizedTo) : false;
  }

  /**
   * O(1) lookup: returns the direct next states allowed from `state`.
   * Used by frontend to render valid action buttons dynamically.
   * @param {string} state
   * @returns {Array<string>}
   */
  getNextStates(state) {
    if (!state) return [];
    const normalized = String(state).trim().toLowerCase();
    const allowed = this.adjacencyList.get(normalized);
    return allowed ? Array.from(allowed) : [];
  }

  /**
   * Returns human-friendly action descriptors for each valid next state.
   * @param {string} currentState
   * @returns {Array<{ toState: string, label: string }>}
   */
  getAvailableActions(currentState) {
    const nextStates = this.getNextStates(currentState);
    return nextStates.map((nextState) => ({
      toState: nextState,
      label:
        STATE_ACTION_LABELS[nextState] ||
        `Transition to ${nextState.charAt(0).toUpperCase() + nextState.slice(1)}`,
    }));
  }

  /**
   * BFS Traversal: finds all reachable future states from `startState`.
   * @param {string} startState
   * @returns {Array<string>}
   */
  getReachableStates(startState) {
    if (!startState) return [];
    const normalized = String(startState).trim().toLowerCase();

    const visited = new Set([normalized]);
    const queue = [normalized];
    const reachable = [];

    while (queue.length > 0) {
      const current = queue.shift();
      const neighbors = this.getNextStates(current);

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          reachable.push(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return reachable;
  }

  /**
   * BFS Traversal: finds the shortest valid transition sequence between two states.
   * @param {string} fromState
   * @param {string} toState
   * @returns {Array<string>} List of states in the path, or empty array if unreachable.
   */
  shortestPath(fromState, toState) {
    if (!fromState || !toState) return [];
    const start = String(fromState).trim().toLowerCase();
    const target = String(toState).trim().toLowerCase();

    if (start === target) return [start];

    const queue = [[start]];
    const visited = new Set([start]);

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      for (const next of this.getNextStates(current)) {
        if (next === target) {
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

  /**
   * Validates whether an entire history sequence of states conforms to the directed graph.
   * @param {Array<string>} states
   * @returns {{ valid: boolean, reason: string, invalidIndex?: number }}
   */
  validateSequence(states) {
    if (!Array.isArray(states) || states.length === 0) {
      return { valid: false, reason: "States list is empty." };
    }

    for (let i = 0; i < states.length - 1; i++) {
      const current = states[i];
      const next = states[i + 1];

      if (!this.canTransition(current, next)) {
        return {
          valid: false,
          reason: `Invalid transition from "${current}" to "${next}".`,
          invalidIndex: i,
        };
      }
    }

    return { valid: true, reason: "Sequence is valid." };
  }

  /**
   * Returns graph representation for UI visualization (nodes and directed edges).
   */
  getGraphVisualizationData() {
    const nodes = LOT_LIFECYCLE_STATES.map((state) => ({
      id: state,
      label: state.charAt(0).toUpperCase() + state.slice(1),
      isTerminal: (this.adjacencyList.get(state)?.size || 0) === 0,
    }));

    const edges = [];
    for (const [from, toSet] of this.adjacencyList.entries()) {
      if (LOT_LIFECYCLE_STATES.includes(from)) {
        for (const to of toSet) {
          if (LOT_LIFECYCLE_STATES.includes(to)) {
            edges.push({ from, to });
          }
        }
      }
    }

    return { nodes, edges };
  }

  getAllStates() {
    return [...LOT_LIFECYCLE_STATES];
  }

  getAdjacencyList() {
    const result = {};
    for (const [k, v] of this.adjacencyList.entries()) {
      result[k] = Array.from(v);
    }
    return result;
  }
}

function buildLotStateGraph() {
  return new LotStateGraph();
}

module.exports = {
  LotStateGraph,
  buildLotStateGraph,
  LOT_LIFECYCLE_STATES,
  STANDARD_LOT_TRANSITIONS,
};
