import { useEffect, useState, useRef } from "react";
import axiosInstance from "../api/axiosInstance";

function SearchAutocomplete({
  value = "",
  onChange,
  onSelect,
  placeholder = "Search farmers, produce, warehouses...",
  entityType = null, // optional filter: 'farmer' | 'produce' | 'warehouse'
}) {
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 1) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(
          `/search/autocomplete?q=${encodeURIComponent(searchTerm.trim())}`
        );
        let results = response.data?.data || [];
        if (entityType) {
          results = results.filter((r) => r.type === entityType);
        }
        setSuggestions(results);
      } catch (err) {
        console.error("Trie autocomplete error:", err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [searchTerm, entityType]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    const text = item.label || item.name || item;
    setSearchTerm(text);
    onChange?.(text);
    onSelect?.(item);
    setOpen(false);
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "farmer":
        return { label: "Farmer", bg: "#e8f5e9", color: "#2e7d32", icon: "👨‍🌾" };
      case "produce":
        return { label: "Produce", bg: "#fff3e0", color: "#e65100", icon: "🍅" };
      case "warehouse":
        return { label: "Warehouse", bg: "#e3f2fd", color: "#1565c0", icon: "🏬" };
      case "lot":
        return { label: "Lot", bg: "#f3e5f5", color: "#7b1fa2", icon: "📦" };
      default:
        return { label: "Entity", bg: "#f5f5f5", color: "#616161", icon: "🔍" };
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%", maxWidth: 460 }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange?.(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          style={{
            width: "100%",
            padding: "12px 38px 12px 14px",
            borderRadius: 12,
            border: "1.5px solid rgba(31, 122, 69, 0.25)",
            background: "#ffffff",
            fontSize: 14,
            outline: "none",
            transition: "all 0.2s ease",
            boxShadow: open ? "0 0 0 3px rgba(31, 122, 69, 0.12)" : "none",
          }}
        />
        {loading && (
          <span
            style={{
              position: "absolute",
              right: 12,
              fontSize: 12,
              color: "#1f7a45",
              animation: "spin 1s linear infinite",
            }}
          >
            ⏳
          </span>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#ffffff",
            border: "1px solid rgba(31, 122, 69, 0.2)",
            borderRadius: 14,
            boxShadow: "0 14px 32px rgba(0, 0, 0, 0.12)",
            zIndex: 100,
            maxHeight: 340,
            overflowY: "auto",
            padding: "6px 0",
          }}
        >
          <div
            style={{
              padding: "6px 14px",
              fontSize: 11,
              fontWeight: 600,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              borderBottom: "1px solid #f3f4f6",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Market Directory Matches</span>
            <span style={{ color: "#1f7a45", fontSize: 10 }}>Instant Results</span>
          </div>

          {suggestions.map((item, idx) => {
            const badge = getTypeBadge(item.type);
            const label = item.label || item.name || item;
            return (
              <button
                key={`${item.id || label}-${idx}`}
                type="button"
                onClick={() => handleSelect(item)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f0fdf4")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>{badge.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>
                      {label}
                    </div>
                    {item.meta && (
                      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                        {item.meta}
                      </div>
                    )}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: badge.bg,
                    color: badge.color,
                  }}
                >
                  {badge.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SearchAutocomplete;
