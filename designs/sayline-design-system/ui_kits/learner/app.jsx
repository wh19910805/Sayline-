const { SaylineWordmark, ReviewRail } = window.SaylineShared;
const { LoginScreen, HomeScreen, MyScreen } = window;
const { PlayerScreen } = window.SaylinePlayer;
const { Toast } = window.SaylineDesignSystem_1a4fd3;

function App() {
  const initialParams = new URLSearchParams(window.location.search);
  const requestedScreen = initialParams.get("screen");
  const initialScreen = ["login", "home", "me", "player"].includes(requestedScreen)
    ? requestedScreen
    : "home";
  const initialCategory = window.SaylineData.categories.some((item) => item.value === initialParams.get("category"))
    ? initialParams.get("category")
    : "all";
  const initialPeriod = initialParams.get("period") === "month" ? "month" : "week";
  const defaultPlayerCourse = window.SaylineData.courses.find((course) => course.progress > 0);

  const [screen, setScreen] = React.useState(initialScreen);
  const [category, setCategory] = React.useState(initialCategory);
  const [period, setPeriod] = React.useState(initialPeriod);
  const [courses, setCourses] = React.useState(window.SaylineData.courses);
  const [playerCourseId, setPlayerCourseId] = React.useState(
    initialScreen === "player" ? defaultPlayerCourse.id : null,
  );
  const [playerListIds, setPlayerListIds] = React.useState(
    initialScreen === "player"
      ? (initialCategory === "all" ? courses : courses.filter((course) => course.category === initialCategory)).map((course) => course.id)
      : [],
  );
  const [toast, setToast] = React.useState("");

  const playerCourse = courses.find((course) => course.id === playerCourseId);

  function listForCategory(value) {
    if (value === "favorite") return courses.filter((course) => course.favorite);
    if (value === "all") return courses;
    return courses.filter((course) => course.category === value);
  }

  function navigate(next) {
    setScreen(next);
  }

  function openCourse(course) {
    const list = listForCategory(category);
    setPlayerListIds(list.map((item) => item.id));
    setPlayerCourseId(course.id);
    setScreen("player");
  }

  function toggleFavorite(courseId) {
    const current = courses.find((course) => course.id === courseId);
    const nowFavorite = !current?.favorite;
    setCourses((items) =>
      items.map((course) =>
        course.id === courseId ? { ...course, favorite: nowFavorite } : course,
      ),
    );
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

  return (
    <div className="review-shell">
      <ReviewRail
        onNavigate={(next) => {
          if (next === "player" && !playerCourseId) {
            setPlayerListIds(listForCategory(category).map((item) => item.id));
            setPlayerCourseId((courses.find((course) => course.progress > 0) || courses[0]).id);
          }
          setScreen(next);
        }}
        screen={screen}
      />

      <div className="device-stage">
        <div className="device-caption">
          <span>{screen === "player" ? "immersive player" : screen === "me" ? "learning report" : screen === "login" ? "account entry" : "course discovery"}</span>
          <span>390 × 844</span>
        </div>
        <div className="phone-device">
          {screen === "login" && <LoginScreen onLogin={() => setScreen("home")} />}
          {screen === "home" && (
            <HomeScreen
              category={category}
              courses={courses}
              onCategory={setCategory}
              onNavigate={navigate}
              onOpenCourse={openCourse}
              onToggleFavorite={toggleFavorite}
            />
          )}
          {screen === "me" && (
            <MyScreen onNavigate={navigate} period={period} setPeriod={setPeriod} />
          )}
          {screen === "player" && playerCourse && (
            <PlayerScreen
              course={playerCourse}
              initialMode={initialParams.get("mode")}
              onClose={() => setScreen("home")}
              onMoveCourse={moveCourse}
              onToggleFavorite={() => toggleFavorite(playerCourse.id)}
            />
          )}
        </div>
        <div className="device-hint">
          <span><i></i> 可交互原型</span>
          <span>播放器：↑ / ↓ 切换课程</span>
        </div>
      </div>

      {toast && (
        <div className="prototype-toast">
          <Toast message={toast} tone={toast.includes("已") ? "success" : "neutral"} />
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
