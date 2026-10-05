import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

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
  const [form, setForm] = useState({
    farmerId: "",
    produceCategoryId: "",
    quantity: "",
    harvestDate: "",
    expiryEstimate: "",
    warehouseId: "",
    groupId: "",
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

  const submit = async (e) => {
    e.preventDefault();
    setError("");

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
    <div className="form-page">
      <div className="page-header">
        <span className="eyebrow">Lot registry</span>
        <h1>Create produce lot</h1>
        <p>Register a harvest batch before inspection and allocation.</p>
      </div>

      <form className="card form-grid" onSubmit={submit}>
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
          Produce category
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
            <option value="other">Other</option>
          </select>
        </label>

        {form.produceCategoryId === "other" && (
          <>
            <label>
              New category
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
                placeholder="e.g. kg"
                required
              />
            </label>
          </>
        )}

        <label>
          Quantity
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            required
          />
        </label>

        <label>
          Harvest date
          <input
            type="date"
            value={form.harvestDate}
            onChange={(e) => setForm({ ...form, harvestDate: e.target.value })}
            required
          />
        </label>

        <label>
          Estimated expiry
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
            Warehouse
            <select
              value={form.warehouseId}
              onChange={(e) =>
                setForm({ ...form, warehouseId: e.target.value })
              }
            >
              <option value="">Not assigned yet</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse._id} value={warehouse._id}>
                  {warehouse.name} · {warehouse.location}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Group ID <span className="muted">(optional)</span>
          <input
            value={form.groupId}
            onChange={(e) => setForm({ ...form, groupId: e.target.value })}
            placeholder="e.g. GROUP-2026-01"
          />
        </label>

        {error && <div className="message error form-span">{error}</div>}

        <div className="form-actions form-span">
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
            {loading ? "Saving…" : "Create lot"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateLot;
