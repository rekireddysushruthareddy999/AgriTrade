function successResponse(res, statusCode, message, data = null, extra = {}) {
  return res.status(statusCode).json({ success: true, message, data, ...extra });
}

function errorResponse(res, statusCode, message, details) {
  const body = { success: false, message };
  if (details !== undefined) body.details = details;
  return res.status(statusCode).json(body);
}

function isValidObjectId(value) {
  const mongoose = require("mongoose");
  return mongoose.Types.ObjectId.isValid(value);
}

module.exports = { successResponse, errorResponse, isValidObjectId };
