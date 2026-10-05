import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

function FarmerList() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axiosInstance
      .get("/farmers")
      .then((response) => setFarmers(response.data.data || []))
      .catch((err) =>
        setError(err?.response?.data?.message || "Unable to load farmers."),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <span className="eyebrow">Network</span>
        <h1>Farmers</h1>
        <p>Registered producers and their operating regions.</p>
      </div>

      {error && <div className="message error">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <span className="spinner" />
          Loading farmers…
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Region</th>
                <th>Farms</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {farmers.length ? (
                farmers.map((farmer) => (
                  <tr key={farmer._id}>
                    <td>
                      <strong>{farmer.name}</strong>
                    </td>
                    <td>{farmer.phone}</td>
                    <td>
                      {farmer.regionId?.name || farmer.regionId?.code || "—"}
                    </td>
                    <td>{farmer.farmIds?.length || 0}</td>
                    <td>{new Date(farmer.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-cell">
                    No farmers found.
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
