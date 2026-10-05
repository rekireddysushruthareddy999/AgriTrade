const mongoose = require("mongoose");
const { getMongoUri } = require("./env");

const connectDB = async () => {
  const mongoUri = getMongoUri();

  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: Number(
      process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 10000,
    ),
  });
  console.log(
    `MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`,
  );
  return mongoose.connection;
};

module.exports = connectDB;
