const { SaylineWordmark, CoverArt, WeekChart, MonthHeatmap } = window.SaylineShared;
const {
  Badge,
  BottomNav,
  Button,
  CategoryCard,
  Checkbox,
  CourseCard,
  Icon,
  IconButton,
  Input,
  ProgressBar,
  StatTile,
  Switch,
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
  categories,
  category,
  onCategory,
  onOpenCourse,
  onToggleFavorite,
  onNavigate,
}) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const categoryCourses = category === "favorite"
    ? courses.filter((course) => course.favorite)
    : courses.filter((course) => course.category === category);
  const continueCourse = courses.find((course) => course.progress > 0) || courses[0];
  const tabItems = [
    ...categories.map((item) => ({ value: item.value, label: item.label })),
    { value: "favorite", label: "我喜欢" },
  ];
  const currentCategory = categories.find((item) => item.value === category);
  const normalizedQuery = searchTerm.trim().toLowerCase();
  const searchPool = courses.filter((course) =>
    categories.some((item) => item.value === course.category),
  );
  const searchResults = normalizedQuery
    ? searchPool.filter((course) =>
        [course.title, course.titleZh, course.categoryLabel]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : [];
  const visibleCourses = searchOpen ? searchResults : categoryCourses;
  const showFeed = !searchOpen || normalizedQuery;

  return (
    <div className="app-screen home-screen">
      <header className="home-header">
        <span className="home-header__label">课程</span>
        <IconButton
          aria-expanded={searchOpen}
          label={searchOpen ? "关闭搜索" : "搜索课程"}
          onClick={() => {
            setSearchOpen((value) => !value);
            setSearchTerm("");
          }}
        >
          <Icon name={searchOpen ? "x" : "search"} size={21} />
        </IconButton>
      </header>

      {searchOpen ? (
        <label className="course-search">
          <Icon name="search" size={19} />
          <input
            autoFocus
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="搜索课程或分类"
            type="search"
            value={searchTerm}
          />
          <span>{normalizedQuery ? `${searchResults.length} 个结果` : "输入关键词"}</span>
        </label>
      ) : (
        <Tabs
          ariaLabel="课程分类"
          className="home-tabs"
          items={tabItems}
          onChange={onCategory}
          value={category}
        />
      )}

      <div className="home-scroll">
        {!searchOpen && category !== "favorite" && (
          <section className="home-section home-section--continue">
            <ContinueCard course={continueCourse} onOpen={() => onOpenCourse(continueCourse)} />
          </section>
        )}

        <section className="home-section home-section--courses">
          <div className="section-heading">
            <h2>
              {searchOpen ? "搜索结果" : category === "favorite" ? "我喜欢" : "为你准备"}
            </h2>
            <span className="section-count">{searchOpen ? visibleCourses.length : categoryCourses.length} 门</span>
          </div>

          {searchOpen && !normalizedQuery ? (
            <div className="search-idle">
              <span><Icon name="search" size={23} /></span>
              <h3>搜索你想学的课程</h3>
              <p>可以输入课程名、中文标题或分类名称。</p>
            </div>
          ) : showFeed && visibleCourses.length > 0 ? (
            <div className="course-feed">
              {!searchOpen && currentCategory && (
                <CategoryCard
                  colorA={currentCategory.colorA}
                  colorB={currentCategory.colorB}
                  courseCount={visibleCourses.length}
                  coverUrl={currentCategory.coverUrl}
                  description={currentCategory.description}
                  title={currentCategory.fullLabel}
                />
              )}
              {visibleCourses.map((course) => (
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
          ) : searchOpen ? (
            <div className="search-empty">
              <span><Icon name="search" size={22} /></span>
              <h3>没有找到相关课程</h3>
              <p>换一个关键词试试，或关闭搜索返回分类。</p>
            </div>
          ) : (
            <div className="favorite-empty">
              <span className="favorite-empty__icon"><Icon name="heart" size={24} /></span>
              <h3>还没有收藏课程</h3>
              <p>在课程列表点亮爱心，喜欢的内容会留在这里。</p>
              <Button variant="secondary" onClick={() => onCategory(categories[0]?.value || "favorite")}>去发现课程</Button>
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

function MyScreen({
  period,
  setPeriod,
  onNavigate,
  onOpenPreferences,
  onOpenSettings,
  profile,
  learningSettings,
  interests,
  defaultTab,
}) {
  const report = window.SaylineData.stats[period];
  const defaultLabel = defaultTab === "favorite"
    ? "我喜欢"
    : window.SaylineData.categories.find((item) => item.value === defaultTab)?.fullLabel;
  const enabledTranslationCount = Object.values(learningSettings.translations).filter(Boolean).length;

  return (
    <div className="app-screen me-screen">
      <header className="me-header">
        <div>
          <p className="eyebrow">MY SPACE</p>
          <h1>我的</h1>
        </div>
        <IconButton label="打开设置" onClick={onOpenSettings} variant="outline">
          <Icon name="settings-2" size={20} />
        </IconButton>
      </header>

      <div className="me-scroll">
        <button className="profile-card" onClick={onOpenSettings} type="button">
          <span className="profile-card__avatar">
            {profile.avatarUrl
              ? <img alt="" src={profile.avatarUrl} />
              : profile.nickname.slice(0, 1)}
          </span>
          <div className="profile-card__copy">
            <span>PERSONAL PROFILE</span>
            <h2>{profile.nickname}</h2>
            <p>{profile.phoneMasked}</p>
          </div>
          <span className="profile-card__edit">
            <Icon name="pen-line" size={14} />
            编辑资料
          </span>
        </button>

        <section className="settings-shortcuts">
          <button onClick={onOpenSettings} type="button">
            <span className="settings-shortcuts__icon"><Icon name="captions" size={18} /></span>
            <span>
              <strong>学习设置</strong>
              <small>字幕字号、颜色、翻译显示</small>
            </span>
            <span className="settings-shortcuts__meta">{enabledTranslationCount}/4 中文</span>
            <Icon name="chevron-right" size={18} />
          </button>
          <button onClick={onOpenPreferences} type="button">
            <span className="settings-shortcuts__icon"><Icon name="settings-2" size={18} /></span>
            <span>
              <strong>学习偏好</strong>
              <small>{interests.length} 个兴趣分类 · 默认：{defaultLabel || "职场英语"}</small>
            </span>
            <Icon name="chevron-right" size={18} />
          </button>
        </section>

        <div className="report-title">
          <div>
            <p className="eyebrow">LEARNING REPORT</p>
            <h2>学习统计</h2>
          </div>
          <span>{report.studiedDays} 天有学习</span>
        </div>

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

function InterestOnboardingScreen({ onComplete }) {
  const [selected, setSelected] = React.useState([]);
  const catalog = window.SaylineData.categories;

  function toggleCategory(value) {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  const firstCategory = catalog.find((item) => item.value === selected[0]);

  return (
    <div className="app-screen onboarding-screen">
      <header className="onboarding-header">
        <SaylineWordmark compact />
        <span>01 / 01</span>
      </header>

      <div className="onboarding-copy">
        <p className="eyebrow">MAKE IT YOURS</p>
        <h1>选择你感兴趣的<br />领域。</h1>
        <p>首页只展示你选择的分类。第一个选择会成为默认 Tab，之后可以随时调整。</p>
      </div>

      <div className="interest-grid">
        {catalog.map((item, index) => {
          const selectionIndex = selected.indexOf(item.value);
          const isSelected = selectionIndex >= 0;
          return (
            <button
              aria-pressed={isSelected}
              className={"interest-option " + (isSelected ? "is-selected" : "")}
              key={item.value}
              onClick={() => toggleCategory(item.value)}
              style={{ "--category-a": item.colorA, "--category-b": item.colorB }}
              type="button"
            >
              <span className="interest-option__number">{String(index + 1).padStart(2, "0")}</span>
              <span className="interest-option__icon"><Icon name={item.icon} size={22} /></span>
              <span className="interest-option__copy">
                <strong>{item.fullLabel}</strong>
                <small>{item.description}</small>
              </span>
              <span className="interest-option__check">
                {isSelected ? <><Icon name="check" size={15} />{selectionIndex + 1}</> : "+"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="onboarding-foot">
        <div className="onboarding-selection">
          <span>{selected.length ? `${selected.length} 个已选` : "至少选择 1 个"}</span>
          <strong>{firstCategory ? `默认：${firstCategory.fullLabel}` : "选择顺序决定首页顺序"}</strong>
        </div>
        <Button
          disabled={!selected.length}
          fullWidth
          onClick={() => selected.length && onComplete(selected)}
          size="lg"
        >
          完成，开始学习
        </Button>
      </div>
    </div>
  );
}

function SettingsScreen({
  profile,
  learningSettings,
  onBack,
  onSave,
  onOpenPreferences,
}) {
  const [draftProfile, setDraftProfile] = React.useState(profile);
  const [draftSettings, setDraftSettings] = React.useState(learningSettings);
  const fileInputRef = React.useRef(null);
  const captionColors = window.SaylineData.captionColors;
  const captionSizes = window.SaylineData.captionSizes;
  const translationModes = window.SaylineData.translationModes;
  const activeColor = captionColors.find((item) => item.value === draftSettings.captionColor) || captionColors[0];

  function updateTranslation(mode, checked) {
    setDraftSettings((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [mode]: checked,
      },
    }));
  }

  return (
    <div className="app-screen settings-screen">
      <header className="settings-header">
        <IconButton label="返回我的" onClick={onBack}>
          <Icon name="chevron-left" size={23} />
        </IconButton>
        <div>
          <p className="eyebrow">SETTINGS</p>
          <h1>设置</h1>
        </div>
        <span>PERSONAL</span>
      </header>

      <div className="settings-scroll">
        <section className="settings-section">
          <div className="settings-section__head">
            <h2>个人信息</h2>
            <span>PERSONAL PROFILE</span>
          </div>

          <div className="settings-profile">
            <button
              aria-label="更换头像"
              className="settings-avatar"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              {draftProfile.avatarUrl
                ? <img alt="" src={draftProfile.avatarUrl} />
                : draftProfile.nickname.slice(0, 1)}
              <span><Icon name="image" size={14} /></span>
            </button>
            <input
              accept="image/*"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setDraftProfile((current) => ({
                  ...current,
                  avatarUrl: URL.createObjectURL(file),
                }));
              }}
              ref={fileInputRef}
              type="file"
            />
            <div>
              <strong>头像与账号资料</strong>
              <small>点击头像更换图片</small>
            </div>
          </div>

          <div className="settings-field-grid">
            <Input
              id="profile-nickname"
              label="昵称"
              maxLength={20}
              onChange={(event) => setDraftProfile((current) => ({ ...current, nickname: event.target.value }))}
              value={draftProfile.nickname}
            />
            <Input
              id="profile-phone"
              inputMode="tel"
              label="手机号"
              onChange={(event) => setDraftProfile((current) => ({ ...current, phone: event.target.value }))}
              value={draftProfile.phone}
            />
          </div>
          <p className="settings-note">更换手机号后需要重新验证，验证流程将在正式开发中接入。</p>
        </section>

        <section className="settings-section">
          <div className="settings-section__head">
            <h2>学习设置</h2>
            <span>PLAYER DISPLAY</span>
          </div>

          <div className="settings-control-group">
            <div className="settings-control-group__label">
              <strong>字幕字号</strong>
              <span>影响听、读、写、说模式</span>
            </div>
            <Tabs
              items={captionSizes.map((item) => ({ value: String(item.value), label: item.label }))}
              onChange={(value) => setDraftSettings((current) => ({ ...current, captionScale: Number(value) }))}
              value={String(draftSettings.captionScale)}
              variant="pill"
            />
          </div>

          <div className="settings-control-group">
            <div className="settings-control-group__label">
              <strong>字幕颜色</strong>
              <span>{activeColor.label}</span>
            </div>
            <div className="caption-colors">
              {captionColors.map((item) => (
                <button
                  aria-label={`字幕颜色：${item.label}`}
                  aria-pressed={draftSettings.captionColor === item.value}
                  className={draftSettings.captionColor === item.value ? "is-active" : ""}
                  key={item.value}
                  onClick={() => setDraftSettings((current) => ({
                    ...current,
                    captionColor: item.value,
                    captionMuted: item.muted,
                  }))}
                  type="button"
                >
                  <i style={{ background: item.value }}></i>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div
            className="caption-preview"
            style={{
              "--preview-caption-color": draftSettings.captionColor,
              "--preview-caption-muted": draftSettings.captionMuted,
              "--preview-caption-scale": draftSettings.captionScale,
            }}
          >
            <span>PREVIEW</span>
            <strong>Every sentence has its own rhythm.</strong>
            <small>每一句话都有自己的节奏。</small>
          </div>

          <div className="settings-control-group settings-control-group--switches">
            <div className="settings-control-group__label">
              <strong>中文翻译</strong>
              <span>分别控制四个学习模式</span>
            </div>
            <div className="translation-grid">
              {translationModes.map((mode) => (
                <Switch
                  checked={draftSettings.translations[mode.value]}
                  id={`translation-${mode.value}`}
                  key={mode.value}
                  onChange={(checked) => updateTranslation(mode.value, checked)}
                >
                  {mode.label}
                </Switch>
              ))}
            </div>
          </div>
        </section>

        <button className="settings-link-row" onClick={onOpenPreferences} type="button">
          <span><Icon name="settings-2" size={18} /></span>
          <div>
            <strong>首页分类与默认 Tab</strong>
            <small>调整兴趣、顺序和登录后的默认页面</small>
          </div>
          <Icon name="chevron-right" size={18} />
        </button>
      </div>

      <div className="settings-footer">
        <Button fullWidth onClick={() => onSave(draftProfile, draftSettings)} size="lg">保存设置</Button>
      </div>
    </div>
  );
}

function PreferencesScreen({
  interests,
  defaultTab,
  onBack,
  onSave,
}) {
  const [ordered, setOrdered] = React.useState(interests);
  const [selectedDefault, setSelectedDefault] = React.useState(defaultTab);
  const [draggedIndex, setDraggedIndex] = React.useState(null);
  const catalog = window.SaylineData.categories;
  const selectedCategories = ordered
    .map((value) => catalog.find((item) => item.value === value))
    .filter(Boolean);
  const availableCategories = catalog.filter((item) => !ordered.includes(item.value));

  function moveInterest(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    [next[index], next[target]] = [next[target], next[index]];
    setOrdered(next);
  }

  function removeInterest(value) {
    if (ordered.length === 1) return;
    const next = ordered.filter((item) => item !== value);
    setOrdered(next);
    if (selectedDefault === value) setSelectedDefault(next[0]);
  }

  function addInterest(value) {
    setOrdered((current) => [...current, value]);
  }

  return (
    <div className="app-screen preferences-screen">
      <header className="preferences-header">
        <IconButton label="返回我的学习" onClick={onBack}>
          <Icon name="chevron-left" size={23} />
        </IconButton>
        <div>
          <p className="eyebrow">SETTINGS</p>
          <h1>学习偏好</h1>
        </div>
        <span className="preferences-header__count">{ordered.length + 1} TABS</span>
      </header>

      <div className="preferences-scroll">
        <section className="preferences-section">
          <div className="preferences-section__head">
            <h2>首页分类</h2>
            <span>拖动或使用箭头排序</span>
          </div>
          <p className="preferences-help">点击“设为默认”，登录后会直接进入该 Tab。</p>

          <div className="preference-list">
            {selectedCategories.map((item, index) => (
              <div
                className="preference-row"
                draggable
                key={item.value}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => setDraggedIndex(index)}
                onDrop={() => {
                  if (draggedIndex == null || draggedIndex === index) return;
                  const next = [...ordered];
                  const [moved] = next.splice(draggedIndex, 1);
                  next.splice(index, 0, moved);
                  setOrdered(next);
                  setDraggedIndex(null);
                }}
              >
                <span className="preference-row__grip" aria-hidden="true">⋮⋮</span>
                <span className="preference-row__icon"><Icon name={item.icon} size={19} /></span>
                <div className="preference-row__copy">
                  <strong>{item.fullLabel}</strong>
                  <small>{selectedDefault === item.value ? "登录后默认进入" : item.description}</small>
                </div>
                <div className="preference-row__actions">
                  <IconButton
                    disabled={index === 0}
                    label={`上移 ${item.fullLabel}`}
                    onClick={() => moveInterest(index, -1)}
                  >
                    <Icon name="chevrons-up" size={17} />
                  </IconButton>
                  <IconButton
                    disabled={index === ordered.length - 1}
                    label={`下移 ${item.fullLabel}`}
                    onClick={() => moveInterest(index, 1)}
                  >
                    <Icon name="chevrons-down" size={17} />
                  </IconButton>
                  <IconButton
                    disabled={ordered.length === 1}
                    label={`移除 ${item.fullLabel}`}
                    onClick={() => removeInterest(item.value)}
                  >
                    <Icon name="x" size={17} />
                  </IconButton>
                </div>
                <button
                  aria-pressed={selectedDefault === item.value}
                  className={"default-choice " + (selectedDefault === item.value ? "is-default" : "")}
                  onClick={() => setSelectedDefault(item.value)}
                  type="button"
                >
                  {selectedDefault === item.value ? "默认 Tab" : "设为默认"}
                </button>
              </div>
            ))}

            <div className="preference-row preference-row--fixed">
              <span className="preference-row__grip" aria-hidden="true"></span>
              <span className="preference-row__icon"><Icon name="heart" size={19} /></span>
              <div className="preference-row__copy">
                <strong>我喜欢</strong>
                <small>固定显示在最后一个 Tab</small>
              </div>
              <button
                aria-pressed={selectedDefault === "favorite"}
                className={"default-choice " + (selectedDefault === "favorite" ? "is-default" : "")}
                onClick={() => setSelectedDefault("favorite")}
                type="button"
              >
                {selectedDefault === "favorite" ? "默认 Tab" : "设为默认"}
              </button>
            </div>
          </div>
        </section>

        <section className="preferences-section">
          <div className="preferences-section__head">
            <h2>添加兴趣</h2>
            <span>{availableCategories.length ? "点击添加" : "已添加全部"}</span>
          </div>
          <div className="interest-pool">
            {availableCategories.length ? availableCategories.map((item) => (
              <button key={item.value} onClick={() => addInterest(item.value)} type="button">
                <Icon name="plus" size={15} />
                {item.fullLabel}
              </button>
            )) : (
              <p>当前所有课程分类都已经加入首页。</p>
            )}
          </div>
        </section>
      </div>

      <div className="preferences-footer">
        <p>修改会立即应用到首页 Tab，并同步到其他设备。</p>
        <Button fullWidth onClick={() => onSave(ordered, selectedDefault)} size="lg">保存偏好</Button>
      </div>
    </div>
  );
}

Object.assign(window, {
  LoginScreen,
  HomeScreen,
  MyScreen,
  InterestOnboardingScreen,
  SettingsScreen,
  PreferencesScreen,
  ContinueCard,
});
