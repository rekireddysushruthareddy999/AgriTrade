import { useMemo, useState } from "react";

function SearchAutocomplete({
  items = [],
  value = "",
  onChange,
  placeholder = "Search...",
}) {
  const [open, setOpen] = useState(false);

  const filteredItems = useMemo(() => {
    if (!value) return items.slice(0, 6);

    return items.filter((item) => {
      const label = String(item.label || item.name || item).toLowerCase();
      return label.includes(value.toLowerCase());
    });
  }, [items, value]);

  return (
    <div style={{ position: "relative", maxWidth: 420 }}>
      <input
        type="text"
        value={value}
        onChange={(event) => {
          onChange?.(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid rgba(31, 122, 69, 0.2)",
        }}
      />

      {open && filteredItems.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid rgba(31, 122, 69, 0.15)",
            borderRadius: 12,
            boxShadow: "0 12px 24px rgba(0,0,0,0.08)",
            zIndex: 20,
          }}
        >
          {filteredItems.map((item, index) => {
            const label = item.label || item.name || item;
            return (
              <button
                key={`${label}-${index}`}
                type="button"
                onClick={() => {
                  onChange?.(label);
                  setOpen(false);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SearchAutocomplete;
