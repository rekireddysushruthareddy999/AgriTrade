class TrieNode {
  constructor() {
    this.children = new Map();
    this.isWord = false;
  }
}

class SearchTrie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(value) {
    if (!value || typeof value !== "string") {
      return false;
    }

    const normalized = value.trim().toLowerCase();
    let current = this.root;

    for (const character of normalized) {
      if (!current.children.has(character)) {
        current.children.set(character, new TrieNode());
      }
      current = current.children.get(character);
    }

    current.isWord = true;
    return true;
  }

  search(value) {
    if (!value || typeof value !== "string") {
      return false;
    }

    let current = this.root;
    const normalized = value.trim().toLowerCase();

    for (const character of normalized) {
      if (!current.children.has(character)) {
        return false;
      }
      current = current.children.get(character);
    }

    return current.isWord;
  }

  startsWith(prefix) {
    if (!prefix || typeof prefix !== "string") {
      return false;
    }

    let current = this.root;
    const normalized = prefix.trim().toLowerCase();

    for (const character of normalized) {
      if (!current.children.has(character)) {
        return false;
      }
      current = current.children.get(character);
    }

    return true;
  }

  autocomplete(prefix, maxResults = 10) {
    if (!prefix || typeof prefix !== "string") {
      return [];
    }

    const normalized = prefix.trim().toLowerCase();
    let current = this.root;

    for (const character of normalized) {
      if (!current.children.has(character)) {
        return [];
      }
      current = current.children.get(character);
    }

    const results = [];
    const collect = (node, word) => {
      if (results.length >= maxResults) {
        return;
      }

      if (node.isWord) {
        results.push(word);
      }

      for (const [character, childNode] of node.children.entries()) {
        collect(childNode, `${word}${character}`);
        if (results.length >= maxResults) {
          return;
        }
      }
    };

    collect(current, normalized);
    return results;
  }

  static fromList(values) {
    const trie = new SearchTrie();
    for (const value of values || []) {
      trie.insert(value);
    }
    return trie;
  }
}

module.exports = {
  SearchTrie,
  TrieNode,
};
