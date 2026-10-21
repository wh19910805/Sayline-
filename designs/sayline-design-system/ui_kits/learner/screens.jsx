const { SaylineWordmark, CoverArt, WeekChart, MonthHeatmap } = window.SaylineShared;
const {
  Badge,
  BottomNav,
  Button,
  Checkbox,
  CourseCard,
  Icon,
  Input,
  ProgressBar,
  StatTile,
  Tabs,
} = window.SaylineDesignSystem_1a4fd3;

function LoginScreen({ onLogin }) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="app-screen login-screen">
      <div className="login-ambient" aria-hidden="true">
        <span className="login-ambient__one"></span>
        <span className="login-ambient__two"></span>
        <span className="login-ambient__line"></span>
      </div>

      <header className="login-header">
        <SaylineWordmark light />
        <Badge className="login-version">成人英语 · 声音课程</Badge>
      </header>

      <div className="login-copy">
        <p className="eyebrow">ONE LINE AT A TIME</p>
        <h1>把英语，<br />听成自己的语言。</h1>
        <p>逐句听、读、写、说。今天只学一句，也算向前。</p>
      </div>

      <form
        className="login-panel"
        onSubmit={(event) => {
          event.preventDefault();
          onLogin();
        }}
      >
        <div className="login-panel__head">
          <div>
            <p className="eyebrow">WELCOME BACK</p>
            <h2>继续你的学习</h2>
          </div>
          <span className="login-panel__day">DAY 06</span>
        </div>

        <Input
          autoComplete="tel"
          defaultValue="13800138000"
          id="login-phone"
          inputMode="tel"
          label="手机号"
          placeholder="请输入手机号"
        />
        <div className="password-field">
          <Input
            autoComplete="current-password"
            defaultValue="sayline2026"
            id="login-password"
            label="密码"
            placeholder="请输入密码"
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={showPassword ? "隐藏密码" : "显示密码"}
            className="password-field__toggle"
            onClick={() => setShowPassword((value) => !value)}
            type="button"
          >
            {showPassword ? "隐藏" : "显示"}
          </button>
        </div>
        <div className="login-panel__options">
          <Checkbox defaultChecked id="remember-login">保持登录</Checkbox>
          <button className="text-link" type="button">忘记密码？</button>
        </div>
        <Button fullWidth size="lg" type="submit">进入 Sayline</Button>
        <button className="login-register" type="button">还没有账号？<span>创建一个</span></button>
      </form>

      <p className="login-footnote">继续学习即表示你同意用户协议与隐私政策</p>
    </div>
  );
}

function ContinueCard({ course, onOpen }) {
  return (
    <button className="continue-card" onClick={onOpen} type="button">
      <CoverArt className="continue-card__cover" course={course} />
      <div className="continue-card__body">
        <div className="continue-card__head">
          <span>继续上次学习</span>
          <span>{course.duration}</span>
        </div>
        <h2>{course.title}</h2>
        <p>{course.titleZh} · {course.categoryLabel}</p>
        <ProgressBar className="continue-card__progress" tone="light" value={course.progress} />
        <span className="continue-card__play"><Icon name="play" size={18} /></span>
      </div>
    </button>
  );
}

function HomeScreen({
  courses,
  category,
  onCategory,
  onOpenCourse,
  onToggleFavorite,
  onNavigate,
}) {
  const categoryCourses = category === "favorite"
    ? courses.filter((course) => course.favorite)
    : category === "all"
      ? courses
      : courses.filter((course) => course.category === category);
  const continueCourse = courses.find((course) => course.progress > 0) || courses[0];

  return (
    <div className="app-screen home-screen">
      <header className="home-header">
        <span className="home-header__label">课程</span>
      </header>

      <Tabs
        ariaLabel="课程分类"
        className="home-tabs"
        items={window.SaylineData.categories}
        onChange={onCategory}
        value={category}
      />

      <div className="home-scroll">
        {category !== "favorite" && (
          <section className="home-section">
            <div className="section-heading">
              <span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span>
              <button className="text-link" onClick={() => onOpenCourse(continueCourse)} type="button">查看播放器</button>
            </div>
            <ContinueCard course={continueCourse} onOpen={() => onOpenCourse(continueCourse)} />
          </section>
        )}

        <section className="home-section home-section--courses">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{category === "favorite" ? "YOUR SAVED LINES" : "COURSE SHELF"}</p>
              <h2>{category === "favorite" ? "我喜欢" : "为你准备"}</h2>
            </div>
            <span className="section-count">{categoryCourses.length} 门</span>
          </div>

          {categoryCourses.length > 0 ? (
            <div className="course-feed">
              {categoryCourses.map((course) => (
                <CourseCard
                  colorA={course.colorA}
                  colorB={course.colorB}
                  duration={course.duration}
                  favorite={course.favorite}
                  key={course.id}
                  meta={course.categoryLabel}
                  onOpen={() => onOpenCourse(course)}
                  onToggleFavorite={() => onToggleFavorite(course.id)}
                  progress={course.progress || undefined}
                  title={course.title}
                  variant="feed"
                />
              ))}
            </div>
          ) : (
            <div className="favorite-empty">
              <span className="favorite-empty__icon"><Icon name="heart" size={24} /></span>
              <h3>还没有收藏课程</h3>
              <p>在课程列表点亮爱心，喜欢的内容会留在这里。</p>
              <Button variant="secondary" onClick={() => onCategory("all")}>去发现课程</Button>
            </div>
          )}
        </section>
      </div>

      <div className="app-bottom-nav">
        <BottomNav value="home" onChange={onNavigate} />
      </div>
    </div>
  );
}

