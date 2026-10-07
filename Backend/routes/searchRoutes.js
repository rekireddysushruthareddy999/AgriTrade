const express = require("express");
const {
  autocompleteSearch,
  rebuildIndex,
} = require("../controllers/searchController");
const { authenticate } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authenticate);

router.get("/autocomplete", autocompleteSearch);
router.post("/rebuild-index", rebuildIndex);

module.exports = router;
