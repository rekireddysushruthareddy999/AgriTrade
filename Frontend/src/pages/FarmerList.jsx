import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../api/axiosInstance";

function FarmerList() {
  const [farmers, setFarmers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axiosInstance
      .get("/farmers")
      .then((response) => setFarmers(response.data.data || []))
      .catch((err) =>
        setError(err?.response?.data?.message || "Unable to load farmers.")
      )
      .finally(() => setLoading(false));
  }, []);

  const visibleFarmers = useMemo(() => {
    return farmers.filter((f) =>
      `${f.name || ""} ${f.phone || ""} ${f.regionId?.name || ""} ${f.regionId?.code || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [farmers, search]);

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <span className="eyebrow">Universal Producer Network</span>
          <h1>Registered Farmers Directory</h1>
          <p>
            Universal producer directory accessible to all buyers, farmers, and logistics staff. Connect directly with verified growers.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              background: "#dcfce7",
              color: "#166534",
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid #86efac",
            }}
          >
            🌾 {farmers.length} Registered Farmers Online
          </span>
        </div>
      </div>

      <div className="toolbar" style={{ marginBottom: 20 }}>
        <input
          aria-label="Search farmers"
          placeholder="Search by farmer name, phone number, or region…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="message error">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <span className="spinner" />
          Loading universal farmer directory…
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Farmer</th>
                <th>Contact Phone</th>
                <th>Agricultural Region</th>
                <th>Farms & Holdings</th>
                <th>Produce Specialization</th>
                <th>Member Since</th>
              </tr>
            </thead>
            <tbody>
              {visibleFarmers.length ? (
                visibleFarmers.map((farmer) => {
                  const produceList = farmer.farmIds
                    ?.flatMap((farm) => farm.produceGrown || [])
                    .filter(Boolean);
                  const uniqueProduce = Array.from(new Set(produceList));

                  return (
                    <tr key={farmer._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: 15,
                              boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)",
                              flexShrink: 0,
                            }}
                          >
                            {farmer.name ? farmer.name.charAt(0).toUpperCase() : "F"}
                          </div>
                          <div>
                            <strong style={{ fontSize: 14, color: "var(--text)" }}>
                              {farmer.name}
                            </strong>
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>
                              ID: {String(farmer._id).slice(-6).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <a
                          href={`tel:${farmer.phone}`}
                          style={{
                            color: "var(--brand-dark)",
                            fontWeight: 600,
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          📞 {farmer.phone}
                        </a>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            padding: "3px 8px",
                            borderRadius: 6,
                            border: "1px solid #bfdbfe",
                          }}
                        >
                          📍 {farmer.regionId?.name || farmer.regionId?.code || "Primary Mandi Zone"}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700 }}>
                          {farmer.farmIds?.length || 0}
                        </span>{" "}
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>
                          registered farm{farmer.farmIds?.length === 1 ? "" : "s"}
                        </span>
                      </td>
                      <td>
                        {uniqueProduce.length > 0 ? (
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {uniqueProduce.slice(0, 3).map((p, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: 11,
                                  background: "#f1f5f9",
                                  color: "#334155",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                }}
                              >
                                {p}
                              </span>
                            ))}
                            {uniqueProduce.length > 3 && (
                              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                                +{uniqueProduce.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>
                            Vegetables & Grain
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--muted)" }}>
                        {new Date(farmer.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="empty-cell" style={{ textAlign: "center", padding: 32 }}>
                    No farmers match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FarmerList;
