import React from "react";

export function Dialog({
  open,
  eyebrow,
  title,
  description,
  children,
  actions,
  onClose,
}) {
  React.useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="sl-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
      role="presentation"
    >
      <section
        aria-describedby={description ? "sl-dialog-description" : undefined}
        aria-labelledby="sl-dialog-title"
        aria-modal="true"
        className="sl-dialog"
        role="dialog"
      >
        {eyebrow && <p className="sl-dialog__eyebrow">{eyebrow}</p>}
        <h2 className="sl-dialog__title" id="sl-dialog-title">{title}</h2>
        {description && (
          <p className="sl-dialog__description" id="sl-dialog-description">
            {description}
          </p>
        )}
        {children && <div className="sl-dialog__body">{children}</div>}
        {actions && <div className="sl-dialog__actions">{actions}</div>}
      </section>
    </div>
  );
}
