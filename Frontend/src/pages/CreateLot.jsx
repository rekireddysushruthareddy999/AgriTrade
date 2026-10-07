import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const PRODUCE_IMAGE_PRESETS = [
  {
    name: "Fresh Tomatoes",
    url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
    icon: "🍅",
  },
  {
    name: "Red Chilli",
    url: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80",
    icon: "🌶️",
  },
  {
    name: "Red Onion",
    url: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80",
    icon: "🧅",
  },
  {
    name: "Paddy / Rice",
    url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
    icon: "🌾",
  },
  {
    name: "Mangoes",
    url: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80",
    icon: "🥭",
  },
  {
    name: "Potatoes",
    url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80",
    icon: "🥔",
  },
  {
    name: "Bananas",
    url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80",
    icon: "🍌",
  },
  {
    name: "Raw Cotton",
    url: "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=600&auto=format&fit=crop&q=80",
    icon: "☁️",
  },
];

function CreateLot() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canAssignWarehouse = user?.role === "admin";
  const [farmers, setFarmers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customCategoryUnit, setCustomCategoryUnit] = useState("kg");
  const [imageTab, setImageTab] = useState("preset"); // 'preset' | 'url' | 'upload'

  const [form, setForm] = useState({
    farmerId: "",
    produceCategoryId: "",
    quantity: "",
    harvestDate: "",
    expiryEstimate: "",
    warehouseId: "",
    groupId: "",
    imageUrl: PRODUCE_IMAGE_PRESETS[0].url, // default preset
  });

  useEffect(() => {
    const requests = [
      axiosInstance.get("/farmers"),
      axiosInstance.get("/produce-categories"),
    ];
    if (canAssignWarehouse) requests.push(axiosInstance.get("/warehouses"));

    Promise.all(requests)
      .then(([farmersRes, categoriesRes, warehousesRes]) => {
        setFarmers(farmersRes.data.data || []);
        setCategories(categoriesRes.data.data || []);
        setWarehouses(warehousesRes?.data?.data || []);
      })
      .catch((err) => {
        const message =
          err?.response?.status === 401
            ? "Your session is expired. Please log in again."
            : "Could not load form options.";
        setError(message);
      })
      .finally(() => setOptionsLoading(false));
  }, [canAssignWarehouse]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image file size should be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setForm((prev) => ({ ...prev, imageUrl: event.target.result }));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.imageUrl || !form.imageUrl.trim()) {
      return setError("Product image is mandatory while uploading a lot. Please choose a preset or provide an image.");
    }

    if (Number(form.quantity) <= 0) {
      return setError("Quantity must be greater than zero.");
    }

    if (new Date(form.expiryEstimate) <= new Date(form.harvestDate)) {
      return setError("Expiry date must be after harvest date.");
    }

    setLoading(true);

    try {
      let produceCategoryId = form.produceCategoryId;
      if (produceCategoryId === "other") {
        const categoryName = customCategoryName.trim();
        const unit = customCategoryUnit.trim();
        if (!categoryName || !unit) {
          setLoading(false);
          return setError("Enter a category name and unit.");
        }

        const existingCategory = categories.find(
          (category) =>
            category.name.toLowerCase() === categoryName.toLowerCase(),
        );
        if (existingCategory) {
          produceCategoryId = existingCategory._id;
        } else {
          const categoryResponse = await axiosInstance.post(
            "/produce-categories",
            { name: categoryName, unit },
          );
          produceCategoryId = categoryResponse.data.data._id;
        }
      }

      await axiosInstance.post("/lots", {
        ...form,
        imageUrl: form.imageUrl.trim(),
        produceCategoryId,
        quantity: Number(form.quantity),
        warehouseId: form.warehouseId || undefined,
        groupId: form.groupId || undefined,
      });

      navigate("/lots");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to create lot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page" style={{ maxWidth: 880, margin: "0 auto" }}>
      <div className="page-header">
        <span className="eyebrow">Lot Intake & Procurement</span>
        <h1>Create Produce Lot</h1>
        <p>Register a verified harvest batch with mandatory product imagery before quality inspection.</p>
      </div>

      <form className="card form-grid" onSubmit={submit} style={{ padding: 28 }}>
        {optionsLoading && (
          <div className="message info form-span">Loading form options…</div>
        )}

        {!optionsLoading && farmers.length === 0 && (
          <div className="message warning form-span">
            No farmers are available yet. Add a farmer first.
          </div>
        )}

        {!optionsLoading && categories.length === 0 && (
          <div className="message warning form-span">
            No produce categories yet. Choose Other to add one.
          </div>
        )}

        {/* Mandatory Product Image Section */}
        <div
          className="form-span"
          style={{
            background: "#f8fafc",
            border: "1.5px dashed #10b981",
            borderRadius: 16,
            padding: 20,
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#065f46", display: "flex", alignItems: "center", gap: 6 }}>
                <span>📸</span> Mandatory Product Image *
              </span>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#64748b" }}>
                High-definition lot photography is required for transparent quality grading and buyer inspection.
              </p>
            </div>
            {form.imageUrl && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: "#dcfce7",
                  color: "#166534",
                  padding: "4px 10px",
                  borderRadius: 999,
                }}
              >
                ✓ Image Attached
              </span>
            )}
          </div>

          {/* Mode Switcher */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button
              type="button"
              className={imageTab === "preset" ? "primary-btn" : "secondary-btn"}
              onClick={() => setImageTab("preset")}
              style={{ padding: "6px 14px", fontSize: 12, minHeight: 32 }}
            >
              Choose from Presets
            </button>
            <button
              type="button"
              className={imageTab === "upload" ? "primary-btn" : "secondary-btn"}
              onClick={() => setImageTab("upload")}
              style={{ padding: "6px 14px", fontSize: 12, minHeight: 32 }}
            >
              Upload Photo File
            </button>
            <button
              type="button"
              className={imageTab === "url" ? "primary-btn" : "secondary-btn"}
              onClick={() => setImageTab("url")}
              style={{ padding: "6px 14px", fontSize: 12, minHeight: 32 }}
            >
              Enter Image URL
            </button>
          </div>

          {/* Presets Grid */}
          {imageTab === "preset" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                gap: 10,
                marginBottom: 14,
              }}
            >
              {PRODUCE_IMAGE_PRESETS.map((preset) => {
                const isSelected = form.imageUrl === preset.url;
                return (
                  <div
                    key={preset.name}
                    onClick={() => setForm((prev) => ({ ...prev, imageUrl: preset.url }))}
                    style={{
                      border: isSelected ? "2px solid #059669" : "1px solid #cbd5e1",
                      borderRadius: 12,
                      overflow: "hidden",
                      cursor: "pointer",
                      background: isSelected ? "#ecfdf5" : "#ffffff",
                      transition: "all 0.2s ease",
                      boxShadow: isSelected ? "0 4px 12px rgba(5, 150, 105, 0.2)" : "none",
                    }}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      style={{ width: "100%", height: 75, objectFit: "cover", display: "block" }}
                    />
                    <div style={{ padding: "6px 8px", fontSize: 11, fontWeight: 600, textAlign: "center", color: isSelected ? "#065f46" : "#334155" }}>
                      {preset.icon} {preset.name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* File Upload Input */}
          {imageTab === "upload" && (
            <div style={{ marginBottom: 14 }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: 13,
                }}
              />
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#64748b" }}>
                Accepted formats: JPEG, PNG, WebP up to 5MB.
              </p>
            </div>
          )}

          {/* URL Input */}
          {imageTab === "url" && (
            <div style={{ marginBottom: 14 }}>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://example.com/produce-image.jpg"
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #cbd5e1",
                  fontSize: 13,
                }}
              />
            </div>
          )}

          {/* Live Preview Box */}
          {form.imageUrl && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: 10,
                background: "#ffffff",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
              }}
            >
              <img
                src={form.imageUrl}
                alt="Selected lot preview"
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 8,
                  objectFit: "cover",
                  border: "1px solid #e2e8f0",
                }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <div style={{ fontSize: 12, overflow: "hidden" }}>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>Product Image Verified</div>
                <div style={{ color: "#64748b", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: 450 }}>
                  {form.imageUrl}
                </div>
              </div>
            </div>
          )}
        </div>

        <label>
          Farmer
          <select
            value={form.farmerId}
            onChange={(e) => setForm({ ...form, farmerId: e.target.value })}
            required
            disabled={optionsLoading || farmers.length === 0}
          >
            <option value="">Select farmer</option>
            {farmers.map((farmer) => (
              <option key={farmer._id} value={farmer._id}>
                {farmer.name} · {farmer.phone}
              </option>
            ))}
          </select>
        </label>

        <label>
          Produce Category
          <select
            value={form.produceCategoryId}
            onChange={(e) =>
              setForm({ ...form, produceCategoryId: e.target.value })
            }
            required
            disabled={optionsLoading}
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name} ({category.unit})
              </option>
            ))}
            <option value="other">Other (Add New Category)</option>
          </select>
        </label>

        {form.produceCategoryId === "other" && (
          <>
            <label>
              New Category Name
              <input
                value={customCategoryName}
                onChange={(e) => setCustomCategoryName(e.target.value)}
                placeholder="e.g. Sweet potato"
                required
              />
            </label>
            <label>
              Unit
              <input
                value={customCategoryUnit}
                onChange={(e) => setCustomCategoryUnit(e.target.value)}
                placeholder="e.g. kg, quintal, crate"
                required
              />
            </label>
          </>
        )}

        <label>
          Harvest Quantity
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            placeholder="e.g. 500"
            required
          />
        </label>

        <label>
          Harvest Date
          <input
            type="date"
            value={form.harvestDate}
            onChange={(e) => setForm({ ...form, harvestDate: e.target.value })}
            required
          />
        </label>

        <label>
          Estimated Expiry Date (FEFO)
          <input
            type="date"
            value={form.expiryEstimate}
            onChange={(e) =>
              setForm({ ...form, expiryEstimate: e.target.value })
            }
            required
          />
        </label>

        {canAssignWarehouse && (
          <label>
            Assign Warehouse Storage
            <select
              value={form.warehouseId}
              onChange={(e) =>
                setForm({ ...form, warehouseId: e.target.value })
              }
            >
              <option value="">Not assigned yet (pending intake)</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse._id} value={warehouse._id}>
                  {warehouse.name} · {warehouse.location}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Batch Group ID <span className="muted">(optional)</span>
          <input
            value={form.groupId}
            onChange={(e) => setForm({ ...form, groupId: e.target.value })}
            placeholder="e.g. LOT-2026-TOM-01"
          />
        </label>

        {error && <div className="message error form-span">{error}</div>}

        <div className="form-actions form-span" style={{ marginTop: 12 }}>
          <button
            className="secondary-btn"
            type="button"
            onClick={() => navigate("/lots")}
          >
            Cancel
          </button>
          <button
            className="primary-btn"
            disabled={loading || optionsLoading || farmers.length === 0}
          >
            {loading ? "Uploading Lot…" : "Create & Submit Produce Lot"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateLot;
