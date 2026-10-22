Use for listening dictation where answer lengths are shown as word-level underlines. Keep the current answer hidden and place this input beneath the target sentence context.

```jsx
<WordInput words={["Could", "we", "move", "the", "meeting?"]} value={values} onChange={setValues} />
```

Each underline width is derived from the letters in that word; mobile keyboards can advance with Space. Typed letters compare against the expected letters and turn green when correct or red when wrong. Focus leaving the group should call `onComplete` for automatic submission.
