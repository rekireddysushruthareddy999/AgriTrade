const test = require("node:test");
const assert = require("node:assert/strict");
const {
  LotStateGraph,
  buildLotStateGraph,
  LOT_LIFECYCLE_STATES,
} = require("../dsa/lotStateGraph");

test("LotStateGraph validates canonical lifecycle transitions", () => {
  const graph = buildLotStateGraph();

  // Valid canonical transitions:
  // created → received → inspected → accepted → stored → allocated → dispatched → delivered
  assert.equal(graph.canTransition("created", "received"), true);
  assert.equal(graph.canTransition("received", "inspected"), true);
  assert.equal(graph.canTransition("inspected", "accepted"), true);
  assert.equal(graph.canTransition("inspected", "rejected"), true);
  assert.equal(graph.canTransition("accepted", "stored"), true);
  assert.equal(graph.canTransition("stored", "allocated"), true);
  assert.equal(graph.canTransition("allocated", "dispatched"), true);
  assert.equal(graph.canTransition("allocated", "stored"), true); // cancellation/reversal
  assert.equal(graph.canTransition("dispatched", "delivered"), true);

  // Invalid forbidden transitions:
  assert.equal(graph.canTransition("dispatched", "received"), false);
  assert.equal(graph.canTransition("created", "dispatched"), false);
  assert.equal(graph.canTransition("rejected", "delivered"), false);
  assert.equal(graph.canTransition("delivered", "created"), false);
});

test("LotStateGraph provides correct next states and actions for UI buttons", () => {
  const graph = buildLotStateGraph();

  const nextFromInspected = graph.getNextStates("inspected");
  assert.deepEqual(nextFromInspected.sort(), ["accepted", "rejected"].sort());

  const actions = graph.getAvailableActions("inspected");
  assert.equal(actions.length, 2);
  assert.ok(actions.some((a) => a.toState === "accepted"));
  assert.ok(actions.some((a) => a.toState === "rejected"));
});

test("LotStateGraph BFS reachability and shortest path", () => {
  const graph = buildLotStateGraph();

  // Reachable states from "created"
  const reachable = graph.getReachableStates("created");
  assert.ok(reachable.includes("received"));
  assert.ok(reachable.includes("inspected"));
  assert.ok(reachable.includes("stored"));
  assert.ok(reachable.includes("delivered"));

  // Shortest path between created and stored
  const path = graph.shortestPath("created", "stored");
  assert.deepEqual(path, ["created", "received", "inspected", "accepted", "stored"]);

  // Unreachable backward path returns empty
  const backPath = graph.shortestPath("delivered", "created");
  assert.deepEqual(backPath, []);
});

test("validateSequence verifies sequence validity", () => {
  const graph = buildLotStateGraph();

  const validSeq = ["created", "received", "inspected", "accepted", "stored"];
  assert.equal(graph.validateSequence(validSeq).valid, true);

  const invalidSeq = ["created", "dispatched", "delivered"];
  const res = graph.validateSequence(invalidSeq);
  assert.equal(res.valid, false);
  assert.ok(res.reason.includes("Invalid transition"));
});
