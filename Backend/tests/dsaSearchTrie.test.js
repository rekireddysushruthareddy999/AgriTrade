const test = require("node:test");
const assert = require("node:assert/strict");
const { SearchTrie } = require("../dsa/searchTrie");

test("SearchTrie inserts and finds exact matches and prefixes", () => {
  const trie = new SearchTrie();

  trie.insert("Tomato");
  trie.insert("Turmeric");
  trie.insert("Tobacco");

  assert.equal(trie.search("Tomato"), true);
  assert.equal(trie.search("tomato"), true); // Case-insensitive
  assert.equal(trie.search("Potato"), false);

  assert.equal(trie.startsWith("to"), true);
  assert.equal(trie.startsWith("tur"), true);
  assert.equal(trie.startsWith("pot"), false);
});

test("SearchTrie autocomplete returns prefix matches in O(prefix length)", () => {
  const trie = new SearchTrie();

  trie.insert("Tomato", { id: "1", type: "produce", name: "Tomato" });
  trie.insert("Tobacco", { id: "2", type: "produce", name: "Tobacco" });
  trie.insert("Onion", { id: "3", type: "produce", name: "Onion" });

  const results = trie.autocomplete("to");
  assert.equal(results.length, 2);
  assert.ok(results.some((r) => r.name === "Tomato"));
  assert.ok(results.some((r) => r.name === "Tobacco"));
});

test("SearchTrie supports subword indexing for multi-word names", () => {
  const trie = new SearchTrie();

  trie.insert("Suresh Kumar", { id: "f1", type: "farmer", name: "Suresh Kumar" });

  // Searching prefix "kumar" should find Suresh Kumar
  const results = trie.autocomplete("kum");
  assert.equal(results.length, 1);
  assert.equal(results[0].name, "Suresh Kumar");
});

test("SearchTrie bulk index builder aggregates farmers, produce, and warehouses", () => {
  const trie = SearchTrie.buildSearchIndex({
    farmers: [{ id: "f1", name: "Ramesh Farmer", phone: "9876543210" }],
    produceCategories: [{ id: "p1", name: "Red Chilli", unit: "kg" }],
    warehouses: [{ id: "w1", name: "Suryapet Warehouse", location: "Suryapet" }],
  });

  const farmerSearch = trie.autocomplete("ram");
  assert.equal(farmerSearch.length, 1);
  assert.equal(farmerSearch[0].type, "farmer");

  const produceSearch = trie.autocomplete("chil");
  assert.equal(produceSearch.length, 1);
  assert.equal(produceSearch[0].type, "produce");

  const warehouseSearch = trie.autocomplete("sury");
  assert.equal(warehouseSearch.length, 1);
  assert.equal(warehouseSearch[0].type, "warehouse");
});
