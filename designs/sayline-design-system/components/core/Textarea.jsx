import React from "react";

export function Textarea({
  id,
  label,
  hint,
  error,
  aside,
  className = "",
  ...props
}) {
  const hintId = hint && id ? `${id}-hint` : undefined;
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <label className={["sl-field", className].filter(Boolean).join(" ")} htmlFor={id}>
      {label && (
        <span className="sl-field__label-row">
          <span className="sl-field__label">{label}</span>
          {aside && <span className="sl-field__aside">{aside}</span>}
        </span>
      )}
      <textarea
        aria-describedby={errorId || hintId}
        aria-invalid={error ? "true" : undefined}
        className="sl-field__control"
        id={id}
        {...props}
      />
      {error ? (
        <span className="sl-field__error" id={errorId}>{error}</span>
      ) : hint ? (
        <span className="sl-field__hint" id={hintId}>{hint}</span>
      ) : null}
    </label>
  );
}
