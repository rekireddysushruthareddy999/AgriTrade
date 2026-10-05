const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Region = require("../models/Region");
const { resolveRegionId } = require("../controllers/authController");

const originalMongoUri = process.env.MONGO_URL;
process.env.MONGO_URL =
  process.env.MONGO_URL || "mongodb://127.0.0.1:27017/agritrade";

(async () => {
  await mongoose.connect(process.env.MONGO_URL, {
    serverSelectionTimeoutMS: 5000,
  });
})();

test("resolveRegionId accepts an existing ObjectId", async () => {
  const region = await Region.create({ name: "Test Region", code: "TR" });
  const resolved = await resolveRegionId(String(region._id));
  assert.equal(String(resolved), String(region._id));
  await Region.deleteOne({ _id: region._id });
});

test("resolveRegionId accepts a region name and creates or finds the region", async () => {
  const resolved = await resolveRegionId("Nalgonda");
  assert.ok(mongoose.Types.ObjectId.isValid(String(resolved)));
  const region = await Region.findOne({ name: "Nalgonda" });
  assert.ok(region);
  await Region.deleteOne({ _id: region._id });
});

test.after(async () => {
  await mongoose.disconnect();

  if (originalMongoUri === undefined) delete process.env.MONGO_URL;
  else process.env.MONGO_URL = originalMongoUri;
});
