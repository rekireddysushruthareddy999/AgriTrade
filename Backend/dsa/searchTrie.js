/**
 * AgriTrade - DSA Module 4.4: Farmer / Produce Search Autocomplete — Trie
 *
 * Problem Solved:
 * Database regex or SQL LIKE '%query%' scans all rows on every keystroke,
 * causing database bottleneck and sluggish user experience.
 *
 * DSA Characteristics:
 * - Prefix Tree (Trie) holding farmers, produce categories, warehouses, and lots.
 * - O(L) lookup where L is the prefix length (independent of the total number of records N).
 * - Multi-word token indexing (e.g., "Ramesh Kumar" indexes both "ramesh kumar" and "kumar").
 * - Rich payload metadata attached to leaf/word nodes for instant UI autocomplete dropdowns.
 */

class TrieNode {
  constructor() {
    this.children = new Map();
    this.isWord = false;
    this.payloads = []; // Array of metadata objects matching this word
  }
}

class SearchTrie {
  constructor() {
    this.root = new TrieNode();
    this.totalWords = 0;
  }

  /**
   * Insert a word with optional entity payload into the Trie.
   * O(L) time where L = value.length.
   *
   * @param {string} value The search key text.
   * @param {Object} [payload] Metadata associated with this key (id, name, type, etc.)
   * @param {boolean} [indexSubwords=true] Index individual space-separated words as well.
   */
  insert(value, payload = null, indexSubwords = true) {
    if (!value || typeof value !== "string") return false;

    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;

    this._insertSingle(normalized, payload);

    // If string contains multiple words, index each subword for flexible prefix search
    if (indexSubwords && normalized.includes(" ")) {
      const words = normalized.split(/\s+/).filter((w) => w.length >= 2);
      for (const word of words) {
        if (word !== normalized) {
          this._insertSingle(word, payload);
        }
      }
    }

    return true;
  }

  _insertSingle(text, payload) {
    let current = this.root;

    for (const char of text) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char);
    }

    if (!current.isWord) {
      current.isWord = true;
      this.totalWords++;
    }

    if (payload) {
      // Prevent duplicate payload entries for the same entity id
      const exists = current.payloads.some(
        (p) => String(p.id || p._id) === String(payload.id || payload._id) && p.type === payload.type
      );
      if (!exists) {
        current.payloads.push(payload);
      }
    }
  }

  /**
   * Search for an exact match.
   * O(L) time.
   */
  search(value) {
    if (!value || typeof value !== "string") return false;
    let current = this.root;
    const normalized = value.trim().toLowerCase();

    for (const char of normalized) {
      if (!current.children.has(char)) return false;
      current = current.children.get(char);
    }

    return current.isWord;
  }

  /**
   * Check if any word starts with the given prefix.
   * O(L) time.
   */
  startsWith(prefix) {
    if (!prefix || typeof prefix !== "string") return false;
    let current = this.root;
    const normalized = prefix.trim().toLowerCase();

    for (const char of normalized) {
      if (!current.children.has(char)) return false;
      current = current.children.get(char);
    }

    return true;
  }

  /**
   * Autocomplete prefix lookup:
   * 1. Traverses to the prefix node in O(prefix length) time.
   * 2. DFS gathers matching suggestions and payloads up to maxResults.
   *
   * @param {string} prefix Search term
   * @param {number} [maxResults=10]
   * @returns {Array<Object|string>} Suggestions with rich metadata
   */
  autocomplete(prefix, maxResults = 10) {
    if (!prefix || typeof prefix !== "string") return [];

    const normalized = prefix.trim().toLowerCase();
    if (!normalized) return [];

    let current = this.root;

    // O(L) step down to the prefix root node
    for (const char of normalized) {
      if (!current.children.has(char)) {
        return [];
      }
      current = current.children.get(char);
    }

    const results = [];
    const seenPayloadIds = new Set();

    // DFS to collect suggestions
    const collect = (node, wordSoFar) => {
      if (results.length >= maxResults) return;

      if (node.isWord) {
        if (node.payloads.length > 0) {
          for (const payload of node.payloads) {
            const key = `${payload.type}_${payload.id || payload._id}`;
            if (!seenPayloadIds.has(key)) {
              seenPayloadIds.add(key);
              results.push({
                ...payload,
                matchedWord: wordSoFar,
              });
              if (results.length >= maxResults) return;
            }
          }
        } else {
          results.push(wordSoFar);
        }
      }

      for (const [char, childNode] of node.children.entries()) {
        collect(childNode, `${wordSoFar}${char}`);
        if (results.length >= maxResults) return;
      }
    };

    collect(current, normalized);
    return results;
  }

  /**
   * Build a Trie from an array of plain strings.
   */
  static fromList(values) {
    const trie = new SearchTrie();
    for (const val of values || []) {
      trie.insert(val);
    }
    return trie;
  }

  /**
   * Build a searchable index from application entities (Farmers, Produce Categories, Warehouses).
   */
  static buildSearchIndex({ farmers = [], produceCategories = [], warehouses = [], lots = [] }) {
    const trie = new SearchTrie();

    // Index farmers
    for (const farmer of farmers) {
      const payload = {
        type: "farmer",
        id: farmer._id || farmer.id,
        label: farmer.name,
        meta: farmer.phone ? `Phone: ${farmer.phone}` : "Farmer",
        details: farmer,
      };
      trie.insert(farmer.name, payload);
      if (farmer.phone) {
        trie.insert(farmer.phone, payload, false);
      }
    }

    // Index produce categories
    for (const category of produceCategories) {
      const payload = {
        type: "produce",
        id: category._id || category.id,
        label: category.name,
        meta: `Unit: ${category.unit || "kg"}`,
        details: category,
      };
      trie.insert(category.name, payload);
    }

    // Index warehouses
    for (const warehouse of warehouses) {
      const payload = {
        type: "warehouse",
        id: warehouse._id || warehouse.id,
        label: warehouse.name,
        meta: `Location: ${warehouse.location} | Cap: ${warehouse.capacity}`,
        details: warehouse,
      };
      trie.insert(warehouse.name, payload);
      if (warehouse.location) {
        trie.insert(warehouse.location, payload);
      }
    }

    // Index lots
    for (const lot of lots) {
      if (lot.groupId) {
        const payload = {
          type: "lot",
          id: lot._id || lot.id,
          label: `Lot Batch: ${lot.groupId}`,
          meta: `Qty: ${lot.quantity} | Status: ${lot.status}`,
          details: lot,
        };
        trie.insert(lot.groupId, payload);
      }
    }

    return trie;
  }
}

module.exports = {
  SearchTrie,
  TrieNode,
};