function MyScreen({ period, setPeriod, onNavigate }) {
  const report = window.SaylineData.stats[period];

  return (
    <div className="app-screen me-screen">
      <header className="me-header">
        <div>
          <p className="eyebrow">LEARNING REPORT</p>
          <h1>我的学习</h1>
        </div>
        <button className="profile-button" onClick={() => onNavigate("home")} type="button">
          <span>禾</span>
          <i></i>
        </button>
      </header>

      <div className="me-scroll">
        <div className="period-switch">
          <Tabs
            items={[{ value: "week", label: "本周" }, { value: "month", label: "本月" }]}
            onChange={setPeriod}
            value={period}
            variant="pill"
          />
        </div>

        <section className="report-summary">
          <StatTile value={report.studiedDays} label="学习天数" />
          <StatTile value={report.sessions} label="学习次数" />
          <StatTile value={report.duration} label="学习时长" />
        </section>

        <section className="report-card">
          <div className="report-card__head">
            <div>
              <p className="eyebrow">{period === "week" ? "THIS WEEK" : "THIS MONTH"}</p>
              <h2>{period === "week" ? "本周学习节奏" : "十月学习记录"}</h2>
            </div>
            <Badge tone="success">有学习</Badge>
          </div>
          {period === "week" ? <WeekChart days={report.days} /> : <MonthHeatmap values={report.values} />}
          <div className="report-card__legend">
            {period === "month" ? (
              <>
                <span>少</span><i className="legend-0"></i><i className="legend-1"></i><i className="legend-2"></i><i className="legend-3"></i><span>多</span>
              </>
            ) : (
              <span>{period === "week" ? "10 月 19 日 — 10 月 25 日" : "按当天学习时长计算"}</span>
            )}
          </div>
        </section>

        <section className="skill-summary">
          <article>
            <span className="skill-summary__icon"><Icon name="pen-line" size={19} /></span>
            <div>
              <strong>{report.accuracy}%</strong>
              <span>听写正确率</span>
            </div>
            <p>比上{period === "week" ? "周" : "月"} +4%</p>
          </article>
          <article>
            <span className="skill-summary__icon"><Icon name="mic" size={19} /></span>
            <div>
              <strong>{report.speakingCount}</strong>
              <span>跟读次数</span>
            </div>
            <p>每次至少 1 秒</p>
          </article>
        </section>

        <section className="recent-learning">
          <div className="section-heading">
            <div>
              <p className="eyebrow">RECENT</p>
              <h2>最近学习</h2>
            </div>
            <button className="text-link" onClick={() => onNavigate("home")} type="button">全部课程</button>
          </div>
          {window.SaylineData.courses.filter((course) => course.progress > 0).slice(0, 2).map((course) => (
            <div className="recent-row" key={course.id}>
              <CoverArt className="recent-row__cover" course={course} />
              <div>
                <strong>{course.title}</strong>
                <span>{course.titleZh} · {course.progress}%</span>
              </div>
            </div>
          ))}
        </section>
      </div>

      <div className="app-bottom-nav">
        <BottomNav value="me" onChange={onNavigate} />
      </div>
    </div>
  );
}

Object.assign(window, {
  LoginScreen,
  HomeScreen,
  MyScreen,
  ContinueCard,
});
