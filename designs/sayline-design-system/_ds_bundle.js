/* @ds-bundle: {"format":3,"namespace":"SaylineDesignSystem_1a4fd3","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Checkbox","sourcePath":"components/core/Checkbox.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Input","sourcePath":"components/core/Input.jsx"},{"name":"Textarea","sourcePath":"components/core/Textarea.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"CategoryCard","sourcePath":"components/learning/CategoryCard.jsx"},{"name":"CourseCard","sourcePath":"components/learning/CourseCard.jsx"},{"name":"ModeSwitcher","sourcePath":"components/learning/ModeSwitcher.jsx"},{"name":"ProgressBar","sourcePath":"components/learning/ProgressBar.jsx"},{"name":"StatTile","sourcePath":"components/learning/StatTile.jsx"},{"name":"BottomNav","sourcePath":"components/navigation/BottomNav.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"f4dc27c43834","components/core/Button.jsx":"560230796a99","components/core/Checkbox.jsx":"e801f8d5ecf5","components/core/Icon.jsx":"ecb82d2b8de5","components/core/IconButton.jsx":"59b83667549a","components/core/Input.jsx":"67e5554024bb","components/core/Textarea.jsx":"51af41919ebe","components/feedback/Dialog.jsx":"fbb4b1cc77d6","components/feedback/Toast.jsx":"12f43dc740b4","components/learning/CategoryCard.jsx":"d7c5f606f862","components/learning/CourseCard.jsx":"91495d6bfafe","components/learning/ModeSwitcher.jsx":"1e910a80ba0f","components/learning/ProgressBar.jsx":"a8796c8f5b85","components/learning/StatTile.jsx":"453b801ffb90","components/navigation/BottomNav.jsx":"1edd2eee690a","components/navigation/Tabs.jsx":"524a3820eb15","ui_kits/learner/app.jsx":"ae8a0f5b6241","ui_kits/learner/data.jsx":"29b25ef755b8","ui_kits/learner/player.jsx":"3798f34a5fa5","ui_kits/learner/screens.jsx":"f0b8d405ce16","ui_kits/learner/shared.jsx":"a20116a63ff4"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.SaylineDesignSystem_1a4fd3 = window.SaylineDesignSystem_1a4fd3 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Badge({
  children,
  tone = "neutral",
  className = "",
  ...props
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    className: ["sl-badge", tone !== "neutral" ? `sl-badge--${tone}` : "", className].filter(Boolean).join(" ")
  }, props), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  className = "",
  type = "button",
  ...props
}) {
  const classes = ["sl-button", `sl-button--${variant}`, `sl-button--${size}`, fullWidth ? "sl-button--full" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-busy": loading || undefined,
    className: classes,
    disabled: loading || props.disabled,
    type: type
  }, props), loading ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true"
  }, "\xB7\xB7\xB7") : children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Checkbox({
  id,
  children,
  className = "",
  ...props
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: ["sl-checkbox", className].filter(Boolean).join(" "),
    htmlFor: id
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: id,
    type: "checkbox"
  }, props)), /*#__PURE__*/React.createElement("span", null, children));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const iconMarkup = {
  "arrow-left": "<path d=\"m12 19-7-7 7-7\" /> <path d=\"M19 12H5\" />",
  "arrow-right": "<path d=\"M5 12h14\" /> <path d=\"m12 5 7 7-7 7\" />",
  "audio-lines": "<path d=\"M2 10v3\" /> <path d=\"M6 6v11\" /> <path d=\"M10 3v18\" /> <path d=\"M14 8v7\" /> <path d=\"M18 5v13\" /> <path d=\"M22 10v3\" />",
  "book-open": "<path d=\"M12 5v16\" /> <path d=\"M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z\" />",
  "bookmark": "<path d=\"M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z\" />",
  "calendar-days": "<path d=\"M8 2v3\" /> <path d=\"M16 2v3\" /> <rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\" /> <path d=\"M3 9h18\" /> <path d=\"M8 13h.01\" /> <path d=\"M12 13h.01\" /> <path d=\"M16 13h.01\" /> <path d=\"M8 17h.01\" /> <path d=\"M12 17h.01\" /> <path d=\"M16 17h.01\" />",
  "captions": "<rect width=\"18\" height=\"14\" x=\"3\" y=\"5\" rx=\"2\" ry=\"2\" /> <path d=\"M7 15h4M15 15h2M7 11h2M13 11h4\" />",
  "check": "<path d=\"M20 6 9 17l-5-5\" />",
  "chevron-down": "<path d=\"m6 9 6 6 6-6\" />",
  "chevron-left": "<path d=\"m15 18-6-6 6-6\" />",
  "chevron-right": "<path d=\"m9 18 6-6-6-6\" />",
  "chevrons-down": "<path d=\"m7 6 5 5 5-5\" /> <path d=\"m7 13 5 5 5-5\" />",
  "chevrons-up": "<path d=\"m17 11-5-5-5 5\" /> <path d=\"m17 18-5-5-5 5\" />",
  "circle-check": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"m16 9-5.5 5.5L8 12\" />",
  "clock-3": "<circle cx=\"12\" cy=\"12\" r=\"10\" /> <path d=\"M12 6v6h4\" />",
  "ellipsis": "<circle cx=\"12\" cy=\"12\" r=\"1\" /> <circle cx=\"19\" cy=\"12\" r=\"1\" /> <circle cx=\"5\" cy=\"12\" r=\"1\" />",
  "headphones": "<path d=\"M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3\" />",
  "heart": "<path d=\"M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5\" />",
  "home": "<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\" /> <path d=\"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\" />",
  "image": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" ry=\"2\" /> <circle cx=\"9\" cy=\"9\" r=\"2\" /> <path d=\"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\" />",
  "lock-keyhole": "<circle cx=\"12\" cy=\"16\" r=\"1\" /> <rect x=\"3\" y=\"10\" width=\"18\" height=\"12\" rx=\"2\" /> <path d=\"M7 10V7a5 5 0 0 1 10 0v3\" />",
  "log-in": "<path d=\"m10 17 5-5-5-5\" /> <path d=\"M15 12H3\" /> <path d=\"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4\" />",
  "log-out": "<path d=\"m16 17 5-5-5-5\" /> <path d=\"M21 12H9\" /> <path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\" />",
  "mic": "<path d=\"M12 19v3\" /> <path d=\"M19 10v2a7 7 0 0 1-14 0v-2\" /> <rect x=\"9\" y=\"2\" width=\"6\" height=\"13\" rx=\"3\" />",
  "music-2": "<path d=\"m19 6-5.2-3.9a.5.5 0 0 0-.8.4V18\" /> <circle cx=\"9\" cy=\"18\" r=\"4\" />",
  "pause": "<rect x=\"14\" y=\"3\" width=\"5\" height=\"18\" rx=\"1\" /> <rect x=\"5\" y=\"3\" width=\"5\" height=\"18\" rx=\"1\" />",
  "pen-line": "<path d=\"M13 21h8\" /> <path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\" />",
  "play": "<path d=\"M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z\" />",
  "plus": "<path d=\"M5 12h14\" /> <path d=\"M12 5v14\" />",
  "rotate-ccw": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\" /> <path d=\"M3 3v5h5\" />",
  "rotate-cw": "<path d=\"M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8\" /> <path d=\"M21 3v5h-5\" />",
  "search": "<path d=\"m21 21-4.34-4.34\" /> <circle cx=\"11\" cy=\"11\" r=\"8\" />",
  "settings-2": "<path d=\"M14 17H5\" /> <path d=\"M19 7h-9\" /> <circle cx=\"17\" cy=\"17\" r=\"3\" /> <circle cx=\"7\" cy=\"7\" r=\"3\" />",
  "skip-back": "<path d=\"M17.971 4.285A2 2 0 0 1 21 6v12a2 2 0 0 1-3.029 1.715l-9.997-5.998a2 2 0 0 1-.003-3.432z\" /> <path d=\"M3 20V4\" />",
  "skip-forward": "<path d=\"M21 4v16\" /> <path d=\"M6.029 4.285A2 2 0 0 0 3 6v12a2 2 0 0 0 3.029 1.715l9.997-5.998a2 2 0 0 0 .003-3.432z\" />",
  "sparkles": "<path d=\"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z\" /> <path d=\"M20 2v4\" /> <path d=\"M22 4h-4\" /> <circle cx=\"4\" cy=\"20\" r=\"2\" />",
  "square": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\" />",
  "trash-2": "<path d=\"M10 11v6\" /> <path d=\"M14 11v6\" /> <path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6\" /> <path d=\"M3 6h18\" /> <path d=\"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\" />",
  "upload": "<path d=\"M12 3v12\" /> <path d=\"m17 8-5-5-5 5\" /> <path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" />",
  "user-round": "<circle cx=\"12\" cy=\"8\" r=\"5\" /> <path d=\"M20 21a8 8 0 0 0-16 0\" />",
  "volume-2": "<path d=\"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z\" /> <path d=\"M16 9a5 5 0 0 1 0 6\" /> <path d=\"M19.364 18.364a9 9 0 0 0 0-12.728\" />",
  "x": "<path d=\"M18 6 6 18\" /> <path d=\"m6 6 12 12\" />"
};
function Icon({
  name,
  size = 24,
  strokeWidth = 1.75,
  className = "",
  label,
  ...rest
}) {
  const content = iconMarkup[name];
  if (!content) {
    return null;
  }
  return /*#__PURE__*/React.createElement("svg", _extends({
    "aria-hidden": label ? undefined : "true",
    "aria-label": label,
    className: "sl-icon " + className,
    fill: "none",
    height: size,
    role: label ? "img" : undefined,
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: strokeWidth,
    viewBox: "0 0 24 24",
    width: size
  }, rest, {
    dangerouslySetInnerHTML: {
      __html: content
    }
  }));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function IconButton({
  children,
  label,
  variant = "plain",
  active = false,
  className = "",
  ...props
}) {
  const classes = ["sl-icon-button", variant === "outline" ? "sl-icon-button--outline" : "", active ? "sl-icon-button--active" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    className: classes,
    title: label,
    type: "button"
  }, props), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
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
  return /*#__PURE__*/React.createElement("label", {
    className: ["sl-field", className].filter(Boolean).join(" "),
    htmlFor: id
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "sl-field__label-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sl-field__label"
  }, label), aside && /*#__PURE__*/React.createElement("span", {
    className: "sl-field__aside"
  }, aside)), /*#__PURE__*/React.createElement("input", _extends({
    "aria-describedby": errorId || hintId,
    "aria-invalid": error ? "true" : undefined,
    className: "sl-field__control",
    id: id
  }, props)), error ? /*#__PURE__*/React.createElement("span", {
    className: "sl-field__error",
    id: errorId
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "sl-field__hint",
    id: hintId
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Input.jsx", error: String((e && e.message) || e) }); }

// components/core/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Textarea({
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
  return /*#__PURE__*/React.createElement("label", {
    className: ["sl-field", className].filter(Boolean).join(" "),
    htmlFor: id
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "sl-field__label-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sl-field__label"
  }, label), aside && /*#__PURE__*/React.createElement("span", {
    className: "sl-field__aside"
  }, aside)), /*#__PURE__*/React.createElement("textarea", _extends({
    "aria-describedby": errorId || hintId,
    "aria-invalid": error ? "true" : undefined,
    className: "sl-field__control",
    id: id
  }, props)), error ? /*#__PURE__*/React.createElement("span", {
    className: "sl-field__error",
    id: errorId
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "sl-field__hint",
    id: hintId
  }, hint) : null);
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open,
  eyebrow,
  title,
  description,
  children,
  actions,
  onClose
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
  return /*#__PURE__*/React.createElement("div", {
    className: "sl-dialog-backdrop",
    onMouseDown: event => {
      if (event.target === event.currentTarget) onClose?.();
    },
    role: "presentation"
  }, /*#__PURE__*/React.createElement("section", {
    "aria-describedby": description ? "sl-dialog-description" : undefined,
    "aria-labelledby": "sl-dialog-title",
    "aria-modal": "true",
    className: "sl-dialog",
    role: "dialog"
  }, eyebrow && /*#__PURE__*/React.createElement("p", {
    className: "sl-dialog__eyebrow"
  }, eyebrow), /*#__PURE__*/React.createElement("h2", {
    className: "sl-dialog__title",
    id: "sl-dialog-title"
  }, title), description && /*#__PURE__*/React.createElement("p", {
    className: "sl-dialog__description",
    id: "sl-dialog-description"
  }, description), children && /*#__PURE__*/React.createElement("div", {
    className: "sl-dialog__body"
  }, children), actions && /*#__PURE__*/React.createElement("div", {
    className: "sl-dialog__actions"
  }, actions)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const {
  Icon
} = __ds_scope;
function Toast({
  message,
  tone = "neutral",
  action,
  onClose
}) {
  const icon = tone === "success" ? "circle-check" : tone === "danger" ? "x" : "sparkles";
  return /*#__PURE__*/React.createElement("div", {
    "aria-live": "polite",
    className: ["sl-toast", tone !== "neutral" ? `sl-toast--${tone}` : ""].filter(Boolean).join(" "),
    role: "status"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 18
  }), /*#__PURE__*/React.createElement("span", {
    className: "sl-toast__message"
  }, message), action, onClose && /*#__PURE__*/React.createElement("button", {
    "aria-label": "\u5173\u95ED\u63D0\u793A",
    className: "sl-toast__action",
    onClick: onClose,
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 16
  })));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/learning/CategoryCard.jsx
try { (() => {
function CategoryCard({
  title,
  description,
  courseCount,
  coverUrl,
  colorA = "#68745a",
  colorB = "#273023",
  className = ""
}) {
  const style = {
    "--category-card-a": colorA,
    "--category-card-b": colorB
  };
  return /*#__PURE__*/React.createElement("figure", {
    "aria-label": `${title}，${courseCount} 门课程`,
    className: ["sl-category-card", className].filter(Boolean).join(" "),
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    className: "sl-category-card__image",
    style: coverUrl ? {
      backgroundImage: `url("${coverUrl}")`
    } : undefined
  }), /*#__PURE__*/React.createElement("div", {
    className: "sl-category-card__shade",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "sl-category-card__top"
  }, /*#__PURE__*/React.createElement("span", null, "Course collection"), /*#__PURE__*/React.createElement("span", null, courseCount, " \u95E8\u8BFE\u7A0B")), /*#__PURE__*/React.createElement("figcaption", {
    className: "sl-category-card__copy"
  }, /*#__PURE__*/React.createElement("span", null, description), /*#__PURE__*/React.createElement("h2", null, title), /*#__PURE__*/React.createElement("i", {
    "aria-hidden": "true"
  })));
}
Object.assign(__ds_scope, { CategoryCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/learning/CategoryCard.jsx", error: String((e && e.message) || e) }); }

// components/learning/ProgressBar.jsx
try { (() => {
function ProgressBar({
  value = 0,
  label,
  showValue = false,
  tone = "action",
  className = ""
}) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  const classes = ["sl-progress", tone !== "action" ? `sl-progress--${tone}` : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", {
    "aria-label": label || "学习进度",
    "aria-valuemax": "100",
    "aria-valuemin": "0",
    "aria-valuenow": Math.round(safeValue),
    className: classes,
    role: "progressbar"
  }, (label || showValue) && /*#__PURE__*/React.createElement("div", {
    className: "sl-progress__labels"
  }, /*#__PURE__*/React.createElement("span", null, label), showValue && /*#__PURE__*/React.createElement("span", null, Math.round(safeValue), "%")), /*#__PURE__*/React.createElement("div", {
    className: "sl-progress__track"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sl-progress__value",
    style: {
      width: `${safeValue}%`
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/learning/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/learning/CourseCard.jsx
try { (() => {
const {
  Icon
} = __ds_scope;
const {
  ProgressBar
} = __ds_scope;
function CourseCard({
  title,
  meta,
  coverUrl,
  colorA = "#68745a",
  colorB = "#273023",
  favorite = false,
  progress,
  onOpen,
  onToggleFavorite,
  duration,
  variant = "row",
  className = ""
}) {
  const style = {
    "--card-color-a": colorA,
    "--card-color-b": colorB
  };
  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen?.();
    }
  }
  const rootProps = {
    "aria-label": `学习 ${title}`,
    className: ["sl-course-card", variant === "feed" ? "sl-course-card--feed" : "", className].filter(Boolean).join(" "),
    onClick: onOpen,
    onKeyDown: handleKeyDown,
    role: "button",
    style,
    tabIndex: 0
  };
  if (variant === "feed") {
    return /*#__PURE__*/React.createElement("div", rootProps, /*#__PURE__*/React.createElement("div", {
      className: "sl-course-card__feed-cover-wrap"
    }, /*#__PURE__*/React.createElement("div", {
      "aria-hidden": "true",
      className: "sl-course-card__feed-cover",
      style: coverUrl ? {
        backgroundImage: `url("${coverUrl}")`
      } : undefined
    }), duration && /*#__PURE__*/React.createElement("span", {
      className: "sl-course-card__duration"
    }, duration), /*#__PURE__*/React.createElement("button", {
      "aria-label": favorite ? "取消收藏" : "收藏课程",
      "aria-pressed": favorite,
      className: "sl-course-card__favorite sl-course-card__favorite--feed",
      onClick: event => {
        event.stopPropagation();
        onToggleFavorite?.();
      },
      type: "button"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "heart",
      size: 18
    }))), /*#__PURE__*/React.createElement("div", {
      className: "sl-course-card__feed-body"
    }, /*#__PURE__*/React.createElement("h3", {
      className: "sl-course-card__title"
    }, title), /*#__PURE__*/React.createElement("p", {
      className: "sl-course-card__meta"
    }, meta), typeof progress === "number" && /*#__PURE__*/React.createElement(ProgressBar, {
      className: "sl-course-card__progress",
      value: progress
    })));
  }
  return /*#__PURE__*/React.createElement("div", rootProps, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": "true",
    className: "sl-course-card__cover",
    style: coverUrl ? {
      backgroundImage: `url("${coverUrl}")`
    } : undefined
  }), /*#__PURE__*/React.createElement("div", {
    className: "sl-course-card__body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sl-course-card__top"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "sl-course-card__title"
  }, title), /*#__PURE__*/React.createElement("button", {
    "aria-label": favorite ? "取消收藏" : "收藏课程",
    "aria-pressed": favorite,
    className: "sl-course-card__favorite",
    onClick: event => {
      event.stopPropagation();
      onToggleFavorite?.();
    },
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "heart",
    size: 19
  }))), /*#__PURE__*/React.createElement("p", {
    className: "sl-course-card__meta"
  }, meta), typeof progress === "number" && /*#__PURE__*/React.createElement(ProgressBar, {
    className: "sl-course-card__progress",
    value: progress
  })));
}
Object.assign(__ds_scope, { CourseCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/learning/CourseCard.jsx", error: String((e && e.message) || e) }); }

// components/learning/ModeSwitcher.jsx
try { (() => {
const {
  Icon
} = __ds_scope;
const modes = [{
  value: "listen",
  label: "听",
  icon: "headphones"
}, {
  value: "read",
  label: "读",
  icon: "book-open"
}, {
  value: "write",
  label: "写",
  icon: "pen-line"
}, {
  value: "speak",
  label: "说",
  icon: "mic"
}];
function ModeSwitcher({
  value = "listen",
  onChange,
  iconOnly = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    "aria-label": "\u5B66\u4E60\u6A21\u5F0F",
    className: "sl-mode-switch " + (iconOnly ? "sl-mode-switch--icon-only" : ""),
    role: "tablist"
  }, modes.map(mode => /*#__PURE__*/React.createElement("button", {
    "aria-label": iconOnly ? mode.label : undefined,
    "aria-selected": value === mode.value,
    className: "sl-mode",
    key: mode.value,
    onClick: () => onChange?.(mode.value),
    role: "tab",
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: mode.icon,
    size: 19
  }), !iconOnly && /*#__PURE__*/React.createElement("span", null, mode.label))));
}
Object.assign(__ds_scope, { ModeSwitcher });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/learning/ModeSwitcher.jsx", error: String((e && e.message) || e) }); }

// components/learning/StatTile.jsx
try { (() => {
function StatTile({
  value,
  label,
  detail,
  className = ""
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: ["sl-stat-tile", className].filter(Boolean).join(" ")
  }, /*#__PURE__*/React.createElement("strong", {
    className: "sl-stat-tile__value"
  }, value), /*#__PURE__*/React.createElement("span", {
    className: "sl-stat-tile__label"
  }, label), detail && /*#__PURE__*/React.createElement("span", {
    className: "sl-stat-tile__detail"
  }, detail));
}
Object.assign(__ds_scope, { StatTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/learning/StatTile.jsx", error: String((e && e.message) || e) }); }

// components/navigation/BottomNav.jsx
try { (() => {
const {
  Icon
} = __ds_scope;
const items = [{
  value: "home",
  label: "首页",
  icon: "home"
}, {
  value: "me",
  label: "我的",
  icon: "user-round"
}];
function BottomNav({
  value = "home",
  onChange
}) {
  return /*#__PURE__*/React.createElement("nav", {
    "aria-label": "\u4E3B\u5BFC\u822A",
    className: "sl-bottom-nav"
  }, items.map(item => /*#__PURE__*/React.createElement("button", {
    "aria-current": value === item.value ? "page" : undefined,
    className: "sl-bottom-nav__item",
    key: item.value,
    onClick: () => onChange?.(item.value),
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: item.icon,
    size: 22
  }), /*#__PURE__*/React.createElement("span", null, item.label))));
}
Object.assign(__ds_scope, { BottomNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/BottomNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  items,
  value,
  onChange,
  ariaLabel = "分类",
  variant = "underline",
  className = ""
}) {
  const classes = ["sl-tabs", variant === "pill" ? "sl-tabs--pill" : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("div", {
    "aria-label": ariaLabel,
    className: classes,
    role: "tablist"
  }, items.map(item => /*#__PURE__*/React.createElement("button", {
    "aria-selected": value === item.value,
    className: "sl-tab",
    key: item.value,
    onClick: () => onChange?.(item.value),
    role: "tab",
    type: "button"
  }, item.label)));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/learner/app.jsx
try { (() => {
const {
  SaylineWordmark,
  ReviewRail
} = window.SaylineShared;
const {
  LoginScreen,
  HomeScreen,
  MyScreen,
  InterestOnboardingScreen,
  PreferencesScreen
} = window;
const {
  PlayerScreen
} = window.SaylinePlayer;
const {
  Toast
} = window.SaylineDesignSystem_1a4fd3;
function App() {
  const initialParams = new URLSearchParams(window.location.search);
  const requestedScreen = initialParams.get("screen");
  const initialScreen = ["login", "interests", "home", "me", "player", "preferences"].includes(requestedScreen) ? requestedScreen : "home";
  const initialInterests = window.SaylineData.defaultInterests;
  const requestedCategory = initialParams.get("category");
  const initialCategory = requestedCategory === "favorite" || initialInterests.includes(requestedCategory) ? requestedCategory : initialInterests[0];
  const initialPeriod = initialParams.get("period") === "month" ? "month" : "week";
  const defaultPlayerCourse = window.SaylineData.courses.find(course => course.progress > 0);
  const [screen, setScreen] = React.useState(initialScreen);
  const [category, setCategory] = React.useState(initialCategory);
  const [interests, setInterests] = React.useState(initialInterests);
  const [defaultTab, setDefaultTab] = React.useState(initialInterests[0]);
  const [period, setPeriod] = React.useState(initialPeriod);
  const [courses, setCourses] = React.useState(window.SaylineData.courses);
  const [playerCourseId, setPlayerCourseId] = React.useState(initialScreen === "player" ? defaultPlayerCourse.id : null);
  const [playerListIds, setPlayerListIds] = React.useState(initialScreen === "player" ? (initialCategory === "favorite" ? courses.filter(course => course.favorite) : courses.filter(course => course.category === initialCategory)).map(course => course.id) : []);
  const [toast, setToast] = React.useState("");
  const playerCourse = courses.find(course => course.id === playerCourseId);
  const homeCategories = interests.map(value => window.SaylineData.categories.find(item => item.value === value)).filter(Boolean);
  function listForCategory(value) {
    if (value === "favorite") return courses.filter(course => course.favorite);
    return courses.filter(course => course.category === value);
  }
  function navigate(next) {
    setScreen(next);
  }
  function openCourse(course) {
    const list = listForCategory(category);
    setPlayerListIds(list.map(item => item.id));
    setPlayerCourseId(course.id);
    setScreen("player");
  }
  function toggleFavorite(courseId) {
    const current = courses.find(course => course.id === courseId);
    const nowFavorite = !current?.favorite;
    setCourses(items => items.map(course => course.id === courseId ? {
      ...course,
      favorite: nowFavorite
    } : course));
    setToast(nowFavorite ? "已加入我喜欢" : "已从我喜欢移除");
    window.setTimeout(() => setToast(""), 2200);
  }
  function moveCourse(direction) {
    const index = playerListIds.indexOf(playerCourseId);
    const nextIndex = index + direction;
    if (nextIndex < 0) {
      setToast("已经是第一门课程");
      window.setTimeout(() => setToast(""), 1800);
      return;
    }
    if (nextIndex >= playerListIds.length) {
      setToast("本列表已学完");
      window.setTimeout(() => setToast(""), 1800);
      return;
    }
    setPlayerCourseId(playerListIds[nextIndex]);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "review-shell"
  }, /*#__PURE__*/React.createElement(ReviewRail, {
    onNavigate: next => {
      if (next === "player" && !playerCourseId) {
        setPlayerListIds(listForCategory(category).map(item => item.id));
        setPlayerCourseId((courses.find(course => course.progress > 0) || courses[0]).id);
      }
      setScreen(next);
    },
    screen: screen
  }), /*#__PURE__*/React.createElement("div", {
    className: "device-stage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "device-caption"
  }, /*#__PURE__*/React.createElement("span", null, screen === "player" ? "immersive player" : screen === "me" ? "learning report" : screen === "login" ? "account entry" : screen === "interests" ? "interest setup" : screen === "preferences" ? "learning preferences" : "course discovery"), /*#__PURE__*/React.createElement("span", null, "390 \xD7 844")), /*#__PURE__*/React.createElement("div", {
    className: "phone-device"
  }, screen === "login" && /*#__PURE__*/React.createElement(LoginScreen, {
    onLogin: () => setScreen("interests")
  }), screen === "interests" && /*#__PURE__*/React.createElement(InterestOnboardingScreen, {
    onComplete: selected => {
      setInterests(selected);
      setDefaultTab(selected[0]);
      setCategory(selected[0]);
      setScreen("home");
    }
  }), screen === "home" && /*#__PURE__*/React.createElement(HomeScreen, {
    category: category,
    categories: homeCategories,
    courses: courses,
    onCategory: setCategory,
    onNavigate: navigate,
    onOpenCourse: openCourse,
    onToggleFavorite: toggleFavorite
  }), screen === "me" && /*#__PURE__*/React.createElement(MyScreen, {
    defaultTab: defaultTab,
    interests: interests,
    onNavigate: navigate,
    onOpenPreferences: () => setScreen("preferences"),
    period: period,
    setPeriod: setPeriod
  }), screen === "preferences" && /*#__PURE__*/React.createElement(PreferencesScreen, {
    defaultTab: defaultTab,
    interests: interests,
    onBack: () => setScreen("me"),
    onSave: (nextInterests, nextDefault) => {
      setInterests(nextInterests);
      setDefaultTab(nextDefault);
      setCategory(nextDefault);
      setScreen("home");
      setToast("学习偏好已保存");
      window.setTimeout(() => setToast(""), 2200);
    }
  }), screen === "player" && playerCourse && /*#__PURE__*/React.createElement(PlayerScreen, {
    course: playerCourse,
    initialMode: initialParams.get("mode"),
    onClose: () => setScreen("home"),
    onMoveCourse: moveCourse,
    onToggleFavorite: () => toggleFavorite(playerCourse.id)
  })), /*#__PURE__*/React.createElement("div", {
    className: "device-hint"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", null), " \u53EF\u4EA4\u4E92\u539F\u578B"), /*#__PURE__*/React.createElement("span", null, "\u64AD\u653E\u5668\uFF1A\u2191 / \u2193 \u5207\u6362\u8BFE\u7A0B"))), toast && /*#__PURE__*/React.createElement("div", {
    className: "prototype-toast"
  }, /*#__PURE__*/React.createElement(Toast, {
    message: toast,
    tone: toast.includes("已") ? "success" : "neutral"
  })));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/learner/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/learner/data.jsx
try { (() => {
const courses = [{
  id: "meeting-colleague",
  title: "Meeting a New Colleague",
  titleZh: "认识新同事",
  category: "work",
  categoryLabel: "职场英语",
  duration: "4:28",
  progress: 58,
  favorite: true,
  colorA: "#65734f",
  colorB: "#9f5e31",
  theme: "olive",
  cues: [{
    id: 1,
    start: "00:08",
    end: "00:14",
    en: "Nice to meet you. I'm Alex from the design team.",
    zh: "很高兴认识你，我是设计团队的 Alex。"
  }, {
    id: 2,
    start: "00:15",
    end: "00:22",
    en: "Nice to meet you too. I just joined this week.",
    zh: "我也很高兴认识你，我这周刚入职。"
  }, {
    id: 3,
    start: "00:23",
    end: "00:30",
    en: "Could we move the meeting to Friday morning?",
    zh: "我们能把会议改到周五上午吗？"
  }, {
    id: 4,
    start: "00:31",
    end: "00:37",
    en: "Friday works for me. How about ten thirty?",
    zh: "周五我可以。十点半怎么样？"
  }, {
    id: 5,
    start: "00:38",
    end: "00:45",
    en: "That's perfect. I'll send a calendar invite.",
    zh: "太好了，我会发一个日历邀请。"
  }]
}, {
  id: "coffee-chat",
  title: "Coffee Chat Basics",
  titleZh: "咖啡闲聊入门",
  category: "spoken",
  categoryLabel: "日常口语",
  duration: "3:12",
  progress: 24,
  favorite: false,
  colorA: "#436b83",
  colorB: "#1b3346",
  theme: "blue",
  cues: [{
    id: 1,
    start: "00:05",
    end: "00:11",
    en: "Is this seat taken?",
    zh: "这个座位有人吗？"
  }, {
    id: 2,
    start: "00:12",
    end: "00:18",
    en: "No, go ahead. I'm waiting for a friend.",
    zh: "没有，请坐。我在等朋友。"
  }, {
    id: 3,
    start: "00:19",
    end: "00:26",
    en: "The coffee here is surprisingly good.",
    zh: "这里的咖啡出乎意料地好喝。"
  }, {
    id: 4,
    start: "00:27",
    end: "00:33",
    en: "I usually come here after class.",
    zh: "我通常下课后会来这里。"
  }]
}, {
  id: "listening-work",
  title: "Listening at Work",
  titleZh: "听懂工作会议",
  category: "work",
  categoryLabel: "职场听力",
  duration: "5:06",
  progress: 0,
  favorite: false,
  colorA: "#486044",
  colorB: "#1e2921",
  theme: "forest",
  cues: [{
    id: 1,
    start: "00:06",
    end: "00:13",
    en: "Let's begin with the latest numbers.",
    zh: "我们先从最新的数据开始。"
  }, {
    id: 2,
    start: "00:14",
    end: "00:20",
    en: "I think we should focus on retention.",
    zh: "我认为我们应该关注留存率。"
  }, {
    id: 3,
    start: "00:21",
    end: "00:28",
    en: "Could you walk us through the result?",
    zh: "你能带我们过一遍结果吗？"
  }]
}, {
  id: "small-talk",
  title: "Small Talk at Lunch",
  titleZh: "午餐闲聊",
  category: "spoken",
  categoryLabel: "日常口语",
  duration: "3:44",
  progress: 81,
  favorite: true,
  colorA: "#8b6651",
  colorB: "#42271f",
  theme: "clay",
  cues: [{
    id: 1,
    start: "00:04",
    end: "00:10",
    en: "Have you tried the new place downstairs?",
    zh: "你试过楼下新开的店吗？"
  }, {
    id: 2,
    start: "00:11",
    end: "00:17",
    en: "Not yet. Is it any good?",
    zh: "还没有。好吃吗？"
  }, {
    id: 3,
    start: "00:18",
    end: "00:24",
    en: "Their noodles are worth the wait.",
    zh: "他们的面值得等。"
  }]
}, {
  id: "main-point",
  title: "Get the Main Point",
  titleZh: "抓住核心观点",
  category: "listening",
  categoryLabel: "听力训练",
  duration: "4:10",
  progress: 0,
  favorite: false,
  colorA: "#517671",
  colorB: "#243a38",
  theme: "teal",
  cues: [{
    id: 1,
    start: "00:05",
    end: "00:11",
    en: "The key issue is not speed but clarity.",
    zh: "关键问题不是速度，而是清晰度。"
  }, {
    id: 2,
    start: "00:12",
    end: "00:18",
    en: "People remember stories better than facts.",
    zh: "人们往往更容易记住故事，而不是事实。"
  }, {
    id: 3,
    start: "00:19",
    end: "00:26",
    en: "So let's lead with one concrete example.",
    zh: "所以我们先用一个具体的例子开场。"
  }]
}, {
  id: "email-followup",
  title: "Email Follow-up",
  titleZh: "跟进邮件",
  category: "work",
  categoryLabel: "职场写作",
  duration: "5:18",
  progress: 0,
  favorite: false,
  colorA: "#94633c",
  colorB: "#3e2a1c",
  theme: "amber",
  cues: [{
    id: 1,
    start: "00:04",
    end: "00:10",
    en: "Just following up on my previous email.",
    zh: "想跟进一下我之前的邮件。"
  }, {
    id: 2,
    start: "00:11",
    end: "00:17",
    en: "Let me know if you need anything else.",
    zh: "如果需要其他信息，请告诉我。"
  }, {
    id: 3,
    start: "00:18",
    end: "00:24",
    en: "I'd appreciate a reply by Thursday.",
    zh: "如果能在周四前回复，我会很感激。"
  }]
}];
const stats = {
  week: {
    days: [{
      label: "一",
      minutes: 38,
      sessions: 1
    }, {
      label: "二",
      minutes: 0,
      sessions: 0
    }, {
      label: "三",
      minutes: 72,
      sessions: 2
    }, {
      label: "四",
      minutes: 51,
      sessions: 1
    }, {
      label: "五",
      minutes: 0,
      sessions: 0
    }, {
      label: "六",
      minutes: 96,
      sessions: 2
    }, {
      label: "日",
      minutes: 0,
      sessions: 0
    }],
    studiedDays: 4,
    sessions: 6,
    duration: "4h17m",
    accuracy: 86,
    speakingCount: 24
  },
  month: {
    values: {
      1: 0,
      2: 24,
      3: 12,
      4: 0,
      5: 18,
      6: 62,
      7: 33,
      8: 20,
      9: 0,
      10: 44,
      11: 76,
      12: 16,
      13: 0,
      14: 32,
      15: 0,
      16: 12,
      17: 54,
      18: 22,
      19: 43,
      20: 88,
      21: 38,
      22: 0,
      23: 0,
      24: 0,
      25: 0,
      26: 0,
      27: 0,
      28: 0,
      29: 0,
      30: 0,
      31: 0
    },
    studiedDays: 15,
    sessions: 26,
    duration: "11h08m",
    accuracy: 84,
    speakingCount: 61
  }
};
const categories = [{
  value: "work",
  label: "职场",
  fullLabel: "职场英语",
  description: "会议、协作与职场表达",
  icon: "pen-line",
  colorA: "#62704c",
  colorB: "#8b5734",
  coverUrl: "../../assets/covers/work.jpg"
}, {
  value: "spoken",
  label: "口语",
  fullLabel: "日常口语",
  description: "闲聊、社交与自然表达",
  icon: "mic",
  colorA: "#8b6651",
  colorB: "#42271f",
  coverUrl: "../../assets/covers/spoken.jpg"
}, {
  value: "listening",
  label: "听力",
  fullLabel: "听力训练",
  description: "抓住重点、适应真实语速",
  icon: "headphones",
  colorA: "#517671",
  colorB: "#243a38",
  coverUrl: "../../assets/covers/listening.jpg"
}];
const defaultInterests = ["work", "spoken"];
const profile = {
  nickname: "林禾",
  phone: "138****8000",
  joinedAt: "2026 年 10 月加入",
  studyDays: 27
};
window.SaylineData = {
  courses,
  stats,
  categories,
  defaultInterests,
  profile,
  modes: [{
    value: "listen",
    label: "听",
    icon: "headphones"
  }, {
    value: "read",
    label: "读",
    icon: "book-open"
  }, {
    value: "write",
    label: "写",
    icon: "pen-line"
  }, {
    value: "speak",
    label: "说",
    icon: "mic"
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/learner/data.jsx", error: String((e && e.message) || e) }); }

// ui_kits/learner/player.jsx
try { (() => {
const {
  CoverArt
} = window.SaylineShared;
const {
  Badge,
  Button,
  Icon,
  IconButton,
  ModeSwitcher,
  ProgressBar,
  Textarea
} = window.SaylineDesignSystem_1a4fd3;
const modeCopy = {
  listen: {
    label: "听",
    title: "听见每一句的节奏",
    eyebrow: "LISTEN"
  },
  read: {
    label: "读",
    title: "看懂句子之间的关系",
    eyebrow: "READ"
  },
  write: {
    label: "写",
    title: "把听见的写下来",
    eyebrow: "WRITE"
  },
  speak: {
    label: "说",
    title: "让这一句从你口中经过",
    eyebrow: "SPEAK"
  }
};
function formatAudioTime(seconds) {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, "0")}`;
}
function cueSeconds(cue) {
  const [minutes, seconds] = cue.start.split(":").map(Number);
  return minutes * 60 + seconds + (Number(cue.id) - 1) * 0.2;
}
function ListenMode({
  course,
  activeCue,
  setActiveCue,
  showTranslation,
  setShowTranslation
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "listen-mode"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lyrics-window"
  }, course.cues.map((cue, index) => {
    const distance = Math.abs(index - activeCue);
    return /*#__PURE__*/React.createElement("button", {
      className: "lyric-line " + (index === activeCue ? "is-active " : "") + (distance > 1 ? "is-far" : ""),
      key: cue.id,
      onClick: () => setActiveCue(index),
      type: "button"
    }, /*#__PURE__*/React.createElement("span", {
      className: "lyric-line__en",
      lang: "en"
    }, cue.en), showTranslation && /*#__PURE__*/React.createElement("span", {
      className: "lyric-line__zh",
      lang: "zh"
    }, cue.zh));
  })), /*#__PURE__*/React.createElement("div", {
    className: "lyric-tools"
  }, /*#__PURE__*/React.createElement("button", {
    className: "translation-toggle",
    onClick: () => setShowTranslation(value => !value),
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "captions",
    size: 17
  }), showTranslation ? "隐藏中文" : "显示中文"), /*#__PURE__*/React.createElement("span", null, "\u70B9\u51FB\u53E5\u5B50\u53EF\u4ECE\u8FD9\u91CC\u64AD\u653E")));
}
function ReadMode({
  course,
  activeCue,
  setActiveCue,
  showTranslation,
  setShowTranslation
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "read-mode"
  }, /*#__PURE__*/React.createElement("div", {
    className: "read-mode__head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "BILINGUAL TRANSCRIPT"), /*#__PURE__*/React.createElement("h2", null, "\u9010\u53E5\u539F\u6587")), /*#__PURE__*/React.createElement("button", {
    className: "translation-toggle",
    onClick: () => setShowTranslation(value => !value),
    type: "button"
  }, showTranslation ? "隐藏中文" : "显示中文")), /*#__PURE__*/React.createElement("div", {
    className: "transcript-list"
  }, course.cues.map((cue, index) => /*#__PURE__*/React.createElement("button", {
    className: "transcript-row " + (index === activeCue ? "is-active" : ""),
    key: cue.id,
    onClick: () => setActiveCue(index),
    type: "button"
  }, /*#__PURE__*/React.createElement("span", {
    className: "transcript-row__index"
  }, String(index + 1).padStart(2, "0")), /*#__PURE__*/React.createElement("span", {
    className: "transcript-row__copy"
  }, /*#__PURE__*/React.createElement("strong", {
    lang: "en"
  }, cue.en), showTranslation && /*#__PURE__*/React.createElement("span", {
    lang: "zh"
  }, cue.zh)), /*#__PURE__*/React.createElement(Icon, {
    name: "play",
    size: 16
  })))));
}
function WriteMode({
  course,
  activeCue,
  setActiveCue,
  answer,
  setAnswer,
  feedback,
  onSubmit,
  onReplay,
  playing
}) {
  const cue = course.cues[activeCue];
  return /*#__PURE__*/React.createElement("div", {
    className: "write-mode"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mode-copy"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "DICTATION \xB7 ", activeCue + 1, "/", course.cues.length), /*#__PURE__*/React.createElement("h2", null, modeCopy.write.title)), /*#__PURE__*/React.createElement(Badge, null, "\u7B2C ", activeCue + 1, " / ", course.cues.length, " \u53E5")), /*#__PURE__*/React.createElement("button", {
    className: "cue-player",
    onClick: onReplay,
    type: "button"
  }, /*#__PURE__*/React.createElement("span", {
    className: "cue-player__icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: playing ? "pause" : "play",
    size: 19
  })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("strong", null, "\u91CD\u542C\u5F53\u524D\u53E5"), /*#__PURE__*/React.createElement("small", null, cue.start, " \u2014 ", cue.end)), /*#__PURE__*/React.createElement("span", {
    className: "cue-player__mini-bars",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null), /*#__PURE__*/React.createElement("i", null))), /*#__PURE__*/React.createElement(Textarea, {
    aside: `${answer.length}/120`,
    className: "dictation-field",
    id: "dictation-answer",
    label: "\u5199\u4E0B\u4F60\u542C\u5230\u7684\u82F1\u6587",
    maxLength: 120,
    onChange: event => setAnswer(event.target.value),
    placeholder: "Type what you hear\u2026",
    rows: 4,
    value: answer
  }), feedback === "wrong" && /*#__PURE__*/React.createElement("div", {
    className: "dictation-feedback is-wrong"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 16
  }), /*#__PURE__*/React.createElement("strong", null, "\u8FD8\u5DEE\u4E00\u70B9")), /*#__PURE__*/React.createElement("p", null, "\u518D\u542C\u4E00\u6B21\uFF0C\u6CE8\u610F \u201Cmeeting\u201D \u548C \u201CFriday\u201D\u3002")), feedback === "correct" && /*#__PURE__*/React.createElement("div", {
    className: "dictation-feedback is-correct"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Icon, {
    name: "circle-check",
    size: 16
  }), /*#__PURE__*/React.createElement("strong", null, "\u5199\u5BF9\u4E86")), /*#__PURE__*/React.createElement("p", null, cue.en)), /*#__PURE__*/React.createElement("div", {
    className: "mode-actions"
  }, /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    onClick: onSubmit,
    variant: feedback === "correct" ? "secondary" : "accent"
  }, feedback === "correct" ? "下一句" : "提交答案"), /*#__PURE__*/React.createElement("button", {
    className: "skip-link",
    onClick: () => {
      setAnswer("");
      setActiveCue(value => Math.min(course.cues.length - 1, value + 1));
    },
    type: "button"
  }, "\u6682\u65F6\u8DF3\u8FC7\u8FD9\u4E00\u53E5")));
}
function SpeakMode({
  course,
  activeCue,
  setActiveCue,
  recording,
  recorded,
  seconds,
  onRecord
}) {
  const cue = course.cues[activeCue];
  return /*#__PURE__*/React.createElement("div", {
    className: "speak-mode"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mode-copy"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "SHADOWING \xB7 ", activeCue + 1, "/", course.cues.length), /*#__PURE__*/React.createElement("h2", null, modeCopy.speak.title)), /*#__PURE__*/React.createElement(Badge, {
    tone: recorded ? "success" : "neutral"
  }, recorded ? "已录制" : "未录音")), /*#__PURE__*/React.createElement("div", {
    className: "speak-quote"
  }, /*#__PURE__*/React.createElement("span", {
    lang: "en"
  }, cue.en), /*#__PURE__*/React.createElement("small", {
    lang: "zh"
  }, cue.zh)), /*#__PURE__*/React.createElement("div", {
    className: "record-stage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "record-wave " + (recording ? "is-live" : ""),
    "aria-hidden": "true"
  }, [18, 29, 42, 34, 52, 28, 44, 23, 35, 20].map((height, index) => /*#__PURE__*/React.createElement("i", {
    key: index,
    style: {
      height
    }
  }))), /*#__PURE__*/React.createElement("button", {
    "aria-label": recording ? "停止录音" : "开始录音",
    className: "record-button " + (recording ? "is-recording" : ""),
    onClick: onRecord,
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: recording ? "square" : "mic",
    size: 26
  })), /*#__PURE__*/React.createElement("p", null, recording ? `正在录音 · ${seconds.toFixed(1)}s` : recorded ? "可以回听刚才的跟读" : "点击后跟读当前句")), /*#__PURE__*/React.createElement("div", {
    className: "voice-compare"
  }, /*#__PURE__*/React.createElement("button", {
    disabled: !recorded,
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "play",
    size: 16
  }), /*#__PURE__*/React.createElement("span", null, "\u539F\u53E5"), /*#__PURE__*/React.createElement("small", null, cue.end)), /*#__PURE__*/React.createElement("button", {
    disabled: !recorded,
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "play",
    size: 16
  }), /*#__PURE__*/React.createElement("span", null, "\u6211\u7684\u5F55\u97F3"), /*#__PURE__*/React.createElement("small", null, recorded ? `${Math.max(1, Math.round(seconds))}s` : "--"))), /*#__PURE__*/React.createElement("div", {
    className: "mode-actions mode-actions--row"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    disabled: !recorded,
    onClick: () => setActiveCue(value => Math.max(0, value - 1))
  }, "\u4E0A\u4E00\u53E5"), /*#__PURE__*/React.createElement(Button, {
    disabled: !recorded,
    onClick: () => {
      setActiveCue(value => Math.min(course.cues.length - 1, value + 1));
    }
  }, "\u4E0B\u4E00\u53E5")));
}
function AudioDeck({
  playing,
  onPlay,
  onReplay,
  onForward,
  speed,
  onSpeed,
  progress
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "audio-deck"
  }, /*#__PURE__*/React.createElement("div", {
    className: "audio-deck__times"
  }, /*#__PURE__*/React.createElement("span", null, formatAudioTime(progress / 100 * 268)), /*#__PURE__*/React.createElement("button", {
    onClick: onSpeed,
    type: "button"
  }, speed.toFixed(2).replace(/0$/, ""), "\xD7"), /*#__PURE__*/React.createElement("span", null, "4:28")), /*#__PURE__*/React.createElement("div", {
    className: "audio-deck__track"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: `${progress}%`
    }
  }), /*#__PURE__*/React.createElement("i", {
    style: {
      left: `${progress}%`
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "audio-deck__controls"
  }, /*#__PURE__*/React.createElement(IconButton, {
    className: "transport-round",
    label: "\u540E\u9000 15 \u79D2",
    onClick: onReplay
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "rotate-ccw",
    size: 28,
    strokeWidth: 2.2
  }), /*#__PURE__*/React.createElement("span", null, "15")), /*#__PURE__*/React.createElement(IconButton, {
    className: "transport-skip",
    label: "\u4E0A\u4E00\u53E5",
    onClick: () => onReplay(-1)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "skip-back",
    size: 27,
    strokeWidth: 2
  })), /*#__PURE__*/React.createElement("button", {
    "aria-label": playing ? "暂停" : "播放",
    className: "audio-play",
    onClick: onPlay,
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: playing ? "pause" : "play",
    size: 28,
    strokeWidth: 1.5
  })), /*#__PURE__*/React.createElement(IconButton, {
    className: "transport-skip",
    label: "\u4E0B\u4E00\u53E5",
    onClick: () => onForward(1)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "skip-forward",
    size: 27,
    strokeWidth: 2
  })), /*#__PURE__*/React.createElement(IconButton, {
    className: "transport-round",
    label: "\u524D\u8FDB 15 \u79D2",
    onClick: () => onForward()
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "rotate-cw",
    size: 28,
    strokeWidth: 2.2
  }), /*#__PURE__*/React.createElement("span", null, "15"))));
}
function PlayerScreen({
  course,
  initialMode = "listen",
  onClose,
  onToggleFavorite,
  onMoveCourse
}) {
  const validInitialMode = ["listen", "read", "write", "speak"].includes(initialMode) ? initialMode : "listen";
  const initialParams = new URLSearchParams(window.location.search);
  const [mode, setMode] = React.useState(validInitialMode);
  const [controlsVisible, setControlsVisible] = React.useState(initialParams.get("controls") === "1");
  const [activeCue, setActiveCue] = React.useState(2);
  const [showTranslation, setShowTranslation] = React.useState(true);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const [answer, setAnswer] = React.useState("");
  const [feedback, setFeedback] = React.useState("");
  const [recording, setRecording] = React.useState(false);
  const [recorded, setRecorded] = React.useState(false);
  const [recordSeconds, setRecordSeconds] = React.useState(0);
  const [modeProgress, setModeProgress] = React.useState({
    listen: 100,
    read: 61,
    write: 40,
    speak: 20
  });
  const [confirmed, setConfirmed] = React.useState({
    listen: false,
    read: false,
    write: false,
    speak: false
  });
  const swipeStart = React.useRef(null);
  const swipeWasTriggered = React.useRef(false);
  React.useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setModeProgress(value => ({
        ...value,
        listen: Math.min(100, value.listen + 0.2)
      }));
    }, 700);
    return () => window.clearInterval(timer);
  }, [playing]);
  React.useEffect(() => {
    if (!recording) return undefined;
    const timer = window.setInterval(() => setRecordSeconds(value => value + 0.1), 100);
    return () => window.clearInterval(timer);
  }, [recording]);
  React.useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        onMoveCourse(1);
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        onMoveCourse(-1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onMoveCourse]);
  const current = course.cues[Math.min(activeCue, course.cues.length - 1)];
  const playbackProgress = Math.max(8, (activeCue + 1) / course.cues.length * 100);
  const modeLabels = ["listen", "read", "write", "speak"];
  const canConfirm = modeProgress[mode] >= 100;
  function cycleSpeed() {
    const speeds = [1, 1.25, 0.75];
    setSpeed(speeds[(speeds.indexOf(speed) + 1) % speeds.length]);
  }
  function submitDictation() {
    const normalize = text => text.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
    const correct = normalize(answer) === normalize(current.en);
    setFeedback(correct ? "correct" : "wrong");
    if (correct) {
      setModeProgress(value => ({
        ...value,
        write: Math.min(100, value.write + 20)
      }));
    }
  }
  function toggleRecording() {
    if (recording) {
      setRecording(false);
      if (recordSeconds >= 1) {
        setRecorded(true);
        setModeProgress(value => ({
          ...value,
          speak: Math.min(100, value.speak + 25)
        }));
      }
      return;
    }
    setRecorded(false);
    setRecordSeconds(0);
    setRecording(true);
  }
  function handlePointerDown(event) {
    if (event.target.closest("input, textarea, .audio-deck, .sl-mode-switch, .player-header, .player-identity, .player-complete-row, .mode-actions, .record-button")) return;
    swipeStart.current = {
      x: event.clientX,
      y: event.clientY
    };
    swipeWasTriggered.current = false;
  }
  function handlePointerUp(event) {
    if (swipeStart.current == null) return;
    const deltaX = event.clientX - swipeStart.current.x;
    const deltaY = swipeStart.current.y - event.clientY;
    swipeStart.current = null;
    if (Math.abs(deltaY) < 70 || Math.abs(deltaY) <= Math.abs(deltaX)) return;
    swipeWasTriggered.current = true;
    onMoveCourse(deltaY > 0 ? 1 : -1);
  }
  function handlePlayerClick(event) {
    if (!["listen", "read"].includes(mode)) return;
    if (event.target.closest("input, textarea, .audio-deck, .sl-mode-switch, .player-header, .player-identity, .player-complete-row, .translation-toggle")) return;
    if (event.target.closest(".lyric-line, .transcript-row")) {
      setControlsVisible(true);
      return;
    }
    setControlsVisible(visible => !visible);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "app-screen player-screen",
    onClickCapture: event => {
      if (!swipeWasTriggered.current) return;
      event.preventDefault();
      event.stopPropagation();
      swipeWasTriggered.current = false;
    },
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onClick: handlePlayerClick,
    style: {
      "--course-a": course.colorA,
      "--course-b": course.colorB
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "player-atmosphere",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "player-overlay",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("header", {
    className: "player-header"
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "\u8FD4\u56DE\u9996\u9875",
    onClick: onClose
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-down",
    size: 24
  })), /*#__PURE__*/React.createElement("div", {
    className: "player-header__title"
  }, /*#__PURE__*/React.createElement("span", null, "NOW LEARNING"), /*#__PURE__*/React.createElement("strong", null, "\u9010\u53E5\u64AD\u653E")), /*#__PURE__*/React.createElement(IconButton, {
    active: course.favorite,
    label: course.favorite ? "取消收藏" : "收藏课程",
    onClick: onToggleFavorite
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "heart",
    size: 21
  }))), /*#__PURE__*/React.createElement("section", {
    className: "player-identity"
  }, /*#__PURE__*/React.createElement(CoverArt, {
    className: "player-identity__cover",
    course: course
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "player-identity__meta"
  }, /*#__PURE__*/React.createElement("span", null, course.categoryLabel), /*#__PURE__*/React.createElement("span", null, course.duration)), /*#__PURE__*/React.createElement("h1", null, course.title), /*#__PURE__*/React.createElement("p", null, course.titleZh)), /*#__PURE__*/React.createElement("button", {
    "aria-label": "\u66F4\u591A\u8BFE\u7A0B\u64CD\u4F5C",
    className: "player-more",
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "ellipsis",
    size: 20
  }))), /*#__PURE__*/React.createElement("div", {
    className: "mode-progress-strip",
    "aria-hidden": "true"
  }, modeLabels.map(item => /*#__PURE__*/React.createElement("span", {
    className: item === mode ? "is-active" : "",
    key: item,
    style: {
      "--mode-progress": `${modeProgress[item]}%`
    }
  }, /*#__PURE__*/React.createElement("i", null)))), /*#__PURE__*/React.createElement("main", {
    className: "player-stage"
  }, mode === "listen" && /*#__PURE__*/React.createElement(ListenMode, {
    activeCue: activeCue,
    course: course,
    setActiveCue: setActiveCue,
    setShowTranslation: setShowTranslation,
    showTranslation: showTranslation
  }), mode === "read" && /*#__PURE__*/React.createElement(ReadMode, {
    activeCue: activeCue,
    course: course,
    setActiveCue: setActiveCue,
    setShowTranslation: setShowTranslation,
    showTranslation: showTranslation
  }), mode === "write" && /*#__PURE__*/React.createElement(WriteMode, {
    activeCue: activeCue,
    answer: answer,
    course: course,
    feedback: feedback,
    onReplay: () => setPlaying(value => !value),
    onSubmit: () => {
      if (feedback === "correct") {
        setFeedback("");
        setAnswer("");
        setActiveCue(value => Math.min(course.cues.length - 1, value + 1));
      } else {
        submitDictation();
      }
    },
    playing: playing,
    setActiveCue: setActiveCue,
    setAnswer: value => {
      setAnswer(value);
      if (feedback) setFeedback("");
    }
  }), mode === "speak" && /*#__PURE__*/React.createElement(SpeakMode, {
    activeCue: activeCue,
    course: course,
    onRecord: toggleRecording,
    recorded: recorded,
    recording: recording,
    seconds: recordSeconds,
    setActiveCue: value => {
      setActiveCue(value);
      setRecorded(false);
      setRecordSeconds(0);
    }
  })), (mode === "listen" || mode === "read") && /*#__PURE__*/React.createElement("div", {
    className: "player-control-layer " + (controlsVisible ? "is-visible" : "")
  }, /*#__PURE__*/React.createElement(AudioDeck, {
    onForward: (steps = 1) => setActiveCue(value => Math.min(course.cues.length - 1, value + steps)),
    onPlay: () => setPlaying(value => !value),
    onReplay: (steps = 0) => setActiveCue(value => Math.max(0, value - Math.abs(steps || 1))),
    onSpeed: cycleSpeed,
    playing: playing,
    progress: playbackProgress,
    speed: speed
  })), /*#__PURE__*/React.createElement("div", {
    className: "player-complete-row"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", null, modeCopy[mode].label, "\u73AF\u8282"), /*#__PURE__*/React.createElement("small", null, Math.round(modeProgress[mode]), "%")), /*#__PURE__*/React.createElement(Button, {
    disabled: !canConfirm,
    onClick: () => setConfirmed(value => ({
      ...value,
      [mode]: true
    })),
    size: "sm",
    variant: confirmed[mode] ? "secondary" : "accent"
  }, confirmed[mode] ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 16
  }), " \u5DF2\u5B8C\u6210") : "完成本环节")), /*#__PURE__*/React.createElement("div", {
    className: "player-mode-dock"
  }, /*#__PURE__*/React.createElement(ModeSwitcher, {
    iconOnly: true,
    onChange: nextMode => {
      setMode(nextMode);
      setControlsVisible(false);
    },
    value: mode
  })), /*#__PURE__*/React.createElement("div", {
    className: "swipe-guide",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevrons-up",
    size: 17
  }), /*#__PURE__*/React.createElement("span", null, "\u4E0A\u6ED1\u4E0B\u4E00\u8BFE")));
}
window.SaylinePlayer = {
  PlayerScreen
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/learner/player.jsx", error: String((e && e.message) || e) }); }

// ui_kits/learner/screens.jsx
try { (() => {
const {
  SaylineWordmark,
  CoverArt,
  WeekChart,
  MonthHeatmap
} = window.SaylineShared;
const {
  Badge,
  BottomNav,
  Button,
  CategoryCard,
  Checkbox,
  CourseCard,
  Icon,
  IconButton,
  Input,
  ProgressBar,
  StatTile,
  Tabs
} = window.SaylineDesignSystem_1a4fd3;
function LoginScreen({
  onLogin
}) {
  const [showPassword, setShowPassword] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    className: "app-screen login-screen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "login-ambient",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("span", {
    className: "login-ambient__one"
  }), /*#__PURE__*/React.createElement("span", {
    className: "login-ambient__two"
  }), /*#__PURE__*/React.createElement("span", {
    className: "login-ambient__line"
  })), /*#__PURE__*/React.createElement("header", {
    className: "login-header"
  }, /*#__PURE__*/React.createElement(SaylineWordmark, {
    light: true
  }), /*#__PURE__*/React.createElement(Badge, {
    className: "login-version"
  }, "\u6210\u4EBA\u82F1\u8BED \xB7 \u58F0\u97F3\u8BFE\u7A0B")), /*#__PURE__*/React.createElement("div", {
    className: "login-copy"
  }, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "ONE LINE AT A TIME"), /*#__PURE__*/React.createElement("h1", null, "\u628A\u82F1\u8BED\uFF0C", /*#__PURE__*/React.createElement("br", null), "\u542C\u6210\u81EA\u5DF1\u7684\u8BED\u8A00\u3002"), /*#__PURE__*/React.createElement("p", null, "\u9010\u53E5\u542C\u3001\u8BFB\u3001\u5199\u3001\u8BF4\u3002\u4ECA\u5929\u53EA\u5B66\u4E00\u53E5\uFF0C\u4E5F\u7B97\u5411\u524D\u3002")), /*#__PURE__*/React.createElement("form", {
    className: "login-panel",
    onSubmit: event => {
      event.preventDefault();
      onLogin();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "login-panel__head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "WELCOME BACK"), /*#__PURE__*/React.createElement("h2", null, "\u7EE7\u7EED\u4F60\u7684\u5B66\u4E60")), /*#__PURE__*/React.createElement("span", {
    className: "login-panel__day"
  }, "DAY 06")), /*#__PURE__*/React.createElement(Input, {
    autoComplete: "tel",
    defaultValue: "13800138000",
    id: "login-phone",
    inputMode: "tel",
    label: "\u624B\u673A\u53F7",
    placeholder: "\u8BF7\u8F93\u5165\u624B\u673A\u53F7"
  }), /*#__PURE__*/React.createElement("div", {
    className: "password-field"
  }, /*#__PURE__*/React.createElement(Input, {
    autoComplete: "current-password",
    defaultValue: "sayline2026",
    id: "login-password",
    label: "\u5BC6\u7801",
    placeholder: "\u8BF7\u8F93\u5165\u5BC6\u7801",
    type: showPassword ? "text" : "password"
  }), /*#__PURE__*/React.createElement("button", {
    "aria-label": showPassword ? "隐藏密码" : "显示密码",
    className: "password-field__toggle",
    onClick: () => setShowPassword(value => !value),
    type: "button"
  }, showPassword ? "隐藏" : "显示")), /*#__PURE__*/React.createElement("div", {
    className: "login-panel__options"
  }, /*#__PURE__*/React.createElement(Checkbox, {
    defaultChecked: true,
    id: "remember-login"
  }, "\u4FDD\u6301\u767B\u5F55"), /*#__PURE__*/React.createElement("button", {
    className: "text-link",
    type: "button"
  }, "\u5FD8\u8BB0\u5BC6\u7801\uFF1F")), /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    size: "lg",
    type: "submit"
  }, "\u8FDB\u5165 Sayline"), /*#__PURE__*/React.createElement("button", {
    className: "login-register",
    type: "button"
  }, "\u8FD8\u6CA1\u6709\u8D26\u53F7\uFF1F", /*#__PURE__*/React.createElement("span", null, "\u521B\u5EFA\u4E00\u4E2A"))), /*#__PURE__*/React.createElement("p", {
    className: "login-footnote"
  }, "\u7EE7\u7EED\u5B66\u4E60\u5373\u8868\u793A\u4F60\u540C\u610F\u7528\u6237\u534F\u8BAE\u4E0E\u9690\u79C1\u653F\u7B56"));
}
function ContinueCard({
  course,
  onOpen
}) {
  return /*#__PURE__*/React.createElement("button", {
    className: "continue-card",
    onClick: onOpen,
    type: "button"
  }, /*#__PURE__*/React.createElement(CoverArt, {
    className: "continue-card__cover",
    course: course
  }), /*#__PURE__*/React.createElement("div", {
    className: "continue-card__body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "continue-card__head"
  }, /*#__PURE__*/React.createElement("span", null, "\u7EE7\u7EED\u4E0A\u6B21\u5B66\u4E60"), /*#__PURE__*/React.createElement("span", null, course.duration)), /*#__PURE__*/React.createElement("h2", null, course.title), /*#__PURE__*/React.createElement("p", null, course.titleZh, " \xB7 ", course.categoryLabel), /*#__PURE__*/React.createElement(ProgressBar, {
    className: "continue-card__progress",
    tone: "light",
    value: course.progress
  }), /*#__PURE__*/React.createElement("span", {
    className: "continue-card__play"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "play",
    size: 18
  }))));
}
function HomeScreen({
  courses,
  categories,
  category,
  onCategory,
  onOpenCourse,
  onToggleFavorite,
  onNavigate
}) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const categoryCourses = category === "favorite" ? courses.filter(course => course.favorite) : courses.filter(course => course.category === category);
  const continueCourse = courses.find(course => course.progress > 0) || courses[0];
  const tabItems = [...categories.map(item => ({
    value: item.value,
    label: item.label
  })), {
    value: "favorite",
    label: "我喜欢"
  }];
  const currentCategory = categories.find(item => item.value === category);
  const normalizedQuery = searchTerm.trim().toLowerCase();
  const searchPool = courses.filter(course => categories.some(item => item.value === course.category));
  const searchResults = normalizedQuery ? searchPool.filter(course => [course.title, course.titleZh, course.categoryLabel].join(" ").toLowerCase().includes(normalizedQuery)) : [];
  const visibleCourses = searchOpen ? searchResults : categoryCourses;
  const showFeed = !searchOpen || normalizedQuery;
  return /*#__PURE__*/React.createElement("div", {
    className: "app-screen home-screen"
  }, /*#__PURE__*/React.createElement("header", {
    className: "home-header"
  }, /*#__PURE__*/React.createElement("span", {
    className: "home-header__label"
  }, "\u8BFE\u7A0B"), /*#__PURE__*/React.createElement(IconButton, {
    "aria-expanded": searchOpen,
    label: searchOpen ? "关闭搜索" : "搜索课程",
    onClick: () => {
      setSearchOpen(value => !value);
      setSearchTerm("");
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: searchOpen ? "x" : "search",
    size: 21
  }))), searchOpen ? /*#__PURE__*/React.createElement("label", {
    className: "course-search"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 19
  }), /*#__PURE__*/React.createElement("input", {
    autoFocus: true,
    onChange: event => setSearchTerm(event.target.value),
    placeholder: "\u641C\u7D22\u8BFE\u7A0B\u6216\u5206\u7C7B",
    type: "search",
    value: searchTerm
  }), /*#__PURE__*/React.createElement("span", null, normalizedQuery ? `${searchResults.length} 个结果` : "输入关键词")) : /*#__PURE__*/React.createElement(Tabs, {
    ariaLabel: "\u8BFE\u7A0B\u5206\u7C7B",
    className: "home-tabs",
    items: tabItems,
    onChange: onCategory,
    value: category
  }), /*#__PURE__*/React.createElement("div", {
    className: "home-scroll"
  }, !searchOpen && category !== "favorite" && /*#__PURE__*/React.createElement("section", {
    className: "home-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-heading"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "PICK UP WHERE YOU LEFT OFF"), /*#__PURE__*/React.createElement("button", {
    className: "text-link",
    onClick: () => onOpenCourse(continueCourse),
    type: "button"
  }, "\u67E5\u770B\u64AD\u653E\u5668")), /*#__PURE__*/React.createElement(ContinueCard, {
    course: continueCourse,
    onOpen: () => onOpenCourse(continueCourse)
  })), /*#__PURE__*/React.createElement("section", {
    className: "home-section home-section--courses"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-heading"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, searchOpen ? "SEARCH RESULTS" : category === "favorite" ? "YOUR SAVED LINES" : "COURSE SHELF"), /*#__PURE__*/React.createElement("h2", null, searchOpen ? "搜索结果" : category === "favorite" ? "我喜欢" : "为你准备")), /*#__PURE__*/React.createElement("span", {
    className: "section-count"
  }, searchOpen ? visibleCourses.length : categoryCourses.length, " \u95E8")), searchOpen && !normalizedQuery ? /*#__PURE__*/React.createElement("div", {
    className: "search-idle"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 23
  })), /*#__PURE__*/React.createElement("h3", null, "\u641C\u7D22\u4F60\u60F3\u5B66\u7684\u8BFE\u7A0B"), /*#__PURE__*/React.createElement("p", null, "\u53EF\u4EE5\u8F93\u5165\u8BFE\u7A0B\u540D\u3001\u4E2D\u6587\u6807\u9898\u6216\u5206\u7C7B\u540D\u79F0\u3002")) : showFeed && visibleCourses.length > 0 ? /*#__PURE__*/React.createElement("div", {
    className: "course-feed"
  }, !searchOpen && currentCategory && /*#__PURE__*/React.createElement(CategoryCard, {
    colorA: currentCategory.colorA,
    colorB: currentCategory.colorB,
    courseCount: visibleCourses.length,
    coverUrl: currentCategory.coverUrl,
    description: currentCategory.description,
    title: currentCategory.fullLabel
  }), visibleCourses.map(course => /*#__PURE__*/React.createElement(CourseCard, {
    colorA: course.colorA,
    colorB: course.colorB,
    duration: course.duration,
    favorite: course.favorite,
    key: course.id,
    meta: course.categoryLabel,
    onOpen: () => onOpenCourse(course),
    onToggleFavorite: () => onToggleFavorite(course.id),
    progress: course.progress || undefined,
    title: course.title,
    variant: "feed"
  }))) : searchOpen ? /*#__PURE__*/React.createElement("div", {
    className: "search-empty"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 22
  })), /*#__PURE__*/React.createElement("h3", null, "\u6CA1\u6709\u627E\u5230\u76F8\u5173\u8BFE\u7A0B"), /*#__PURE__*/React.createElement("p", null, "\u6362\u4E00\u4E2A\u5173\u952E\u8BCD\u8BD5\u8BD5\uFF0C\u6216\u5173\u95ED\u641C\u7D22\u8FD4\u56DE\u5206\u7C7B\u3002")) : /*#__PURE__*/React.createElement("div", {
    className: "favorite-empty"
  }, /*#__PURE__*/React.createElement("span", {
    className: "favorite-empty__icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "heart",
    size: 24
  })), /*#__PURE__*/React.createElement("h3", null, "\u8FD8\u6CA1\u6709\u6536\u85CF\u8BFE\u7A0B"), /*#__PURE__*/React.createElement("p", null, "\u5728\u8BFE\u7A0B\u5217\u8868\u70B9\u4EAE\u7231\u5FC3\uFF0C\u559C\u6B22\u7684\u5185\u5BB9\u4F1A\u7559\u5728\u8FD9\u91CC\u3002"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    onClick: () => onCategory(categories[0]?.value || "favorite")
  }, "\u53BB\u53D1\u73B0\u8BFE\u7A0B")))), /*#__PURE__*/React.createElement("div", {
    className: "app-bottom-nav"
  }, /*#__PURE__*/React.createElement(BottomNav, {
    value: "home",
    onChange: onNavigate
  })));
}
function MyScreen({
  period,
  setPeriod,
  onNavigate,
  onOpenPreferences,
  interests,
  defaultTab
}) {
  const report = window.SaylineData.stats[period];
  const profile = window.SaylineData.profile;
  const defaultLabel = defaultTab === "favorite" ? "我喜欢" : window.SaylineData.categories.find(item => item.value === defaultTab)?.fullLabel;
  return /*#__PURE__*/React.createElement("div", {
    className: "app-screen me-screen"
  }, /*#__PURE__*/React.createElement("header", {
    className: "me-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "MY SPACE"), /*#__PURE__*/React.createElement("h1", null, "\u6211\u7684")), /*#__PURE__*/React.createElement(IconButton, {
    label: "\u5B66\u4E60\u504F\u597D",
    onClick: onOpenPreferences,
    variant: "outline"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "settings-2",
    size: 20
  }))), /*#__PURE__*/React.createElement("div", {
    className: "me-scroll"
  }, /*#__PURE__*/React.createElement("section", {
    className: "profile-card"
  }, /*#__PURE__*/React.createElement("span", {
    className: "profile-card__avatar"
  }, profile.nickname.slice(0, 1)), /*#__PURE__*/React.createElement("div", {
    className: "profile-card__copy"
  }, /*#__PURE__*/React.createElement("span", null, "PERSONAL PROFILE"), /*#__PURE__*/React.createElement("h2", null, profile.nickname), /*#__PURE__*/React.createElement("p", null, profile.phone)), /*#__PURE__*/React.createElement("span", {
    className: "profile-card__joined"
  }, profile.joinedAt)), /*#__PURE__*/React.createElement("button", {
    className: "preference-entry",
    onClick: onOpenPreferences,
    type: "button"
  }, /*#__PURE__*/React.createElement("span", {
    className: "preference-entry__icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "settings-2",
    size: 18
  })), /*#__PURE__*/React.createElement("span", {
    className: "preference-entry__copy"
  }, /*#__PURE__*/React.createElement("strong", null, "\u5B66\u4E60\u504F\u597D"), /*#__PURE__*/React.createElement("small", null, interests.length, " \u4E2A\u5174\u8DA3\u5206\u7C7B \xB7 \u9ED8\u8BA4\uFF1A", defaultLabel || "职场英语")), /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 18
  })), /*#__PURE__*/React.createElement("div", {
    className: "report-title"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "LEARNING REPORT"), /*#__PURE__*/React.createElement("h2", null, "\u5B66\u4E60\u7EDF\u8BA1")), /*#__PURE__*/React.createElement("span", null, report.studiedDays, " \u5929\u6709\u5B66\u4E60")), /*#__PURE__*/React.createElement("div", {
    className: "period-switch"
  }, /*#__PURE__*/React.createElement(Tabs, {
    items: [{
      value: "week",
      label: "本周"
    }, {
      value: "month",
      label: "本月"
    }],
    onChange: setPeriod,
    value: period,
    variant: "pill"
  })), /*#__PURE__*/React.createElement("section", {
    className: "report-summary"
  }, /*#__PURE__*/React.createElement(StatTile, {
    value: report.studiedDays,
    label: "\u5B66\u4E60\u5929\u6570"
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: report.sessions,
    label: "\u5B66\u4E60\u6B21\u6570"
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: report.duration,
    label: "\u5B66\u4E60\u65F6\u957F"
  })), /*#__PURE__*/React.createElement("section", {
    className: "report-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "report-card__head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, period === "week" ? "THIS WEEK" : "THIS MONTH"), /*#__PURE__*/React.createElement("h2", null, period === "week" ? "本周学习节奏" : "十月学习记录")), /*#__PURE__*/React.createElement(Badge, {
    tone: "success"
  }, "\u6709\u5B66\u4E60")), period === "week" ? /*#__PURE__*/React.createElement(WeekChart, {
    days: report.days
  }) : /*#__PURE__*/React.createElement(MonthHeatmap, {
    values: report.values
  }), /*#__PURE__*/React.createElement("div", {
    className: "report-card__legend"
  }, period === "month" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", null, "\u5C11"), /*#__PURE__*/React.createElement("i", {
    className: "legend-0"
  }), /*#__PURE__*/React.createElement("i", {
    className: "legend-1"
  }), /*#__PURE__*/React.createElement("i", {
    className: "legend-2"
  }), /*#__PURE__*/React.createElement("i", {
    className: "legend-3"
  }), /*#__PURE__*/React.createElement("span", null, "\u591A")) : /*#__PURE__*/React.createElement("span", null, period === "week" ? "10 月 19 日 — 10 月 25 日" : "按当天学习时长计算"))), /*#__PURE__*/React.createElement("section", {
    className: "skill-summary"
  }, /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement("span", {
    className: "skill-summary__icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "pen-line",
    size: 19
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, report.accuracy, "%"), /*#__PURE__*/React.createElement("span", null, "\u542C\u5199\u6B63\u786E\u7387")), /*#__PURE__*/React.createElement("p", null, "\u6BD4\u4E0A", period === "week" ? "周" : "月", " +4%")), /*#__PURE__*/React.createElement("article", null, /*#__PURE__*/React.createElement("span", {
    className: "skill-summary__icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "mic",
    size: 19
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, report.speakingCount), /*#__PURE__*/React.createElement("span", null, "\u8DDF\u8BFB\u6B21\u6570")), /*#__PURE__*/React.createElement("p", null, "\u6BCF\u6B21\u81F3\u5C11 1 \u79D2"))), /*#__PURE__*/React.createElement("section", {
    className: "recent-learning"
  }, /*#__PURE__*/React.createElement("div", {
    className: "section-heading"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "RECENT"), /*#__PURE__*/React.createElement("h2", null, "\u6700\u8FD1\u5B66\u4E60")), /*#__PURE__*/React.createElement("button", {
    className: "text-link",
    onClick: () => onNavigate("home"),
    type: "button"
  }, "\u5168\u90E8\u8BFE\u7A0B")), window.SaylineData.courses.filter(course => course.progress > 0).slice(0, 2).map(course => /*#__PURE__*/React.createElement("div", {
    className: "recent-row",
    key: course.id
  }, /*#__PURE__*/React.createElement(CoverArt, {
    className: "recent-row__cover",
    course: course
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", null, course.title), /*#__PURE__*/React.createElement("span", null, course.titleZh, " \xB7 ", course.progress, "%")))))), /*#__PURE__*/React.createElement("div", {
    className: "app-bottom-nav"
  }, /*#__PURE__*/React.createElement(BottomNav, {
    value: "me",
    onChange: onNavigate
  })));
}
function InterestOnboardingScreen({
  onComplete
}) {
  const [selected, setSelected] = React.useState([]);
  const catalog = window.SaylineData.categories;
  function toggleCategory(value) {
    setSelected(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value]);
  }
  const firstCategory = catalog.find(item => item.value === selected[0]);
  return /*#__PURE__*/React.createElement("div", {
    className: "app-screen onboarding-screen"
  }, /*#__PURE__*/React.createElement("header", {
    className: "onboarding-header"
  }, /*#__PURE__*/React.createElement(SaylineWordmark, {
    compact: true
  }), /*#__PURE__*/React.createElement("span", null, "01 / 01")), /*#__PURE__*/React.createElement("div", {
    className: "onboarding-copy"
  }, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "MAKE IT YOURS"), /*#__PURE__*/React.createElement("h1", null, "\u9009\u62E9\u4F60\u611F\u5174\u8DA3\u7684", /*#__PURE__*/React.createElement("br", null), "\u9886\u57DF\u3002"), /*#__PURE__*/React.createElement("p", null, "\u9996\u9875\u53EA\u5C55\u793A\u4F60\u9009\u62E9\u7684\u5206\u7C7B\u3002\u7B2C\u4E00\u4E2A\u9009\u62E9\u4F1A\u6210\u4E3A\u9ED8\u8BA4 Tab\uFF0C\u4E4B\u540E\u53EF\u4EE5\u968F\u65F6\u8C03\u6574\u3002")), /*#__PURE__*/React.createElement("div", {
    className: "interest-grid"
  }, catalog.map((item, index) => {
    const selectionIndex = selected.indexOf(item.value);
    const isSelected = selectionIndex >= 0;
    return /*#__PURE__*/React.createElement("button", {
      "aria-pressed": isSelected,
      className: "interest-option " + (isSelected ? "is-selected" : ""),
      key: item.value,
      onClick: () => toggleCategory(item.value),
      style: {
        "--category-a": item.colorA,
        "--category-b": item.colorB
      },
      type: "button"
    }, /*#__PURE__*/React.createElement("span", {
      className: "interest-option__number"
    }, String(index + 1).padStart(2, "0")), /*#__PURE__*/React.createElement("span", {
      className: "interest-option__icon"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: item.icon,
      size: 22
    })), /*#__PURE__*/React.createElement("span", {
      className: "interest-option__copy"
    }, /*#__PURE__*/React.createElement("strong", null, item.fullLabel), /*#__PURE__*/React.createElement("small", null, item.description)), /*#__PURE__*/React.createElement("span", {
      className: "interest-option__check"
    }, isSelected ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 15
    }), selectionIndex + 1) : "+"));
  })), /*#__PURE__*/React.createElement("div", {
    className: "onboarding-foot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "onboarding-selection"
  }, /*#__PURE__*/React.createElement("span", null, selected.length ? `${selected.length} 个已选` : "至少选择 1 个"), /*#__PURE__*/React.createElement("strong", null, firstCategory ? `默认：${firstCategory.fullLabel}` : "选择顺序决定首页顺序")), /*#__PURE__*/React.createElement(Button, {
    disabled: !selected.length,
    fullWidth: true,
    onClick: () => selected.length && onComplete(selected),
    size: "lg"
  }, "\u5B8C\u6210\uFF0C\u5F00\u59CB\u5B66\u4E60")));
}
function PreferencesScreen({
  interests,
  defaultTab,
  onBack,
  onSave
}) {
  const [ordered, setOrdered] = React.useState(interests);
  const [selectedDefault, setSelectedDefault] = React.useState(defaultTab);
  const [draggedIndex, setDraggedIndex] = React.useState(null);
  const catalog = window.SaylineData.categories;
  const selectedCategories = ordered.map(value => catalog.find(item => item.value === value)).filter(Boolean);
  const availableCategories = catalog.filter(item => !ordered.includes(item.value));
  function moveInterest(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];
    setOrdered(next);
  }
  function removeInterest(value) {
    if (ordered.length === 1) return;
    const next = ordered.filter(item => item !== value);
    setOrdered(next);
    if (selectedDefault === value) setSelectedDefault(next[0]);
  }
  function addInterest(value) {
    setOrdered(current => [...current, value]);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "app-screen preferences-screen"
  }, /*#__PURE__*/React.createElement("header", {
    className: "preferences-header"
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "\u8FD4\u56DE\u6211\u7684\u5B66\u4E60",
    onClick: onBack
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-left",
    size: 23
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "SETTINGS"), /*#__PURE__*/React.createElement("h1", null, "\u5B66\u4E60\u504F\u597D")), /*#__PURE__*/React.createElement("span", {
    className: "preferences-header__count"
  }, ordered.length + 1, " TABS")), /*#__PURE__*/React.createElement("div", {
    className: "preferences-scroll"
  }, /*#__PURE__*/React.createElement("section", {
    className: "preferences-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "preferences-section__head"
  }, /*#__PURE__*/React.createElement("h2", null, "\u9996\u9875\u5206\u7C7B"), /*#__PURE__*/React.createElement("span", null, "\u62D6\u52A8\u6216\u4F7F\u7528\u7BAD\u5934\u6392\u5E8F")), /*#__PURE__*/React.createElement("p", {
    className: "preferences-help"
  }, "\u70B9\u51FB\u201C\u8BBE\u4E3A\u9ED8\u8BA4\u201D\uFF0C\u767B\u5F55\u540E\u4F1A\u76F4\u63A5\u8FDB\u5165\u8BE5 Tab\u3002"), /*#__PURE__*/React.createElement("div", {
    className: "preference-list"
  }, selectedCategories.map((item, index) => /*#__PURE__*/React.createElement("div", {
    className: "preference-row",
    draggable: true,
    key: item.value,
    onDragOver: event => event.preventDefault(),
    onDragStart: () => setDraggedIndex(index),
    onDrop: () => {
      if (draggedIndex == null || draggedIndex === index) return;
      const next = [...ordered];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(index, 0, moved);
      setOrdered(next);
      setDraggedIndex(null);
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "preference-row__grip",
    "aria-hidden": "true"
  }, "\u22EE\u22EE"), /*#__PURE__*/React.createElement("span", {
    className: "preference-row__icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: item.icon,
    size: 19
  })), /*#__PURE__*/React.createElement("div", {
    className: "preference-row__copy"
  }, /*#__PURE__*/React.createElement("strong", null, item.fullLabel), /*#__PURE__*/React.createElement("small", null, selectedDefault === item.value ? "登录后默认进入" : item.description)), /*#__PURE__*/React.createElement("div", {
    className: "preference-row__actions"
  }, /*#__PURE__*/React.createElement(IconButton, {
    disabled: index === 0,
    label: `上移 ${item.fullLabel}`,
    onClick: () => moveInterest(index, -1)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevrons-up",
    size: 17
  })), /*#__PURE__*/React.createElement(IconButton, {
    disabled: index === ordered.length - 1,
    label: `下移 ${item.fullLabel}`,
    onClick: () => moveInterest(index, 1)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevrons-down",
    size: 17
  })), /*#__PURE__*/React.createElement(IconButton, {
    disabled: ordered.length === 1,
    label: `移除 ${item.fullLabel}`,
    onClick: () => removeInterest(item.value)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 17
  }))), /*#__PURE__*/React.createElement("button", {
    "aria-pressed": selectedDefault === item.value,
    className: "default-choice " + (selectedDefault === item.value ? "is-default" : ""),
    onClick: () => setSelectedDefault(item.value),
    type: "button"
  }, selectedDefault === item.value ? "默认 Tab" : "设为默认"))), /*#__PURE__*/React.createElement("div", {
    className: "preference-row preference-row--fixed"
  }, /*#__PURE__*/React.createElement("span", {
    className: "preference-row__grip",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("span", {
    className: "preference-row__icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "heart",
    size: 19
  })), /*#__PURE__*/React.createElement("div", {
    className: "preference-row__copy"
  }, /*#__PURE__*/React.createElement("strong", null, "\u6211\u559C\u6B22"), /*#__PURE__*/React.createElement("small", null, "\u56FA\u5B9A\u663E\u793A\u5728\u6700\u540E\u4E00\u4E2A Tab")), /*#__PURE__*/React.createElement("button", {
    "aria-pressed": selectedDefault === "favorite",
    className: "default-choice " + (selectedDefault === "favorite" ? "is-default" : ""),
    onClick: () => setSelectedDefault("favorite"),
    type: "button"
  }, selectedDefault === "favorite" ? "默认 Tab" : "设为默认")))), /*#__PURE__*/React.createElement("section", {
    className: "preferences-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "preferences-section__head"
  }, /*#__PURE__*/React.createElement("h2", null, "\u6DFB\u52A0\u5174\u8DA3"), /*#__PURE__*/React.createElement("span", null, availableCategories.length ? "点击添加" : "已添加全部")), /*#__PURE__*/React.createElement("div", {
    className: "interest-pool"
  }, availableCategories.length ? availableCategories.map(item => /*#__PURE__*/React.createElement("button", {
    key: item.value,
    onClick: () => addInterest(item.value),
    type: "button"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 15
  }), item.fullLabel)) : /*#__PURE__*/React.createElement("p", null, "\u5F53\u524D\u6240\u6709\u8BFE\u7A0B\u5206\u7C7B\u90FD\u5DF2\u7ECF\u52A0\u5165\u9996\u9875\u3002")))), /*#__PURE__*/React.createElement("div", {
    className: "preferences-footer"
  }, /*#__PURE__*/React.createElement("p", null, "\u4FEE\u6539\u4F1A\u7ACB\u5373\u5E94\u7528\u5230\u9996\u9875 Tab\uFF0C\u5E76\u540C\u6B65\u5230\u5176\u4ED6\u8BBE\u5907\u3002"), /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    onClick: () => onSave(ordered, selectedDefault),
    size: "lg"
  }, "\u4FDD\u5B58\u504F\u597D")));
}
Object.assign(window, {
  LoginScreen,
  HomeScreen,
  MyScreen,
  InterestOnboardingScreen,
  PreferencesScreen,
  ContinueCard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/learner/screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/learner/shared.jsx
try { (() => {
const SaylineWordmark = ({
  light = false,
  compact = false
}) => /*#__PURE__*/React.createElement("div", {
  className: "sayline-lockup " + (light ? "is-light" : "") + (compact ? " is-compact" : "")
}, /*#__PURE__*/React.createElement("img", {
  alt: "",
  className: "sayline-lockup__mark",
  src: light ? "../../assets/brand/sayline-mark-cream.svg" : "../../assets/brand/sayline-mark.svg"
}), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
  className: "sayline-lockup__word"
}, "Sayline"), /*#__PURE__*/React.createElement("div", {
  className: "sayline-lockup__cn"
}, "\u9010 \u53E5 \u82F1 \u8BED")));
const CoverArt = ({
  course,
  className = ""
}) => /*#__PURE__*/React.createElement("div", {
  "aria-hidden": "true",
  className: "cover-art " + className,
  style: {
    "--cover-a": course.colorA,
    "--cover-b": course.colorB
  }
}, /*#__PURE__*/React.createElement("span", {
  className: "cover-art__line"
}));
const WeekChart = ({
  days
}) => {
  const maxValue = Math.max(...days.map(day => day.minutes), 1);
  return /*#__PURE__*/React.createElement("div", {
    className: "week-chart",
    "aria-label": "\u672C\u5468\u5B66\u4E60\u65F6\u957F"
  }, days.map((day, index) => {
    const height = day.minutes ? Math.max(14, day.minutes / maxValue * 100) : 3;
    return /*#__PURE__*/React.createElement("div", {
      className: "week-day " + (index === 2 ? "is-today" : ""),
      key: day.label
    }, /*#__PURE__*/React.createElement("div", {
      className: "week-day__track"
    }, /*#__PURE__*/React.createElement("span", {
      className: "week-day__bar " + (day.minutes ? "has-study" : ""),
      style: {
        height: `${height}%`
      }
    })), /*#__PURE__*/React.createElement("span", null, day.label));
  }));
};
const MonthHeatmap = ({
  values
}) => {
  const weekdays = ["一", "二", "三", "四", "五", "六", "日"];
  return /*#__PURE__*/React.createElement("div", {
    className: "month-heatmap"
  }, weekdays.map(day => /*#__PURE__*/React.createElement("span", {
    className: "month-weekday",
    key: day
  }, day)), [0, 1, 2].map(offset => /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    className: "month-day is-empty",
    key: `empty-${offset}`
  })), Array.from({
    length: 31
  }, (_, index) => {
    const day = index + 1;
    const minutes = values[day] || 0;
    const level = minutes === 0 ? 0 : minutes < 20 ? 1 : minutes < 50 ? 2 : 3;
    return /*#__PURE__*/React.createElement("span", {
      "aria-label": `${day} 日，学习 ${minutes} 分钟`,
      className: `month-day level-${level} ${day === 21 ? "is-today" : ""}`,
      key: day
    }, day);
  }));
};
const ReviewRail = ({
  screen,
  onNavigate
}) => {
  const screens = [["login", "01 / 登录"], ["interests", "02 / 兴趣选择"], ["home", "03 / 首页"], ["player", "04 / 播放器"], ["me", "05 / 我的学习"], ["preferences", "06 / 学习偏好"]];
  return /*#__PURE__*/React.createElement("aside", {
    className: "review-rail"
  }, /*#__PURE__*/React.createElement(SaylineWordmark, null), /*#__PURE__*/React.createElement("p", {
    className: "review-rail__eyebrow"
  }, "Learner UI \xB7 Interactive review"), /*#__PURE__*/React.createElement("h1", null, "\u4E00\u53E5\u4E00\u53E5\uFF0C", /*#__PURE__*/React.createElement("br", null), "\u542C\u89C1\u81EA\u5DF1\u3002"), /*#__PURE__*/React.createElement("div", {
    className: "review-rail__links"
  }, screens.map(([value, label]) => /*#__PURE__*/React.createElement("button", {
    className: screen === value ? "is-active" : "",
    key: value,
    onClick: () => onNavigate(value),
    type: "button"
  }, /*#__PURE__*/React.createElement("span", null, label), /*#__PURE__*/React.createElement("i", null)))), /*#__PURE__*/React.createElement("p", {
    className: "review-rail__note"
  }, "\u53EF\u76F4\u63A5\u70B9\u51FB\u5206\u7C7B\u3001\u8BFE\u7A0B\u3001\u5B66\u4E60\u6A21\u5F0F\u548C\u5E95\u90E8\u5BFC\u822A\u3002\u64AD\u653E\u5668\u652F\u6301\u952E\u76D8\u65B9\u5411\u952E\u5207\u6362\u8BFE\u7A0B\u3002"));
};
window.SaylineShared = {
  SaylineWordmark,
  CoverArt,
  WeekChart,
  MonthHeatmap,
  ReviewRail
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/learner/shared.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.CategoryCard = __ds_scope.CategoryCard;

__ds_ns.CourseCard = __ds_scope.CourseCard;

__ds_ns.ModeSwitcher = __ds_scope.ModeSwitcher;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.StatTile = __ds_scope.StatTile;

__ds_ns.BottomNav = __ds_scope.BottomNav;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
