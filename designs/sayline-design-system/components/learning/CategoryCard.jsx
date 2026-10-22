import React from "react";

export function CategoryCard({
  title,
  description,
  courseCount,
  coverUrl,
  colorA = "#68745a",
  colorB = "#273023",
  className = "",
}) {
  const style = {
    "--category-card-a": colorA,
    "--category-card-b": colorB,
  };

  return (
    <figure
      aria-label={`${title}，${courseCount} 门课程`}
      className={["sl-category-card", className].filter(Boolean).join(" ")}
      style={style}
    >
      <div
        aria-hidden="true"
        className="sl-category-card__image"
        style={coverUrl ? { backgroundImage: `url("${coverUrl}")` } : undefined}
      />
      <div className="sl-category-card__shade" aria-hidden="true" />
      <div className="sl-category-card__top">
        <span>{courseCount} 门课程</span>
      </div>
      <figcaption className="sl-category-card__copy">
        <h2>{title}</h2>
        <span>{description}</span>
        <i aria-hidden="true" />
      </figcaption>
    </figure>
  );
}
