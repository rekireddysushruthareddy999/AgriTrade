const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
dotenv.config();
const User = require("../models/User");
const Farmer = require("../models/Farmer");
const Farm = require("../models/Farm");
const ProduceCategory = require("../models/ProduceCategory");
const Lot = require("../models/Lot");
const Warehouse = require("../models/Warehouse");
const Vehicle = require("../models/Vehicle");
const Region = require("../models/Region");
const PurchaseOrder = require("../models/PurchaseOrder");
const PurchaseOrderItem = require("../models/PurchaseOrderItem");
const Shipment = require("../models/Shipment");
const Settlement = require("../models/Settlement");
async function seedData() {
  const region = await Region.findOneAndUpdate(
    { code: "KA" },
    { name: "Karnataka", code: "KA" },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  const passwords = await Promise.all(
    ["Admin@12345", "Farmer@12345", "Buyer@12345"].map((p) =>
      bcrypt.hash(p, 12),
    ),
  );
  const users = [];
  for (const data of [
    {
      name: "Admin User",
      email: "admin@agritrade.com",
      phone: "9000000001",
      role: "admin",
    },
    {
      name: "Farmer One",
      email: "farmer1@agritrade.com",
      phone: "9000000002",
      role: "farmer",
    },
    {
      name: "Buyer One",
      email: "buyer1@agritrade.com",
      phone: "9000000003",
      role: "buyer",
    },
  ]) {
    const idx = users.length;
    users.push(
      await User.findOneAndUpdate(
        { email: data.email },
        { ...data, passwordHash: passwords[idx], regionId: region._id },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ),
    );
  }
  const farmers = [];
  for (const data of [
    { name: "Farmer One", phone: "9000000002" },
    { name: "Kiran Gowda", phone: "9876543210" },
    { name: "Nagaraj Reddy", phone: "9123456780" },
  ])
    farmers.push(
      await Farmer.findOneAndUpdate(
        { phone: data.phone },
        { ...data, regionId: region._id },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ),
    );
  const categories = [];
  for (const data of [
    {
      name: "Tomato",
      unit: "kg",
      gradingCriteria: [
        { name: "Freshness", weight: 40 },
        { name: "Appearance", weight: 30 },
        { name: "Size", weight: 30 },
      ],
    },
    {
      name: "Onion",
      unit: "kg",
      gradingCriteria: [
        { name: "Firmness", weight: 50 },
        { name: "Appearance", weight: 50 },
      ],
    },
    {
      name: "Banana",
      unit: "kg",
      gradingCriteria: [
        { name: "Ripeness", weight: 60 },
        { name: "Appearance", weight: 40 },
      ],
    },
  ])
    categories.push(
      await ProduceCategory.findOneAndUpdate({ name: data.name }, data, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }),
    );
  const warehouse = await Warehouse.findOneAndUpdate(
    { name: "Harvest Hub" },
    {
      name: "Harvest Hub",
      location: "Bengaluru",
      regionId: region._id,
      capacity: 2000,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await Farm.findOneAndUpdate(
    { farmerId: farmers[0]._id, location: "Bengaluru" },
    {
      farmerId: farmers[0]._id,
      location: "Bengaluru",
      sizeAcres: 25,
      produceGrown: [categories[0]._id],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await Farm.findOneAndUpdate(
    { farmerId: farmers[1]._id, location: "Mysuru" },
    {
      farmerId: farmers[1]._id,
      location: "Mysuru",
      sizeAcres: 30,
      produceGrown: [categories[2]._id],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await Lot.findOneAndUpdate(
    { groupId: "GROUP-1" },
    {
      farmerId: farmers[0]._id,
      produceCategoryId: categories[0]._id,
      quantity: 120,
      status: "available",
      harvestDate: new Date("2026-09-01"),
      expiryEstimate: new Date("2026-10-10"),
      warehouseId: warehouse._id,
      groupId: "GROUP-1",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await Lot.findOneAndUpdate(
    { groupId: "GROUP-2" },
    {
      farmerId: farmers[1]._id,
      produceCategoryId: categories[1]._id,
      quantity: 180,
      status: "inspected",
      harvestDate: new Date("2026-09-02"),
      expiryEstimate: new Date("2026-10-12"),
      warehouseId: warehouse._id,
      groupId: "GROUP-2",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  const vehicle = await Vehicle.findOneAndUpdate(
    { regNumber: "KA01AB1234" },
    {
      regNumber: "KA01AB1234",
      capacity: 500,
      status: "available",
      currentLocation: "Bengaluru",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await Vehicle.findOneAndUpdate(
    { regNumber: "KA02CD5678" },
    {
      regNumber: "KA02CD5678",
      capacity: 250,
      status: "in_transit",
      currentLocation: "Mysuru",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  const deliveryDeadline = new Date("2026-10-16T00:00:00.000Z");
  const order = await PurchaseOrder.findOneAndUpdate(
    { buyerId: users[2]._id, deliveryDeadline },
    { buyerId: users[2]._id, deliveryDeadline, status: "approved" },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await PurchaseOrderItem.findOneAndUpdate(
    { purchaseOrderId: order._id, produceCategoryId: categories[0]._id },
    {
      purchaseOrderId: order._id,
      produceCategoryId: categories[0]._id,
      quantityRequested: 100,
      quantityFulfilled: 0,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await Shipment.findOneAndUpdate(
    { purchaseOrderId: order._id },
    {
      purchaseOrderId: order._id,
      vehicleId: vehicle._id,
      stops: ["Bengaluru", "Harvest Hub"],
      status: "pending",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await Settlement.findOneAndUpdate(
    { farmerId: farmers[0]._id, cycle: 1 },
    {
      farmerId: farmers[0]._id,
      lotIds: [],
      cycle: 1,
      grossAmount: 12000,
      deductions: 600,
      netAmount: 11400,
      status: "pending",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return { users, farmers, categories, warehouse };
}
if (require.main === module) {
  mongoose
    .connect(process.env.MONGO_URI || "mongodb://localhost:27017/agritrade")
    .then(seedData)
    .then(() => {
      console.log("Database seeding completed.");
      process.exit(0);
    })
    .catch((e) => {
      console.error("Seeding failed:", e.message);
      process.exit(1);
    });
}
module.exports = { seedData };
