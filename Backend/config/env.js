const defaultMongoUri = "mongodb://127.0.0.1:27017/agritrade";
const defaultJwtSecret = "agritrade-development-secret-key";

const getMongoUri = () => {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  if (process.env.NODE_ENV === "production") {
    throw new Error("MONGO_URI must be configured in production.");
  }
  return defaultMongoUri;
};

const getJwtSecret = () => {
  if (process.env.NODE_ENV === "production") {
    const secret = process.env.JWT_SECRET?.trim();
    if (
      !secret ||
      secret.length < 32 ||
      secret === defaultJwtSecret ||
      /replace-with/i.test(secret)
    ) {
      throw new Error(
        "JWT_SECRET must be a unique random value of at least 32 characters in production.",
      );
    }
    return secret;
  }
  return process.env.JWT_SECRET || defaultJwtSecret;
};

module.exports = {
  defaultMongoUri,
  defaultJwtSecret,
  getMongoUri,
  getJwtSecret,
};
