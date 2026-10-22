import React from "react";
import { Icon } from "../core/Icon.jsx";
import { ProgressBar } from "./ProgressBar.jsx";

export function CourseCard({
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
  className = "",
}) {
  const style = {
    "--card-color-a": colorA,
    "--card-color-b": colorB,
  };

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen?.();
    }
  }

  const rootProps = {
    "aria-label": `学习 ${title}`,
    className: [
      "sl-course-card",
      variant === "feed" ? "sl-course-card--feed" : "",
      className,
    ]
      .filter(Boolean)
      .join(" "),
    onClick: onOpen,
    onKeyDown: handleKeyDown,
    role: "button",
    style,
    tabIndex: 0,
  };

  if (variant === "feed") {
    return (
      <div {...rootProps}>
        <div className="sl-course-card__feed-cover-wrap">
          <div
            aria-hidden="true"
            className="sl-course-card__feed-cover"
            style={coverUrl ? { backgroundImage: `url("${coverUrl}")` } : undefined}
          />
          {duration && <span className="sl-course-card__duration">{duration}</span>}
          <button
            aria-label={favorite ? "取消收藏" : "收藏课程"}
            aria-pressed={favorite}
            className="sl-course-card__favorite sl-course-card__favorite--feed"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite?.();
            }}
            type="button"
          >
            <Icon name="heart" size={18} />
          </button>
        </div>
        <div className="sl-course-card__feed-body">
          <h3 className="sl-course-card__title">{title}</h3>
          <p className="sl-course-card__meta">{meta}</p>
          {typeof progress === "number" && (
            <ProgressBar className="sl-course-card__progress" value={progress} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      {...rootProps}
    >
      <div
        aria-hidden="true"
        className="sl-course-card__cover"
        style={coverUrl ? { backgroundImage: `url("${coverUrl}")` } : undefined}
      />
      <div className="sl-course-card__body">
        <div className="sl-course-card__top">
          <h3 className="sl-course-card__title">{title}</h3>
          <button
            aria-label={favorite ? "取消收藏" : "收藏课程"}
            aria-pressed={favorite}
            className="sl-course-card__favorite"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite?.();
            }}
            type="button"
          >
            <Icon name="heart" size={19} />
          </button>
        </div>
        <p className="sl-course-card__meta">{meta}</p>
        {typeof progress === "number" && (
          <ProgressBar className="sl-course-card__progress" tone="moss" value={progress} />
        )}
      </div>
    </div>
  );
}
