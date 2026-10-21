import React from "react";

export function Checkbox({ id, children, className = "", ...props }) {
  return (
    <label className={["sl-checkbox", className].filter(Boolean).join(" ")} htmlFor={id}>
      <input id={id} type="checkbox" {...props} />
      <span>{children}</span>
    </label>
  );
}
