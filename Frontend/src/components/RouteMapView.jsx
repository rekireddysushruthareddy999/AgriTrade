function RouteMapView({ stops = [] }) {
  const items = stops.length
    ? stops
    : [
        { id: "A", label: "Farm", status: "source" },
        { id: "B", label: "Warehouse", status: "transit" },
        { id: "C", label: "Market", status: "destination" },
      ];

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 18,
        background: "#f5faf5",
        border: "1px solid rgba(31,122,69,0.15)",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Route Overview</h3>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {items.map((stop, index) => (
          <div
            key={stop.id || `${stop.label}-${index}`}
            style={{
              flex: "1 1 140px",
              padding: 12,
              borderRadius: 12,
              background: "#fff",
              border: "1px solid rgba(31,122,69,0.12)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "#5b6c5a",
                textTransform: "uppercase",
              }}
            >
              Stop {index + 1}
            </div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>
              {stop.label || stop.id}
            </div>
            <div style={{ fontSize: 12, color: "#1f7a45", marginTop: 4 }}>
              {stop.status || "scheduled"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RouteMapView;
