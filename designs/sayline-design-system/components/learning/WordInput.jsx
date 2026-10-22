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
  onComplete,
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

    if (event.key === "Enter") {
      event.currentTarget.blur();
    }
  }

  return (
    <div
      aria-label={label}
      className={["sl-word-input", className].filter(Boolean).join(" ")}
      onBlur={(event) => {
        const group = event.currentTarget;
        window.setTimeout(() => {
          if (!group.contains(document.activeElement)) onComplete?.();
        }, 0);
      }}
      role="group"
    >
      {words.map((word, index) => {
        const punctuation = trailingPunctuation(word);
        const letterCount = Math.max(1, countLetters(word));
        const typed = currentValues[index] || "";
        const expectedLetters = word.replace(/[^A-Za-z']/g, "");

        return (
          <label className="sl-word-input__word" key={`${word}-${index}`}>
            <span
              className="sl-word-input__cell"
              style={{ "--letters": letterCount }}
            >
              <span aria-hidden="true" className="sl-word-input__mirror">
                {Array.from(typed).map((letter, letterIndex) => (
                  <span
                    className={
                      letter.toLowerCase() === expectedLetters[letterIndex]?.toLowerCase()
                        ? "is-correct"
                        : "is-wrong"
                    }
                    key={letterIndex}
                  >
                    {letter}
                  </span>
                ))}
              </span>
              <input
                aria-label={`第 ${index + 1} 个单词，共 ${words.length} 个`}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                disabled={disabled}
                maxLength={letterCount}
                onChange={(event) => updateWord(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                ref={(element) => { inputsRef.current[index] = element; }}
                spellCheck="false"
                type="text"
                value={typed}
              />
            </span>
            {punctuation && <span aria-hidden="true" className="sl-word-input__punctuation">{punctuation}</span>}
          </label>
        );
      })}
    </div>
  );
}
