const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
dotenv.config();

const User = require("../models/User");
const Farmer = require("../models/Farmer");
const Farm = require("../models/Farm");
const ProduceCategory = require("../models/ProduceCategory");
const Lot = require("../models/Lot");
const Inspection = require("../models/Inspection");
const Warehouse = require("../models/Warehouse");
const Vehicle = require("../models/Vehicle");
const Region = require("../models/Region");
const PurchaseOrder = require("../models/PurchaseOrder");
const PurchaseOrderItem = require("../models/PurchaseOrderItem");
const Shipment = require("../models/Shipment");
const Settlement = require("../models/Settlement");

async function seedData() {
  console.log("Starting AgriTrade comprehensive database seed...");

  // 1. Seed Regions
  const regions = [];
  const regionData = [
    { name: "Telangana", code: "TG" },
    { name: "Andhra Pradesh", code: "AP" },
    { name: "Karnataka", code: "KA" },
  ];

  for (const r of regionData) {
    let reg = await Region.findOne({ $or: [{ code: r.code }, { name: r.name }] });
    if (!reg) {
      reg = await Region.create(r);
    } else {
      reg.name = r.name;
      reg.code = r.code;
      await reg.save();
    }
    regions.push(reg);
  }
  const defaultRegion = regions[0]; // Telangana

  // 2. Seed Users across all 6 Roles
  const passwordHash = await bcrypt.hash("AgriTrade@2028", 10);
  const usersToSeed = [
    {
      name: "System Admin",
      email: "admin@agritrade.com",
      phone: "9000000001",
      role: "admin",
      regionId: defaultRegion._id,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
      address: "Telangana State Agricultural Directorate, Hyderabad",
      bio: "AgriTrade System Administrator overseeing regional collections, FEFO allocation, and settlement cycles.",
    },
    {
      name: "Ramesh Farmer",
      email: "farmer1@agritrade.com",
      phone: "9000000002",
      role: "farmer",
      regionId: defaultRegion._id,
      avatarUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80",
      address: "Green Valley Farms, Miryalaguda, Nalgonda",
      bio: "Organic cultivator specializing in Vine Tomatoes, Guntur Red Chilli, and Sona Masoori Paddy.",
    },
    {
      name: "Suresh Farmer",
      email: "farmer2@agritrade.com",
      phone: "9000000003",
      role: "farmer",
      regionId: defaultRegion._id,
      avatarUrl: "https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=500&auto=format&fit=crop&q=80",
      address: "Surya Agro Farms, Suryapet, Telangana",
      bio: "Commercial farmer supplying high-yield Nashik Red Onions and Cotton to state collection hubs.",
    },
    {
      name: "Nalgonda CC Staff",
      email: "staff@agritrade.com",
      phone: "9000000004",
      role: "collection_center",
      regionId: defaultRegion._id,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
      address: "Nalgonda APMC Mandi Intake Hub #3",
      bio: "Collection Center Lead coordinating daily harvest check-ins and batch onboarding.",
    },
    {
      name: "Quality Inspector Rao",
      email: "inspector@agritrade.com",
      phone: "9000000005",
      role: "inspector",
      regionId: defaultRegion._id,
      avatarUrl: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&auto=format&fit=crop&q=80",
      address: "Regional Quality Assay Laboratory, Warangal",
      bio: "Certified Produce Grader performing multi-criteria quality scoring (Grade A-F).",
    },
    {
      name: "AgriRetail Buyer",
      email: "buyer1@agritrade.com",
      phone: "9000000006",
      role: "buyer",
      regionId: defaultRegion._id,
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80",
      address: "FreshDirect Food Corp, Begumpet, Hyderabad",
      bio: "Wholesale food distributor sourcing perishable and staple produce lots for supermarket chains.",
    },
    {
      name: "Express Logistics Lead",
      email: "logistics@agritrade.com",
      phone: "9000000007",
      role: "logistics",
      regionId: defaultRegion._id,
      avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80",
      address: "Telangana Logistics Depot, Shamshabad",
      bio: "Fleet coordinator optimizing multi-stop dispatch routes via Dijkstra algorithm.",
    },
  ];

  const seededUsers = {};
  for (const u of usersToSeed) {
    const userDoc = await User.findOneAndUpdate(
      { email: u.email },
      { ...u, passwordHash },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    seededUsers[u.role] = userDoc;
  }

  // 3. Seed Farmers
  const farmersData = [
    {
      name: "Ramesh Patel",
      phone: "9000000002",
      regionId: defaultRegion._id,
      userId: seededUsers.farmer._id,
    },
    {
      name: "Suresh Reddy",
      phone: "9000000003",
      regionId: defaultRegion._id,
    },
    {
      name: "Kavitha Sharma",
      phone: "9876543210",
      regionId: regions[1]._id, // Andhra
    },
  ];

  const farmers = [];
  for (const f of farmersData) {
    const farmer = await Farmer.findOneAndUpdate(
      { phone: f.phone },
      f,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    farmers.push(farmer);
  }

  // 4. Seed Produce Categories with Configurable Grading Criteria
  const produceCategoriesData = [
    {
      name: "Tomato",
      unit: "kg",
      basePrice: 28,
      gradingCriteria: [
        { name: "Firmness", weight: 35 },
        { name: "Color & Ripeness", weight: 35 },
        { name: "Size Uniformity", weight: 30 },
      ],
    },
    {
      name: "Red Chilli",
      unit: "kg",
      basePrice: 165,
      gradingCriteria: [
        { name: "Moisture Content", weight: 40 },
        { name: "Color Intensity", weight: 35 },
        { name: "Pungency / Capsaicin", weight: 25 },
      ],
    },
    {
      name: "Onion",
      unit: "kg",
      basePrice: 32,
      gradingCriteria: [
        { name: "Dry Outer Skin", weight: 40 },
        { name: "Sprouting Absence", weight: 35 },
        { name: "Diameter / Size", weight: 25 },
      ],
    },
    {
      name: "Sona Masoori Rice",
      unit: "quintal",
      basePrice: 3200,
      gradingCriteria: [
        { name: "Broken Grain %", weight: 40 },
        { name: "Foreign Matter", weight: 30 },
        { name: "Grain Length", weight: 30 },
      ],
    },
  ];

  const categories = [];
  for (const cat of produceCategoriesData) {
    const category = await ProduceCategory.findOneAndUpdate(
      { name: cat.name },
      cat,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    categories.push(category);
  }

  // 5. Seed Warehouses with Geographical Coordinates
  const warehousesData = [
    {
      name: "Nalgonda Collection Center",
      location: "Nalgonda Mandi",
      regionId: defaultRegion._id,
      capacity: 5000,
      currentStock: 1200,
      coordinates: { latitude: 17.0575, longitude: 79.2684 },
    },
    {
      name: "Suryapet Grain Warehouse",
      location: "Suryapet Bypass",
      regionId: defaultRegion._id,
      capacity: 8000,
      currentStock: 2400,
      coordinates: { latitude: 17.1439, longitude: 79.6239 },
    },
    {
      name: "Hyderabad Central Logistics Hub",
      location: "Kothapet / LB Nagar",
      regionId: defaultRegion._id,
      capacity: 15000,
      currentStock: 4500,
      coordinates: { latitude: 17.385, longitude: 78.4867 },
    },
  ];

  const warehouses = [];
  for (const w of warehousesData) {
    const wh = await Warehouse.findOneAndUpdate(
      { name: w.name },
      w,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    warehouses.push(wh);
  }

  // 6. Seed Farms
  const farms = [];
  const farmRecords = [
    {
      farmerId: farmers[0]._id,
      location: "Miryalaguda, Nalgonda",
      sizeAcres: 18,
      produceGrown: [categories[0]._id, categories[2]._id],
      coordinates: { latitude: 16.8724, longitude: 79.5638 },
    },
    {
      farmerId: farmers[1]._id,
      location: "Suryapet Rural",
      sizeAcres: 24,
      produceGrown: [categories[1]._id, categories[3]._id],
      coordinates: { latitude: 17.15, longitude: 79.61 },
    },
  ];

  for (const f of farmRecords) {
    const farm = await Farm.findOneAndUpdate(
      { location: f.location },
      f,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    farms.push(farm);
    await Farmer.findByIdAndUpdate(f.farmerId, { $addToSet: { farmIds: farm._id } });
  }

  // 7. Seed Produce Lots Across Lifecycle States
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const lotsData = [
    {
      farmerId: farmers[0]._id,
      produceCategoryId: categories[0]._id, // Tomato
      quantity: 500,
      imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
      status: "stored", // Ready for FEFO allocation
      grade: "A",
      pricePerUnit: 30,
      harvestDate: new Date(now.getTime() - 2 * dayMs),
      expiryEstimate: new Date(now.getTime() + 3 * dayMs), // Soon to expire! FEFO priority
      warehouseId: warehouses[0]._id,
      groupId: "LOT-TOM-001",
    },
    {
      farmerId: farmers[0]._id,
      produceCategoryId: categories[0]._id, // Tomato
      quantity: 800,
      imageUrl: "https://images.unsplash.com/photo-1546470427-227c7369a47d?w=600&auto=format&fit=crop&q=80",
      status: "stored",
      grade: "B",
      pricePerUnit: 26,
      harvestDate: new Date(now.getTime() - 1 * dayMs),
      expiryEstimate: new Date(now.getTime() + 8 * dayMs), // Later expiry
      warehouseId: warehouses[0]._id,
      groupId: "LOT-TOM-002",
    },
    {
      farmerId: farmers[1]._id,
      produceCategoryId: categories[1]._id, // Chilli
      quantity: 400,
      imageUrl: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80",
      status: "accepted",
      grade: "A",
      pricePerUnit: 175,
      harvestDate: new Date(now.getTime() - 4 * dayMs),
      expiryEstimate: new Date(now.getTime() + 60 * dayMs),
      warehouseId: warehouses[1]._id,
      groupId: "LOT-CHL-003",
    },
    {
      farmerId: farmers[1]._id,
      produceCategoryId: categories[2]._id, // Onion
      quantity: 1200,
      imageUrl: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80",
      status: "created",
      harvestDate: new Date(now.getTime()),
      expiryEstimate: new Date(now.getTime() + 30 * dayMs),
      warehouseId: null,
      groupId: "LOT-ONI-004",
    },
    {
      farmerId: farmers[0]._id,
      produceCategoryId: categories[0]._id,
      quantity: 350,
      imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
      status: "received",
      harvestDate: new Date(now.getTime() - 1 * dayMs),
      expiryEstimate: new Date(now.getTime() + 6 * dayMs),
      warehouseId: warehouses[0]._id,
      groupId: "LOT-TOM-005",
    },
  ];

  const lots = [];
  for (const l of lotsData) {
    const lot = await Lot.findOneAndUpdate(
      { groupId: l.groupId },
      l,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    lots.push(lot);
  }

  // 8. Seed Inspections for Inspected Lots
  await Inspection.findOneAndUpdate(
    { lotId: lots[0]._id },
    {
      lotId: lots[0]._id,
      inspectorId: seededUsers.inspector._id,
      grade: "A",
      criteriaScores: [
        { name: "Firmness", score: 92 },
        { name: "Color & Ripeness", score: 88 },
        { name: "Size Uniformity", score: 85 },
      ],
      notes: "Grade A tomatoes, optimal firmness, early harvest.",
      inspectedAt: new Date(now.getTime() - 1 * dayMs),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // 9. Seed Vehicles
  const vehiclesData = [
    {
      regNumber: "TS08UA1234",
      capacity: 3000,
      status: "available",
      currentLocation: "Nalgonda Mandi",
      coordinates: { latitude: 17.0575, longitude: 79.2684 },
    },
    {
      regNumber: "TS09XB5678",
      capacity: 6000,
      status: "available",
      currentLocation: "Hyderabad Central Logistics Hub",
      coordinates: { latitude: 17.385, longitude: 78.4867 },
    },
  ];

  const vehicles = [];
  for (const v of vehiclesData) {
    const vehicle = await Vehicle.findOneAndUpdate(
      { regNumber: v.regNumber },
      v,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    vehicles.push(vehicle);
  }

  // 10. Seed Purchase Order with Line Items
  const deliveryDeadline = new Date(now.getTime() + 5 * dayMs);
  const order = await PurchaseOrder.findOneAndUpdate(
    { buyerId: seededUsers.buyer._id, status: "pending" },
    {
      buyerId: seededUsers.buyer._id,
      status: "pending",
      deliveryDeadline,
      deliveryLocation: {
        address: "Guntur Agri Processing Plant",
        latitude: 16.3067,
        longitude: 80.4365,
      },
      regionId: defaultRegion._id,
      notes: "Urgent procurement of Grade A tomatoes for retail distribution.",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await PurchaseOrderItem.findOneAndUpdate(
    { purchaseOrderId: order._id, produceCategoryId: categories[0]._id },
    {
      purchaseOrderId: order._id,
      produceCategoryId: categories[0]._id,
      quantityRequested: 400,
      quantityFulfilled: 0,
      allocatedLots: [],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // 11. Seed Shipments with Dijkstra Waypoints
  await Shipment.findOneAndUpdate(
    { purchaseOrderId: order._id },
    {
      purchaseOrderId: order._id,
      vehicleId: vehicles[0]._id,
      stops: [
        { id: "NALGONDA_CC", name: "Nalgonda Collection Center" },
        { id: "SURYAPET_WH", name: "Suryapet Grain Warehouse" },
        { id: "GUNTUR_BUYER", name: "Guntur Agri Processing Plant" },
      ],
      routeDetails: {
        totalDistanceKm: 241,
        optimalSequence: [
          { id: "NALGONDA_CC", name: "Nalgonda Collection Center" },
          { id: "SURYAPET_WH", name: "Suryapet Grain Warehouse" },
          { id: "GUNTUR_BUYER", name: "Guntur Agri Processing Plant" },
        ],
        legDetails: [
          { from: "NALGONDA_CC", to: "SURYAPET_WH", distanceKm: 42, estimatedTimeMinutes: 50 },
          { from: "SURYAPET_WH", to: "GUNTUR_BUYER", distanceKm: 199, estimatedTimeMinutes: 240 },
        ],
      },
      status: "pending",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // 12. Seed Settlement with Union-Find Grouping
  await Settlement.findOneAndUpdate(
    { farmerId: farmers[0]._id, cycle: 1 },
    {
      farmerId: farmers[0]._id,
      lotIds: [lots[0]._id],
      cycle: 1,
      batchGroupId: "BATCH_C1_F000001_SETTLED",
      grossAmount: 15000,
      deductions: 675,
      netAmount: 14325,
      breakdown: {
        taxValue: 300,
        commissionValue: 225,
        freightValue: 150,
      },
      status: "pending",
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log("Database seeded successfully!");
  console.log("Credentials:");
  console.log(" - Admin: admin@agritrade.com / AgriTrade@2028");
  console.log(" - Farmer: farmer1@agritrade.com / AgriTrade@2028");
  console.log(" - Staff: staff@agritrade.com / AgriTrade@2028");
  console.log(" - Inspector: inspector@agritrade.com / AgriTrade@2028");
  console.log(" - Buyer: buyer1@agritrade.com / AgriTrade@2028");
  console.log(" - Logistics: logistics@agritrade.com / AgriTrade@2028");

  return {
    regions,
    users: seededUsers,
    farmers,
    categories,
    warehouses,
    lots,
  };
}

if (require.main === module) {
  mongoose
    .connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/agritrade")
    .then(seedData)
    .then(() => {
      console.log("Seeding finished.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding failed:", err.message);
      process.exit(1);
    });
}

module.exports = { seedData };
