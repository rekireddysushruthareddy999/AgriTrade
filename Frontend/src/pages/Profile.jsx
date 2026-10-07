import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const AVATAR_PRESETS = [
  {
    role: "Farmer",
    name: "Farmer in Field",
    url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80",
    icon: "👨‍🌾",
  },
  {
    role: "Farmer",
    name: "Paddy Cultivator",
    url: "https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=500&auto=format&fit=crop&q=80",
    icon: "🌾",
  },
  {
    role: "Buyer",
    name: "AgriRetail Merchant",
    url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80",
    icon: "🛒",
  },
  {
    role: "Buyer",
    name: "Wholesale Trader",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
    icon: "🏬",
  },
  {
    role: "Inspector",
    name: "Quality Assay Inspector",
    url: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&auto=format&fit=crop&q=80",
    icon: "🔬",
  },
  {
    role: "Staff",
    name: "Collection Hub Manager",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
    icon: "🏢",
  },
  {
    role: "Logistics",
    name: "Fleet Transport Lead",
    url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80",
    icon: "🚚",
  },
  {
    role: "Admin",
    name: "Platform Administrator",
    url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&auto=format&fit=crop&q=80",
    icon: "👑",
  },
];

const DEFAULT_AVATARS_BY_ROLE = {
  farmer: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80",
  buyer: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=80",
  inspector: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&auto=format&fit=crop&q=80",
  quality_inspector: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=500&auto=format&fit=crop&q=80",
  collection_center: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
  collection_center_staff: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
  warehouse_manager: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80",
  logistics: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80",
  logistics_coordinator: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&auto=format&fit=crop&q=80",
  admin: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
};

