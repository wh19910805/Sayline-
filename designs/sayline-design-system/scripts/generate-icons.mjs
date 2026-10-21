import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const iconDir = path.join(root, "assets", "icons");
const output = path.join(root, "components", "core", "Icon.jsx");

const names = fs
  .readdirSync(iconDir)
  .filter((name) => name.endsWith(".svg"))
  .sort();

const markup = Object.fromEntries(
  names.map((fileName) => {
    const source = fs.readFileSync(path.join(iconDir, fileName), "utf8");
    const inner = source
      .replace(/^[\s\S]*?<svg[^>]*>/, "")
      .replace(/<\/svg>\s*$/, "")
      .replace(/\r?\n\s*/g, " ")
      .trim();
    return [fileName.replace(/\.svg$/, ""), inner];
  }),
);

const outputSource = `import React from "react";

const iconMarkup = ${JSON.stringify(markup, null, 2)};

export function Icon({
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

  return (
    <svg
      aria-hidden={label ? undefined : "true"}
      aria-label={label}
      className={"sl-icon " + className}
      fill="none"
      height={size}
      role={label ? "img" : undefined}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
      {...rest}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
`;

fs.writeFileSync(output, outputSource, "utf8");
console.log(`Generated ${names.length} icons at ${output}`);
