const ProduceCategory = require("../models/ProduceCategory");
const { successResponse } = require("../utils/apiResponse");
const getProduceCategories = async (req, res) => {
  const categories = await ProduceCategory.find({}).sort({ name: 1 }).lean();
  return successResponse(res, 200, "Produce categories retrieved successfully.", categories, { count: categories.length });
};
const createProduceCategory = async (req, res) => {
  const { name, unit, gradingCriteria = [] } = req.body;
  if (!name || !unit) return res.status(400).json({ success: false, message: "Name and unit are required." });
  const category = await ProduceCategory.create({ name: String(name).trim(), unit: String(unit).trim(), gradingCriteria });
  return successResponse(res, 201, "Produce category created successfully.", category);
};
const getProduceCategoryById = async (req, res) => { const category = await ProduceCategory.findById(req.params.id).lean(); if (!category) return res.status(404).json({ success:false,message:"Produce category not found."}); return successResponse(res,200,"Produce category retrieved successfully.",category); };
const updateProduceCategory = async (req, res) => { const category = await ProduceCategory.findByIdAndUpdate(req.params.id, req.body,{new:true,runValidators:true}); if(!category) return res.status(404).json({success:false,message:"Produce category not found."}); return successResponse(res,200,"Produce category updated successfully.",category); };
const deleteProduceCategory = async (req, res) => { const category = await ProduceCategory.findByIdAndDelete(req.params.id); if(!category) return res.status(404).json({success:false,message:"Produce category not found."}); return successResponse(res,200,"Produce category deleted successfully.",{id:category._id}); };
module.exports = { getProduceCategories, createProduceCategory, getProduceCategoryById, updateProduceCategory, deleteProduceCategory };
