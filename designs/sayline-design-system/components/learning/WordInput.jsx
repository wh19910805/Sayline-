import React from "react";

function countLetters(word) {
  return word.replace(/[^A-Za-z']/g, "").length;
}

function trailingPunctuation(word) {
  return word.match(/[^A-Za-z']+$/)?.[0] || "";
}

export function WordInput({
  words,
  value = [],
  onChange,
  disabled = false,
  label = "逐词填写",
  className = "",
}) {
  const inputsRef = React.useRef([]);
  const currentValues = Array.isArray(value) ? value : [];

  function updateWord(index, nextValue) {
    const next = [...currentValues];
    next[index] = nextValue;
    onChange?.(next);
  }

  function handleKeyDown(event, index) {
    if (event.key === " " && !event.shiftKey) {
      event.preventDefault();
      inputsRef.current[index + 1]?.focus();
      return;
    }

    if (event.key === "Backspace" && !event.currentTarget.value) {
      event.preventDefault();
      inputsRef.current[index - 1]?.focus();
    }
  }

  return (
    <div
      aria-label={label}
      className={["sl-word-input", className].filter(Boolean).join(" ")}
      role="group"
    >
      {words.map((word, index) => {
        const punctuation = trailingPunctuation(word);
        const letterCount = Math.max(1, countLetters(word));

        return (
          <label className="sl-word-input__word" key={`${word}-${index}`}>
            <input
              aria-label={`第 ${index + 1} 个单词，共 ${words.length} 个`}
              autoCapitalize="none"
              autoComplete="off"
              disabled={disabled}
              onChange={(event) => updateWord(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              ref={(element) => { inputsRef.current[index] = element; }}
              spellCheck="false"
              style={{ "--letters": letterCount }}
              type="text"
              value={currentValues[index] || ""}
            />
            {punctuation && <span aria-hidden="true">{punctuation}</span>}
          </label>
        );
      })}
    </div>
  );
}
