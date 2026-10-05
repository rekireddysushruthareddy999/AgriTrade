const test = require("node:test");
const assert = require("node:assert/strict");
const { getMongoUri, getJwtSecret } = require("../config/env");

const originalMongoUri = process.env.MONGO_URL;
const originalJwtSecret = process.env.JWT_SECRET;
const originalNodeEnv = process.env.NODE_ENV;

test("uses local MongoDB fallback when MONGO_URL is missing", () => {
  delete process.env.MONGO_URL;
  assert.equal(getMongoUri(), "mongodb://127.0.0.1:27017/agritrade");
});

test("uses development JWT fallback when JWT_SECRET is missing", () => {
  delete process.env.JWT_SECRET;
  assert.equal(getJwtSecret(), "agritrade-development-secret-key");
});

test("prefers explicitly configured values over defaults", () => {
  process.env.MONGO_URL = "mongodb://localhost:27017/custom-db";
  process.env.JWT_SECRET = "custom-secret";
  assert.equal(getMongoUri(), "mongodb://localhost:27017/custom-db");
  assert.equal(getJwtSecret(), "custom-secret");
});

test("requires database and JWT configuration in production", () => {
  process.env.NODE_ENV = "production";
  delete process.env.MONGO_URL;
  delete process.env.JWT_SECRET;

  assert.throws(getMongoUri, /MONGO_URL must be configured in production/);
  assert.throws(getJwtSecret, /JWT_SECRET must be a unique random value/);
});

test("rejects the documented JWT placeholder in production", () => {
  process.env.NODE_ENV = "production";
  process.env.MONGO_URL = "mongodb://127.0.0.1:27017/agritrade";
  process.env.JWT_SECRET = "replace-with-a-long-random-secret";

  assert.throws(getJwtSecret, /JWT_SECRET must be a unique random value/);
});

process.on("exit", () => {
  if (originalMongoUri === undefined) delete process.env.MONGO_URL;
  else process.env.MONGO_URL = originalMongoUri;

  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;

  if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = originalNodeEnv;
});
