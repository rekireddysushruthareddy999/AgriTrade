const Farmer = require("../models/Farmer");
const ProduceCategory = require("../models/ProduceCategory");
const Warehouse = require("../models/Warehouse");
const Lot = require("../models/Lot");
const { SearchTrie } = require("../dsa/searchTrie");
const { successResponse } = require("../utils/apiResponse");

let cachedTrie = null;
let lastIndexTime = 0;
const CACHE_TTL_MS = 60 * 1000; // Refresh index every 60s

const getOrBuildTrie = async () => {
  const now = Date.now();
  if (cachedTrie && now - lastIndexTime < CACHE_TTL_MS) {
    return cachedTrie;
  }

  const [farmers, produceCategories, warehouses, lots] = await Promise.all([
    Farmer.find().select("name phone regionId").limit(200).lean(),
    ProduceCategory.find().select("name unit basePrice").limit(100).lean(),
    Warehouse.find().select("name location capacity").limit(100).lean(),
    Lot.find({ groupId: { $ne: null } }).select("groupId quantity status").limit(100).lean(),
  ]);

  cachedTrie = SearchTrie.buildSearchIndex({
    farmers,
    produceCategories,
    warehouses,
    lots,
  });
  lastIndexTime = now;
  return cachedTrie;
};

/**
 * GET /api/search/autocomplete?q=
 * Walks the Trie in O(prefix length) time to return instant type-ahead suggestions.
 */
const autocompleteSearch = async (req, res) => {
  const q = String(req.query.q || "").trim();

  if (q.length < 1) {
    return successResponse(res, 200, "Autocomplete results retrieved successfully.", []);
  }

  const trie = await getOrBuildTrie();
  // O(prefix length) lookup
  const results = trie.autocomplete(q, 10);

  return successResponse(res, 200, "Autocomplete results retrieved via Trie.", results, {
    query: q,
    count: results.length,
    algorithm: "Prefix Tree (Trie) O(L) Lookup",
  });
};

/**
 * POST /api/search/rebuild-index
 * Explicitly forces index rebuild
 */
const rebuildIndex = async (req, res) => {
  lastIndexTime = 0;
  await getOrBuildTrie();
  return successResponse(res, 200, "Search Trie index rebuilt successfully.");
};

module.exports = {
  autocompleteSearch,
  rebuildIndex,
};
