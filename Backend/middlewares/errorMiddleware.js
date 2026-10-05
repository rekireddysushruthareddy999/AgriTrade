const mongoose = require("mongoose");

const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
};

const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal server error";

  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors).map((item) => item.message).join(" ");
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}.`;
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    message = `${field} already exists.`;
  }

  const response = { success: false, message };
  if (process.env.NODE_ENV !== "production" && err.stack) response.error = { name: err.name, stack: err.stack };
  return res.status(statusCode).json(response);
};

module.exports = { notFoundHandler, errorMiddleware, defaultErrorHandler: errorMiddleware };
