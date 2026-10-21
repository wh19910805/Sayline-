import React from "react";

export function Tabs({
  items,
  value,
  onChange,
  ariaLabel = "分类",
  variant = "underline",
  className = "",
}) {
  const classes = [
    "sl-tabs",
    variant === "pill" ? "sl-tabs--pill" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div aria-label={ariaLabel} className={classes} role="tablist">
      {items.map((item) => (
        <button
          aria-selected={value === item.value}
          className="sl-tab"
          key={item.value}
          onClick={() => onChange?.(item.value)}
          role="tab"
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
