const Inspection = require("../models/Inspection");
const Lot = require("../models/Lot");
const { successResponse } = require("../utils/apiResponse");

const normalize = (scores = []) =>
  Array.isArray(scores)
    ? scores
        .map((x) => ({
          name: String(x?.name || "").trim(),
          score: Number(x?.score),
        }))
        .filter(
          (x) =>
            x.name &&
            Number.isFinite(x.score) &&
            x.score >= 0 &&
            x.score <= 100
        )
    : [];

const grade = (scores) => {
  if (!scores.length) return "A"; // default clean score if manual
  const avg = scores.reduce((s, x) => s + x.score, 0) / scores.length;
  return avg >= 85 ? "A" : avg >= 70 ? "B" : avg >= 55 ? "C" : avg >= 40 ? "D" : "F";
};

const getInspections = async (req, res) => {
  const filter = {};
  if (req.query.lotId) filter.lotId = req.query.lotId;
  if (req.query.inspectorId) filter.inspectorId = req.query.inspectorId;
  const rows = await Inspection.find(filter)
    .populate("lotId")
    .populate("inspectorId", "name email role")
    .sort({ inspectedAt: -1 })
    .lean();
  return successResponse(
    res,
    200,
    "Inspections retrieved successfully.",
    rows,
    { count: rows.length }
  );
};

const createInspection = async (req, res) => {
  const lotId = req.body.lotId;
  const inspectorId = req.body.inspectorId || req.user?.id;
  if (!lotId) {
    return res.status(400).json({ success: false, message: "lotId is required." });
  }

  const lot = await Lot.findById(lotId);
  if (!lot) {
    return res.status(404).json({ success: false, message: "Lot not found." });
  }

  const criteriaScores = normalize(req.body.criteriaScores);
  const assignedGrade = req.body.grade || grade(criteriaScores);

  const inspection = await Inspection.create({
    lotId,
    inspectorId,
    criteriaScores,
    grade: assignedGrade,
    notes: String(req.body.notes || "").trim(),
    inspectedAt: new Date(),
  });

  // Automatically update lot grade and advance status
  lot.grade = assignedGrade;
  if (assignedGrade === "F") {
    lot.status = "rejected";
  } else {
    // If passing grade, advance to accepted so it can move straight to warehouse storage
    lot.status = "accepted";
  }
  await lot.save();

  return successResponse(
    res,
    201,
    `Inspection recorded with Grade ${assignedGrade}. Lot transitioned to "${lot.status}".`,
    inspection
  );
};

const getInspectionById = async (req, res) => {
  const row = await Inspection.findById(req.params.id)
    .populate("lotId")
    .populate("inspectorId", "name email role")
    .lean();
  if (!row) {
    return res.status(404).json({ success: false, message: "Inspection not found." });
  }
  return successResponse(res, 200, "Inspection retrieved successfully.", row);
};

const updateInspection = async (req, res) => {
  const payload = {};
  if (req.body.criteriaScores) {
    payload.criteriaScores = normalize(req.body.criteriaScores);
    payload.grade = req.body.grade || grade(payload.criteriaScores);
  } else if (req.body.grade) {
    payload.grade = req.body.grade;
  }
  if (req.body.notes !== undefined) payload.notes = String(req.body.notes);
  const row = await Inspection.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });
  if (!row) {
    return res.status(404).json({ success: false, message: "Inspection not found." });
  }
  return successResponse(res, 200, "Inspection updated successfully.", row);
};

const deleteInspection = async (req, res) => {
  const row = await Inspection.findByIdAndDelete(req.params.id);
  if (!row) {
    return res.status(404).json({ success: false, message: "Inspection not found." });
  }
  return successResponse(res, 200, "Inspection deleted successfully.", {
    id: row._id,
  });
};

module.exports = {
  getInspections,
  createInspection,
  getInspectionById,
  updateInspection,
  deleteInspection,
};
