const { CoverArt } = window.SaylineShared;
const {
  Badge,
  Button,
  Icon,
  IconButton,
  ModeSwitcher,
  ProgressBar,
  WordInput,
} = window.SaylineDesignSystem_1a4fd3;

const modeCopy = {
  listen: { label: "听", title: "听见每一句的节奏", eyebrow: "LISTEN" },
  read: { label: "读", title: "看懂句子之间的关系", eyebrow: "READ" },
  write: { label: "写", title: "把听见的写下来", eyebrow: "WRITE" },
  speak: { label: "说", title: "让这一句从你口中经过", eyebrow: "SPEAK" },
};

function formatAudioTime(seconds) {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, "0")}`;
}

function ListenMode({ course, activeCue, setActiveCue, showTranslation, setShowTranslation }) {
  const lyricsRef = React.useRef(null);
  const activeLineRef = React.useRef(null);

  React.useEffect(() => {
    const container = lyricsRef.current;
    const activeLine = activeLineRef.current;
    if (!container || !activeLine) return;

    container.scrollTop = Math.max(
      0,
      activeLine.offsetTop - container.clientHeight * 0.27,
    );
  }, [activeCue, course.id, showTranslation]);

  return (
    <div className="listen-mode">
      <div className="lyrics-window" ref={lyricsRef}>
        {course.cues.map((cue, index) => {
          const distance = Math.abs(index - activeCue);
          return (
            <button
              className={
                "lyric-line " +
                (index === activeCue ? "is-active " : "") +
                (distance > 1 ? "is-far" : "")
              }
              key={cue.id}
              onClick={() => setActiveCue(index)}
              ref={index === activeCue ? activeLineRef : undefined}
              type="button"
            >
              <span className="lyric-line__en" lang="en">{cue.en}</span>
              {showTranslation && <span className="lyric-line__zh" lang="zh">{cue.zh}</span>}
            </button>
          );
        })}
      </div>
      <div className="lyric-tools">
        <button className="translation-toggle" onClick={() => setShowTranslation((value) => !value)} type="button">
          <Icon name="captions" size={17} />
          {showTranslation ? "隐藏中文" : "显示中文"}
        </button>
        <span>点击句子可从这里播放</span>
      </div>
    </div>
  );
}

function ReadMode({ course, activeCue, setActiveCue, showTranslation, setShowTranslation }) {
  return (
    <div className="read-mode">
      <div className="read-mode__head">
        <div>
          <span className="eyebrow">BILINGUAL TRANSCRIPT</span>
          <h2>逐句原文</h2>
        </div>
        <button className="translation-toggle" onClick={() => setShowTranslation((value) => !value)} type="button">
          {showTranslation ? "隐藏中文" : "显示中文"}
        </button>
      </div>
      <div className="transcript-list">
        {course.cues.map((cue, index) => (
          <button
            className={"transcript-row " + (index === activeCue ? "is-active" : "")}
            key={cue.id}
            onClick={() => setActiveCue(index)}
            type="button"
          >
            <span className="transcript-row__index">{String(index + 1).padStart(2, "0")}</span>
            <span className="transcript-row__copy">
              <strong lang="en">{cue.en}</strong>
              {showTranslation && <span lang="zh">{cue.zh}</span>}
            </span>
            <Icon name="play" size={16} />
          </button>
        ))}
      </div>
    </div>
  );
}

function WriteMode({
  course,
  activeCue,
  setActiveCue,
  wordAnswers,
  setWordAnswers,
  setFeedback,
  showTranslation,
  onToggleTranslation,
  feedback,
  onAutoSubmit,
  onNext,
  onReplay,
  playing,
}) {
  const cue = course.cues[activeCue];
  const transcriptRef = React.useRef(null);
  const currentRef = React.useRef(null);

  React.useEffect(() => {
    const container = transcriptRef.current;
    const currentBlock = currentRef.current;
    if (!container || !currentBlock) return;
    container.scrollTop = Math.max(
      0,
      currentBlock.offsetTop - container.clientHeight * 0.16,
    );
  }, [activeCue, course.id, showTranslation]);

  return (
    <div className="write-mode">
      <div className="mode-copy">
        <div>
          <span className="eyebrow">DICTATION · {activeCue + 1}/{course.cues.length}</span>
          <h2>{modeCopy.write.title}</h2>
        </div>
        <Badge>第 {activeCue + 1} / {course.cues.length} 句</Badge>
      </div>

      <div className="write-transcript" ref={transcriptRef}>
        {course.cues.map((item, index) => {
          if (index !== activeCue) {
            return (
              <div
                className={"write-context-row " + (index < activeCue ? "is-before" : "is-after")}
                key={item.id}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <p lang="en">{item.en}</p>
                  {showTranslation && <small lang="zh">{item.zh}</small>}
                </div>
              </div>
            );
          }

          return (
            <section className="write-current" key={item.id} ref={currentRef}>
              <div className="write-current__head">
                <span className="write-current__label">当前句 · {String(index + 1).padStart(2, "0")}</span>
                <div className="write-current__actions">
                  <button aria-label={playing ? "暂停当前句" : "播放当前句"} onClick={onReplay} type="button">
                    <Icon name={playing ? "pause" : "play"} size={17} />
                    <span>{playing ? "暂停" : "听原句"}</span>
                  </button>
                  <button
                    aria-pressed={showTranslation}
                    className={showTranslation ? "is-active" : ""}
                    onClick={onToggleTranslation}
                    type="button"
                  >
                    <Icon name="captions" size={17} />
                    <span>中文</span>
                  </button>
                </div>
              </div>
              <p className={"write-current__translation " + (showTranslation ? "" : "is-hidden")}>
                {showTranslation ? cue.zh : "中文翻译已隐藏"}
              </p>

              <div className="word-input-card">
                <div className="word-input-card__head">
                  <span>逐词填写</span>
                  <small>离开输入区自动提交</small>
                </div>
                <WordInput
                  onChange={(value) => {
                    setWordAnswers(value);
                    if (feedback) setFeedback("");
                  }}
                  onComplete={onAutoSubmit}
                  value={wordAnswers}
                  words={cue.en.split(/\s+/)}
                />
              </div>

              {feedback === "wrong" && (
                <div className="dictation-feedback is-wrong">
                  <div><Icon name="x" size={16} /><strong>还差一点</strong></div>
                  <p>再听一次，注意 “meeting” 和 “Friday”。</p>
                </div>
              )}
              {feedback === "correct" && (
                <div className="dictation-feedback is-correct">
                  <div><Icon name="circle-check" size={16} /><strong>写对了</strong></div>
                  <p>{cue.en}</p>
                </div>
              )}

              <div className="mode-actions write-current__actions-bottom">
                {feedback === "correct" && (
                  <button className="next-sentence-link" onClick={onNext} type="button">
                    继续下一句 <Icon name="chevron-right" size={17} />
                  </button>
                )}
                <button className="skip-link" onClick={() => { setWordAnswers([]); setActiveCue((value) => Math.min(course.cues.length - 1, value + 1)); }} type="button">
                  暂时跳过这一句
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function SpeakMode({ course, activeCue, setActiveCue, recording, recorded, seconds, onRecord }) {
  const cue = course.cues[activeCue];

  return (
    <div className="speak-mode">
      <div className="mode-copy">
        <div>
          <span className="eyebrow">SHADOWING · {activeCue + 1}/{course.cues.length}</span>
          <h2>{modeCopy.speak.title}</h2>
        </div>
        <Badge tone={recorded ? "success" : "neutral"}>{recorded ? "已录制" : "未录音"}</Badge>
      </div>

      <div className="speak-quote">
        <span lang="en">{cue.en}</span>
        <small lang="zh">{cue.zh}</small>
      </div>

      <div className="record-stage">
        <div className={"record-wave " + (recording ? "is-live" : "")} aria-hidden="true">
          {[18, 29, 42, 34, 52, 28, 44, 23, 35, 20].map((height, index) => (
            <i key={index} style={{ height }}></i>
          ))}
        </div>
        <button
          aria-label={recording ? "停止录音" : "开始录音"}
          className={"record-button " + (recording ? "is-recording" : "")}
          onClick={onRecord}
          type="button"
        >
          <Icon name={recording ? "square" : "mic"} size={26} />
        </button>
        <p>{recording ? `正在录音 · ${seconds.toFixed(1)}s` : recorded ? "可以回听刚才的跟读" : "点击后跟读当前句"}</p>
      </div>

      <div className="voice-compare">
        <button disabled={!recorded} type="button"><Icon name="play" size={16} /><span>原句</span><small>{cue.end}</small></button>
        <button disabled={!recorded} type="button"><Icon name="play" size={16} /><span>我的录音</span><small>{recorded ? `${Math.max(1, Math.round(seconds))}s` : "--"}</small></button>
      </div>

      <div className="mode-actions mode-actions--row">
        <Button variant="secondary" disabled={!recorded} onClick={() => setActiveCue((value) => Math.max(0, value - 1))}>上一句</Button>
        <Button disabled={!recorded} onClick={() => { setActiveCue((value) => Math.min(course.cues.length - 1, value + 1)); }}>下一句</Button>
      </div>
    </div>
  );
}

function AudioDeck({ playing, onPlay, onReplay, onForward, speed, onSpeed, progress }) {
  return (
    <div className="audio-deck">
      <div className="audio-deck__times">
        <span>{formatAudioTime((progress / 100) * 268)}</span>
        <button onClick={onSpeed} type="button">{speed.toFixed(2).replace(/0$/, "")}×</button>
        <span>4:28</span>
      </div>
      <div className="audio-deck__track">
        <span style={{ width: `${progress}%` }}></span>
        <i style={{ left: `${progress}%` }}></i>
      </div>
      <div className="audio-deck__controls">
        <IconButton className="transport-round" label="后退 15 秒" onClick={onReplay}>
          <Icon name="rotate-ccw" size={28} strokeWidth={2.2} />
          <span>15</span>
        </IconButton>
        <IconButton className="transport-skip" label="上一句" onClick={() => onReplay(-1)}>
          <Icon name="skip-back" size={27} strokeWidth={2} />
        </IconButton>
        <button aria-label={playing ? "暂停" : "播放"} className="audio-play" onClick={onPlay} type="button">
          <Icon name={playing ? "pause" : "play"} size={28} strokeWidth={1.5} />
        </button>
        <IconButton className="transport-skip" label="下一句" onClick={() => onForward(1)}>
          <Icon name="skip-forward" size={27} strokeWidth={2} />
        </IconButton>
        <IconButton className="transport-round" label="前进 15 秒" onClick={() => onForward()}>
          <Icon name="rotate-cw" size={28} strokeWidth={2.2} />
          <span>15</span>
        </IconButton>
      </div>
    </div>
  );
}

function PlayerScreen({
  course,
  initialMode = "listen",
  onClose,
  onToggleFavorite,
  onMoveCourse,
}) {
  const validInitialMode = ["listen", "read", "write", "speak"].includes(initialMode)
    ? initialMode
    : "listen";
  const initialParams = new URLSearchParams(window.location.search);
  const requestedControls = initialParams.get("controls");
  const [mode, setMode] = React.useState(validInitialMode);
  const [controlsVisible, setControlsVisible] = React.useState(requestedControls !== "0");
  const [controlsActivity, setControlsActivity] = React.useState(0);
  const [activeCue, setActiveCue] = React.useState(2);
  const [showTranslation, setShowTranslation] = React.useState(true);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const [wordAnswers, setWordAnswers] = React.useState([]);
  const [feedback, setFeedback] = React.useState("");
  const [recording, setRecording] = React.useState(false);
  const [recorded, setRecorded] = React.useState(false);
  const [recordSeconds, setRecordSeconds] = React.useState(0);
  const [modeProgress, setModeProgress] = React.useState({
    listen: 100,
    read: 61,
    write: 40,
    speak: 20,
  });
  const [confirmed, setConfirmed] = React.useState({ listen: false, read: false, write: false, speak: false });
  const swipeStart = React.useRef(null);
  const swipeWasTriggered = React.useRef(false);

  React.useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setModeProgress((value) => ({
        ...value,
        listen: Math.min(100, value.listen + 0.2),
      }));
    }, 700);
    return () => window.clearInterval(timer);
  }, [playing]);

  React.useEffect(() => {
    if (!recording) return undefined;
    const timer = window.setInterval(() => setRecordSeconds((value) => value + 0.1), 100);
    return () => window.clearInterval(timer);
  }, [recording]);

  React.useEffect(() => {
    setWordAnswers([]);
    setFeedback("");
  }, [activeCue, course.id]);

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

  React.useEffect(() => {
    if (!["listen", "read"].includes(mode) || !controlsVisible) return undefined;
    const timer = window.setTimeout(() => setControlsVisible(false), 6000);
    return () => window.clearTimeout(timer);
  }, [mode, controlsVisible, controlsActivity]);

  const current = course.cues[Math.min(activeCue, course.cues.length - 1)];
  const playbackProgress = Math.max(8, ((activeCue + 1) / course.cues.length) * 100);
  const modeLabels = ["listen", "read", "write", "speak"];
  const canConfirm = modeProgress[mode] >= 100;

  function cycleSpeed() {
    const speeds = [1, 1.25, 0.75];
    setSpeed(speeds[(speeds.indexOf(speed) + 1) % speeds.length]);
  }

  function submitDictation() {
    const normalize = (text) => text.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
    const correct = normalize(wordAnswers.join(" ")) === normalize(current.en);
    setFeedback(correct ? "correct" : "wrong");
    if (correct) {
      setModeProgress((value) => ({ ...value, write: Math.min(100, value.write + 20) }));
    }
  }

  function toggleRecording() {
    if (recording) {
      setRecording(false);
      if (recordSeconds >= 1) {
        setRecorded(true);
        setModeProgress((value) => ({ ...value, speak: Math.min(100, value.speak + 25) }));
      }
      return;
    }
    setRecorded(false);
    setRecordSeconds(0);
    setRecording(true);
  }

  function handlePointerDown(event) {
    if (
      event.target.closest("input, textarea, .audio-deck, .sl-mode-switch, .player-header, .player-identity, .player-complete-row, .mode-actions, .record-button, .write-transcript")
    ) return;
    swipeStart.current = { x: event.clientX, y: event.clientY };
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
    setControlsActivity((value) => value + 1);
    if (
      event.target.closest(
        "input, textarea, .audio-deck, .sl-mode-switch, .player-header, .player-identity, .player-complete-row, .translation-toggle",
      )
    ) return;

    if (event.target.closest(".lyric-line, .transcript-row")) {
      setControlsVisible(true);
      return;
    }

    setControlsVisible((visible) => !visible);
  }

  return (
    <div
      className={`app-screen player-screen player-mode-${mode}`}
      onClickCapture={(event) => {
        if (!swipeWasTriggered.current) return;
        event.preventDefault();
        event.stopPropagation();
        swipeWasTriggered.current = false;
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={handlePlayerClick}
      style={{
        "--course-a": course.colorA,
        "--course-b": course.colorB,
      }}
    >
      <div className="player-atmosphere" aria-hidden="true"></div>
      <div className="player-overlay" aria-hidden="true"></div>

      <header className="player-header">
        <IconButton label="返回首页" onClick={onClose}>
          <Icon name="chevron-down" size={24} />
        </IconButton>
        <div className="player-header__title">
          <span>NOW LEARNING</span>
          <strong>逐句播放</strong>
        </div>
        <IconButton
          active={course.favorite}
          label={course.favorite ? "取消收藏" : "收藏课程"}
          onClick={onToggleFavorite}
        >
          <Icon name="heart" size={21} />
        </IconButton>
      </header>

      <section className="player-identity">
        <CoverArt className="player-identity__cover" course={course} />
        <div>
          <div className="player-identity__meta">
            <span>{course.categoryLabel}</span>
            <span>{course.duration}</span>
          </div>
          <h1>{course.title}</h1>
          <p>{course.titleZh}</p>
        </div>
        <button aria-label="更多课程操作" className="player-more" type="button">
          <Icon name="ellipsis" size={20} />
        </button>
      </section>

      <div className="mode-progress-strip" aria-hidden="true">
        {modeLabels.map((item) => (
          <span
            className={item === mode ? "is-active" : ""}
            key={item}
            style={{ "--mode-progress": `${modeProgress[item]}%` }}
          >
            <i></i>
          </span>
        ))}
      </div>

      <main className="player-stage">
        {mode === "listen" && (
          <ListenMode
            activeCue={activeCue}
            course={course}
            setActiveCue={setActiveCue}
            setShowTranslation={setShowTranslation}
            showTranslation={showTranslation}
          />
        )}
        {mode === "read" && (
          <ReadMode
            activeCue={activeCue}
            course={course}
            setActiveCue={setActiveCue}
            setShowTranslation={setShowTranslation}
            showTranslation={showTranslation}
          />
        )}
        {mode === "write" && (
          <WriteMode
            activeCue={activeCue}
            course={course}
            feedback={feedback}
            onAutoSubmit={submitDictation}
            onNext={() => {
              setFeedback("");
              setWordAnswers([]);
              setActiveCue((value) => Math.min(course.cues.length - 1, value + 1));
            }}
            onReplay={() => setPlaying((value) => !value)}
            onToggleTranslation={() => setShowTranslation((value) => !value)}
            playing={playing}
            setFeedback={setFeedback}
            setActiveCue={setActiveCue}
            setWordAnswers={setWordAnswers}
            showTranslation={showTranslation}
            wordAnswers={wordAnswers}
          />
        )}
        {mode === "speak" && (
          <SpeakMode
            activeCue={activeCue}
            course={course}
            onRecord={toggleRecording}
            recorded={recorded}
            recording={recording}
            seconds={recordSeconds}
            setActiveCue={(value) => {
              setActiveCue(value);
              setRecorded(false);
              setRecordSeconds(0);
            }}
          />
        )}
      </main>

      <div
        aria-hidden={(["listen", "read"].includes(mode) && !controlsVisible) || undefined}
        className={
          "player-bottom-ui " +
          (["listen", "read"].includes(mode) && !controlsVisible ? "is-hidden" : "")
        }
      >
        {(mode === "listen" || mode === "read") && (
          <div className="player-control-layer">
            <AudioDeck
              onForward={(steps = 1) => setActiveCue((value) => Math.min(course.cues.length - 1, value + steps))}
              onPlay={() => setPlaying((value) => !value)}
              onReplay={(steps = 0) => setActiveCue((value) => Math.max(0, value - Math.abs(steps || 1)))}
              onSpeed={cycleSpeed}
              playing={playing}
              progress={playbackProgress}
              speed={speed}
            />
          </div>
        )}

        <div className="player-complete-row">
          <div>
            <span>{modeCopy[mode].label}环节</span>
            <small>{Math.round(modeProgress[mode])}%</small>
          </div>
          <Button
            disabled={!canConfirm}
            onClick={() => setConfirmed((value) => ({ ...value, [mode]: true }))}
            size="sm"
            variant={confirmed[mode] ? "secondary" : "accent"}
          >
            {confirmed[mode] ? <><Icon name="check" size={16} /> 已完成</> : "完成本环节"}
          </Button>
        </div>

        <div className="player-mode-dock">
          <ModeSwitcher
            iconOnly
            onChange={(nextMode) => {
              setMode(nextMode);
              setControlsVisible(["listen", "read"].includes(nextMode));
            }}
            value={mode}
          />
        </div>
      </div>

      <div className="swipe-guide" aria-hidden="true">
        <Icon name="chevrons-up" size={17} />
        <span>上滑下一课</span>
      </div>
    </div>
  );
}

window.SaylinePlayer = { PlayerScreen };