function Profile() {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    avatarUrl: "",
    address: "",
    bio: "",
  });

  const loadProfile = () => {
    setLoading(true);
    axiosInstance
      .get("/auth/profile")
      .then((res) => {
        const u = res.data.data?.user || user;
        const s = res.data.data?.stats || {};
        setProfileData(u);
        setStats(s);
        setEditForm({
          name: u.name || "",
          phone: u.phone || "",
          avatarUrl: u.avatarUrl || DEFAULT_AVATARS_BY_ROLE[u.role] || "",
          address: u.address || "",
          bio: u.bio || "",
        });
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Unable to load profile data.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Avatar image should be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setEditForm((prev) => ({ ...prev, avatarUrl: event.target.result }));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await axiosInstance.patch("/auth/profile", editForm);
      const updated = res.data.data;
      setProfileData(updated);
      if (updateUser) updateUser(updated);
      setSuccessMsg("✓ Profile and avatar updated successfully!");
      setIsEditing(false);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profileData) {
    return (
      <div className="loading-state">
        <span className="spinner" />
        Loading profile details…
      </div>
    );
  }

  const role = profileData?.role || user?.role || "farmer";
  const avatarImage =
    editForm.avatarUrl ||
    profileData?.avatarUrl ||
    DEFAULT_AVATARS_BY_ROLE[role] ||
    "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80";

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 40 }}>
      {/* 1. Profile Hero Banner with Agricultural Nature Gradient */}
      <div
        className="card"
        style={{
          position: "relative",
          padding: 0,
          overflow: "hidden",
          borderRadius: 24,
          marginBottom: 24,
          boxShadow: "0 15px 35px -10px rgba(6, 78, 59, 0.25)",
        }}
      >
        {/* Cover Photo / Agricultural Landscape */}
        <div
          style={{
            height: 180,
            background:
              "linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle at 20% 40%, rgba(254, 240, 138, 0.25) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.35) 0%, transparent 60%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 24,
              bottom: 16,
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(10px)",
              color: "#ffffff",
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>🌾</span>
            <span>AgriTrade Verified Agricultural Network</span>
          </div>
        </div>

        {/* Profile Identity Bar */}
        <div
          style={{
            padding: "0 32px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginTop: -60,
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-end", gap: 22, flexWrap: "wrap" }}>
            {/* Avatar Photo Frame */}
            <div
              style={{
                position: "relative",
                width: 120,
                height: 120,
                borderRadius: "50%",
                padding: 4,
                background: "linear-gradient(135deg, #10b981, #f59e0b)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
              }}
            >
              <img
                src={avatarImage}
                alt={profileData?.name || "Profile avatar"}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                  background: "#ffffff",
                  display: "block",
                }}
                onError={(e) => {
                  e.target.src = DEFAULT_AVATARS_BY_ROLE[role];
                }}
              />
              <span
                style={{
                  position: "absolute",
                  bottom: 4,
                  right: 4,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#10b981",
                  border: "2px solid #ffffff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 14,
                }}
                title="Verified active"
              >
                ✓
              </span>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800 }}>
                  {profileData?.name || "AgriTrade User"}
                </h1>
                <span className="status-badge" style={{ textTransform: "uppercase", fontSize: 11 }}>
                  {role.replaceAll("_", " ")}
                </span>
              </div>
              <p className="muted" style={{ margin: "0 0 6px", fontSize: 14 }}>
                {profileData?.email} · {profileData?.phone}
              </p>
              {profileData?.address && (
                <p style={{ margin: 0, fontSize: 13, color: "#059669", fontWeight: 600 }}>
                  📍 {profileData.address}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="button"
              className={isEditing ? "secondary-btn btn-animated" : "primary-btn btn-animated"}
              onClick={() => setIsEditing(!isEditing)}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <span>{isEditing ? "✖ Cancel Editing" : "✎ Edit Profile & Avatar"}</span>
            </button>
          </div>
        </div>
      </div>

      {error && <div className="message error">{error}</div>}
      {successMsg && <div className="message success">{successMsg}</div>}

      {/* 2. Role Specific Highlights Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {role === "farmer" && (
          <>
            <div className="stat-card" style={{ background: "linear-gradient(135deg, #ecfdf5, #ffffff)" }}>
              <span>Registered Lots</span>
              <strong>{stats.totalLots ?? "—"}</strong>
              <small>Harvest batches onboarded</small>
            </div>
            <div className="stat-card" style={{ background: "linear-gradient(135deg, #fffbeb, #ffffff)" }}>
              <span>Total Produce</span>
              <strong>{stats.totalProduceQuantity ?? "—"} <span style={{ fontSize: 16 }}>kg</span></strong>
              <small>Cumulative harvest supply</small>
            </div>
            <div className="stat-card" style={{ background: "linear-gradient(135deg, #eff6ff, #ffffff)" }}>
              <span>Delivered & Settled</span>
              <strong>{stats.deliveredLots ?? "—"}</strong>
              <small>Fulfilled lots in payout queue</small>
            </div>
            <div className="stat-card" style={{ background: "linear-gradient(135deg, #f5f3ff, #ffffff)" }}>
              <span>Active Pipeline</span>
              <strong>{stats.activeLots ?? "—"}</strong>
              <small>Lots in inspection / storage</small>
            </div>
          </>
        )}

        {role === "buyer" && (
          <>
            <div className="stat-card" style={{ background: "linear-gradient(135deg, #ecfdf5, #ffffff)" }}>
              <span>Total Purchase Orders</span>
              <strong>{stats.totalOrders ?? "—"}</strong>
              <small>Procurement orders placed</small>
            </div>
            <div className="stat-card" style={{ background: "linear-gradient(135deg, #fffbeb, #ffffff)" }}>
              <span>Delivered Orders</span>
              <strong>{stats.deliveredOrders ?? "—"}</strong>
              <small>Fulfilled & confirmed receipts</small>
            </div>
            <div className="stat-card" style={{ background: "linear-gradient(135deg, #eff6ff, #ffffff)" }}>
              <span>Active Orders</span>
              <strong>{stats.activeOrders ?? "—"}</strong>
              <small>In allocation or transit</small>
            </div>
          </>
        )}

        {role !== "farmer" && role !== "buyer" && (
          <>
            <div className="stat-card" style={{ background: "linear-gradient(135deg, #ecfdf5, #ffffff)" }}>
              <span>Stakeholder Role</span>
              <strong style={{ fontSize: "1.4rem", textTransform: "capitalize" }}>
                {role.replaceAll("_", " ")}
              </strong>
              <small>Verified platform staff</small>
            </div>
            <div className="stat-card" style={{ background: "linear-gradient(135deg, #fffbeb, #ffffff)" }}>
              <span>Assigned Jurisdiction</span>
              <strong style={{ fontSize: "1.4rem" }}>
                {profileData?.regionId?.name || "State Mandi Network"}
              </strong>
              <small>Operational hub</small>
            </div>
            <div className="stat-card" style={{ background: "linear-gradient(135deg, #eff6ff, #ffffff)" }}>
              <span>Authorization Level</span>
              <strong style={{ fontSize: "1.4rem" }}>Level 2 Access</strong>
              <small>Full supply chain lifecycle control</small>
            </div>
          </>
        )}
      </div>

      {/* 3. Edit Form (Expandable) OR Profile Details */}
      {isEditing ? (
        <div className="card" style={{ marginBottom: 24, animation: "fadeUp 0.3s ease" }}>
          <h2 style={{ margin: "0 0 16px" }}>✎ Update Profile & Avatar Photo</h2>

          <form onSubmit={handleSave} style={{ display: "grid", gap: 18 }}>
            {/* Avatar Selector Section */}
            <div>
              <label style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>
                Choose Profile Photo (Preset or Upload)
              </label>

              {/* 1-Click Presets */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                {AVATAR_PRESETS.map((p) => {
                  const isSelected = editForm.avatarUrl === p.url;
                  return (
                    <div
                      key={p.name}
                      onClick={() => setEditForm((prev) => ({ ...prev, avatarUrl: p.url }))}
                      style={{
                        padding: 8,
                        borderRadius: 12,
                        border: isSelected ? "2px solid #059669" : "1px solid #e2e8f0",
                        background: isSelected ? "#ecfdf5" : "#ffffff",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        boxShadow: isSelected ? "0 4px 12px rgba(5,150,105,0.2)" : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <img
                        src={p.url}
                        alt={p.name}
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: "50%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                      <span style={{ fontSize: 11, fontWeight: 700, textAlign: "center" }}>
                        {p.icon} {p.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Custom Image URL or Upload */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Or paste custom image URL…"
                  value={editForm.avatarUrl}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, avatarUrl: e.target.value }))}
                  style={{ flex: 1, minWidth: 260 }}
                />
                <label
                  className="secondary-btn btn-animated"
                  style={{ margin: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <span>📁 Upload Image from PC</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="form-grid">
              <label>
                Full Name
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </label>

              <label>
                Phone Number
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </label>

              <label className="form-span">
                Farm / Business Address & Location
                <input
                  type="text"
                  placeholder="e.g. Green Valley Farms, Miryalaguda, Nalgonda Mandi"
                  value={editForm.address}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                />
              </label>

              <label className="form-span">
                Bio / Agricultural Profile Description
                <textarea
                  rows={3}
                  placeholder="Tell other stakeholders about your crops, capacity, or procurement operations…"
                  value={editForm.bio}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                />
              </label>
            </div>

            <div className="form-actions" style={{ marginTop: 8 }}>
              <button
                type="button"
                className="secondary-btn btn-animated"
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="primary-btn btn-animated"
                disabled={saving}
              >
                {saving ? "Saving Changes…" : "✓ Save Profile & Avatar"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="detail-grid">
          {/* About / Bio Card */}
          <div className="card">
            <h2>About & Operational Overview</h2>
            <p style={{ lineHeight: 1.7, color: "var(--muted)", margin: "8px 0 16px" }}>
              {profileData?.bio ||
                (role === "farmer"
                  ? "Cultivates and supplies high-grade agricultural produce lots to collection centers with verified transparent quality grading and direct digital payout tracking."
                  : role === "buyer"
                    ? "Wholesale produce buyer procuring fresh farm harvest with verified delivery fulfillment."
                    : "Verified AgriTrade platform operator managing agricultural logistics and grading.")}
            </p>

            <dl className="detail-list">
              <div>
                <dt>Account Role</dt>
                <dd>
                  <strong style={{ textTransform: "capitalize" }}>{role.replaceAll("_", " ")}</strong>
                </dd>
              </div>
              <div>
                <dt>Email Address</dt>
                <dd>{profileData?.email}</dd>
              </div>
              <div>
                <dt>Phone Contact</dt>
                <dd>{profileData?.phone}</dd>
              </div>
              <div>
                <dt>Operating Region</dt>
                <dd>{profileData?.regionId?.name || "Telangana Agricultural Hub"}</dd>
              </div>
              <div>
                <dt>Member Since</dt>
                <dd>
                  {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : "Active Member"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quick Shortcuts Card */}
          <div className="card">
            <h2>Quick Actions</h2>
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              {role === "farmer" && (
                <>
                  <Link to="/lots/new" className="primary-btn btn-animated" style={{ textAlign: "center" }}>
                    🌱 + Upload New Produce Lot
                  </Link>
                  <Link to="/lots" className="secondary-btn btn-animated" style={{ textAlign: "center" }}>
                    📋 View My Produce Lots
                  </Link>
                  <Link to="/settlements" className="secondary-btn btn-animated" style={{ textAlign: "center" }}>
                    💰 Check Payout Settlements
                  </Link>
                </>
              )}

              {role === "buyer" && (
                <>
                  <Link to="/purchase-orders" className="primary-btn btn-animated" style={{ textAlign: "center" }}>
                    🛒 + Create Purchase Order
                  </Link>
                  <Link to="/lots" className="secondary-btn btn-animated" style={{ textAlign: "center" }}>
                    🔍 Browse Available Produce Lots
                  </Link>
                  <Link to="/shipments" className="secondary-btn btn-animated" style={{ textAlign: "center" }}>
                    🚚 Track Produce Deliveries
                  </Link>
                </>
              )}

              {role !== "farmer" && role !== "buyer" && (
                <>
                  <Link to="/dashboard" className="primary-btn btn-animated" style={{ textAlign: "center" }}>
                    📊 Operational Dashboard
                  </Link>
                  <Link to="/lots" className="secondary-btn btn-animated" style={{ textAlign: "center" }}>
                    📦 Lot Supply Chain Registry
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Platform Developer Signature */}
      <div
        style={{
          marginTop: 24,
          padding: "16px 20px",
          borderRadius: 14,
          background: "linear-gradient(135deg, rgba(6, 78, 59, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)",
          border: "1px solid #a7f3d0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>👨‍💻</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#065f46" }}>
              AgriTrade Platform Creator & Developer
            </div>
            <div style={{ fontSize: 12, color: "#475569" }}>
              Engineered & Crafted by <strong>Sushrutha Reddy Rekireddy</strong>
            </div>
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", background: "#dcfce7", padding: "4px 10px", borderRadius: 999 }}>
          Platform Developer: Sushrutha Reddy Rekireddy
        </span>
      </div>
    </div>
  );
}

export default Profile;
