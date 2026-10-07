const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const { getJwtSecret } = require("./config/env");
const {
  errorMiddleware,
  notFoundHandler,
} = require("./middlewares/errorMiddleware");
const { startNearExpiryAlertJob } = require("./jobs/nearExpiryAlertJob");

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5001);

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5174,http://localhost:5173")
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);

const isLocalDevelopmentOrigin = (origin) => {
  if (process.env.NODE_ENV === "production") return false;
  try {
    const url = new URL(origin);
    const port = Number(url.port);
    return (
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname) &&
      port >= 5173 &&
      port <= 5199
    );
  } catch {
    return false;
  }
};

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        isLocalDevelopmentOrigin(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin not allowed."));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) =>
  res.status(200).json({
    success: true,
    status: "ok",
    service: "AgriTrade Farm Procurement & Supply Chain API",
    database:
      require("mongoose").connection.readyState === 1
        ? "connected"
        : "disconnected",
    timestamp: new Date().toISOString(),
  })
);

// API Route Mounts
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/farmers", require("./routes/farmerRoutes"));
app.use("/api/farms", require("./routes/farmRoutes"));
app.use("/api/inspections", require("./routes/inspectionRoutes"));
app.use("/api/produce-categories", require("./routes/produceCategoryRoutes"));
app.use("/api/lots", require("./routes/lotRoutes"));
app.use("/api/purchase-orders", require("./routes/purchaseOrderRoutes"));
app.use("/api/warehouses", require("./routes/warehouseRoutes"));
app.use("/api/shipments", require("./routes/shipmentRoutes"));
app.use("/api/vehicles", require("./routes/vehicleRoutes"));
app.use("/api/settlements", require("./routes/settlementRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));
app.use("/api/logistics", require("./routes/logisticsRoutes"));

app.use(notFoundHandler);
app.use(errorMiddleware);

const startServer = (port, attemptsLeft = 10) =>
  new Promise((resolve, reject) => {
    const server = app.listen(port, () => resolve(port));
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
        const nextPort = port + 1;
        console.warn(`Port ${port} is busy, retrying on port ${nextPort}.`);
        server.close(() => resolve(startServer(nextPort, attemptsLeft - 1)));
        return;
      }
      reject(error);
    });
  });

const start = async () => {
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.CORS_ORIGIN?.trim()
  ) {
    throw new Error("CORS_ORIGIN must be configured in production.");
  }
  getJwtSecret();
  await connectDB();
  const activePort = await startServer(PORT);
  console.log(`AgriTrade API running on port ${activePort}`);

  // Initialize node-cron near-expiry alert job
  startNearExpiryAlertJob();
};

if (require.main === module) {
  start().catch((error) => {
    console.error(`Startup failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = app;
