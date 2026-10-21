Use in category and favorite lists; clicking the body opens the player immediately while the heart only changes favorite state.

```jsx
<CourseCard title="Meeting a New Colleague" meta="职场英语 · 4 分 28 秒" favorite />
```

Do not add a separate course-detail link.

Use `variant="feed"` in discovery and favorite lists where covers should lead the information hierarchy. Feed cards keep the title, metadata, favorite, and progress inside one rounded container.

```jsx
<CourseCard variant="feed" duration="4:28" title="Meeting a New Colleague" meta="职场英语" />
```
