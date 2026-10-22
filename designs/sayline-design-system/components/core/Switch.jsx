import React from "react";

export function Switch({ id, checked = false, onChange, children, className = "" }) {
  return (
    <label className={["sl-switch", className].filter(Boolean).join(" ")} htmlFor={id}>
      {children && <span className="sl-switch__label">{children}</span>}
      <input
        checked={checked}
        id={id}
        onChange={(event) => onChange?.(event.target.checked)}
        role="switch"
        type="checkbox"
      />
      <span aria-hidden="true" className="sl-switch__track">
        <span className="sl-switch__thumb"></span>
      </span>
    </label>
  );
}
