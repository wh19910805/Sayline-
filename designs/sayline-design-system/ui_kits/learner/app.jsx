const { SaylineWordmark, ReviewRail } = window.SaylineShared;
const {
  LoginScreen,
  HomeScreen,
  MyScreen,
  InterestOnboardingScreen,
  SettingsScreen,
  PreferencesScreen,
} = window;
const { PlayerScreen } = window.SaylinePlayer;
const { Toast } = window.SaylineDesignSystem_1a4fd3;

function App() {
  const initialParams = new URLSearchParams(window.location.search);
  const requestedScreen = initialParams.get("screen");
  const initialScreen = ["login", "interests", "home", "me", "player", "settings", "preferences"].includes(requestedScreen)
    ? requestedScreen
    : "home";
  const initialInterests = window.SaylineData.defaultInterests;
  const requestedCategory = initialParams.get("category");
  const initialCategory = requestedCategory === "favorite" || initialInterests.includes(requestedCategory)
    ? requestedCategory
    : initialInterests[0];
  const initialPeriod = initialParams.get("period") === "month" ? "month" : "week";
  const defaultPlayerCourse = window.SaylineData.courses.find((course) => course.progress > 0);

  const [screen, setScreen] = React.useState(initialScreen);
  const [category, setCategory] = React.useState(initialCategory);
  const [interests, setInterests] = React.useState(initialInterests);
  const [defaultTab, setDefaultTab] = React.useState(initialInterests[0]);
  const [profile, setProfile] = React.useState(window.SaylineData.profile);
  const [learningSettings, setLearningSettings] = React.useState(window.SaylineData.learningSettings);
  const [period, setPeriod] = React.useState(initialPeriod);
  const [preferencesReturnTo, setPreferencesReturnTo] = React.useState("me");
  const [courses, setCourses] = React.useState(window.SaylineData.courses);
  const [playerCourseId, setPlayerCourseId] = React.useState(
    initialScreen === "player" ? defaultPlayerCourse.id : null,
  );
  const [playerListIds, setPlayerListIds] = React.useState(
    initialScreen === "player"
      ? (initialCategory === "favorite"
        ? courses.filter((course) => course.favorite)
        : courses.filter((course) => course.category === initialCategory)).map((course) => course.id)
      : [],
  );
  const [toast, setToast] = React.useState("");

  const playerCourse = courses.find((course) => course.id === playerCourseId);
  const homeCategories = interests
    .map((value) => window.SaylineData.categories.find((item) => item.value === value))
    .filter(Boolean);

  function listForCategory(value) {
    if (value === "favorite") return courses.filter((course) => course.favorite);
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
          <span>
            {screen === "player"
              ? "immersive player"
              : screen === "me"
                ? "learning report"
                : screen === "login"
                  ? "account entry"
                  : screen === "interests"
                    ? "interest setup"
                    : screen === "settings"
                      ? "profile and learning settings"
                    : screen === "preferences"
                      ? "learning preferences"
                      : "course discovery"}
          </span>
          <span>390 × 844</span>
        </div>
        <div className="phone-device">
          {screen === "login" && <LoginScreen onLogin={() => setScreen("interests")} />}
          {screen === "interests" && (
            <InterestOnboardingScreen
              onComplete={(selected) => {
                setInterests(selected);
                setDefaultTab(selected[0]);
                setCategory(selected[0]);
                setScreen("home");
              }}
            />
          )}
          {screen === "home" && (
            <HomeScreen
              category={category}
              categories={homeCategories}
              courses={courses}
              onCategory={setCategory}
              onNavigate={navigate}
              onOpenCourse={openCourse}
              onToggleFavorite={toggleFavorite}
            />
          )}
          {screen === "me" && (
            <MyScreen
              defaultTab={defaultTab}
              interests={interests}
              learningSettings={learningSettings}
              onNavigate={navigate}
              onOpenPreferences={() => {
                setPreferencesReturnTo("me");
                setScreen("preferences");
              }}
              onOpenSettings={() => setScreen("settings")}
              period={period}
              profile={profile}
              setPeriod={setPeriod}
            />
          )}
          {screen === "settings" && (
            <SettingsScreen
              learningSettings={learningSettings}
              onBack={() => setScreen("me")}
              onOpenPreferences={() => {
                setPreferencesReturnTo("settings");
                setScreen("preferences");
              }}
              onSave={(nextProfile, nextSettings) => {
                setProfile({
                  ...nextProfile,
                  phoneMasked: nextProfile.phone.length > 7
                    ? `${nextProfile.phone.slice(0, 3)}****${nextProfile.phone.slice(-4)}`
                    : nextProfile.phone,
                });
                setLearningSettings(nextSettings);
                setScreen("me");
                setToast("设置已保存");
                window.setTimeout(() => setToast(""), 2200);
              }}
              profile={profile}
            />
          )}
          {screen === "preferences" && (
            <PreferencesScreen
              defaultTab={defaultTab}
              interests={interests}
              onBack={() => setScreen(preferencesReturnTo)}
              onSave={(nextInterests, nextDefault) => {
                setInterests(nextInterests);
                setDefaultTab(nextDefault);
                setCategory(nextDefault);
                setScreen("home");
                setToast("学习偏好已保存");
                window.setTimeout(() => setToast(""), 2200);
              }}
            />
          )}
          {screen === "player" && playerCourse && (
            <PlayerScreen
              course={playerCourse}
              initialMode={initialParams.get("mode")}
              learningSettings={learningSettings}
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
