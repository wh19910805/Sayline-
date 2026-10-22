const SaylineWordmark = ({ light = false, compact = false }) => (
  <div className={"sayline-lockup " + (light ? "is-light" : "") + (compact ? " is-compact" : "")}>
    <img
      alt=""
      className="sayline-lockup__mark"
      src={light ? "../../assets/brand/sayline-mark-cream.svg" : "../../assets/brand/sayline-mark.svg"}
    />
    <div>
      <div className="sayline-lockup__word">Sayline</div>
      <div className="sayline-lockup__cn">逐 句 英 语</div>
    </div>
  </div>
);

const CoverArt = ({ course, className = "" }) => (
  <div
    aria-hidden="true"
    className={"cover-art " + className}
    style={{
      "--cover-a": course.colorA,
      "--cover-b": course.colorB,
    }}
  >
    <span className="cover-art__line"></span>
  </div>
);

const WeekChart = ({ days }) => {
  const maxValue = Math.max(...days.map((day) => day.minutes), 1);

  return (
    <div className="week-chart" aria-label="本周学习时长">
      {days.map((day, index) => {
        const height = day.minutes ? Math.max(14, (day.minutes / maxValue) * 100) : 3;
        return (
          <div className={"week-day " + (index === 2 ? "is-today" : "")} key={day.label}>
            <div className="week-day__track">
              <span
                className={"week-day__bar " + (day.minutes ? "has-study" : "")}
                style={{ height: `${height}%` }}
              ></span>
            </div>
            <span>{day.label}</span>
          </div>
        );
      })}
    </div>
  );
};

const MonthHeatmap = ({ values }) => {
  const weekdays = ["一", "二", "三", "四", "五", "六", "日"];

  return (
    <div className="month-heatmap">
      {weekdays.map((day) => (
        <span className="month-weekday" key={day}>{day}</span>
      ))}
      {[0, 1, 2].map((offset) => (
        <span aria-hidden="true" className="month-day is-empty" key={`empty-${offset}`}></span>
      ))}
      {Array.from({ length: 31 }, (_, index) => {
        const day = index + 1;
        const minutes = values[day] || 0;
        const level = minutes === 0 ? 0 : minutes < 20 ? 1 : minutes < 50 ? 2 : 3;
        return (
          <span
            aria-label={`${day} 日，学习 ${minutes} 分钟`}
            className={`month-day level-${level} ${day === 21 ? "is-today" : ""}`}
            key={day}
          >
            {day}
          </span>
        );
      })}
    </div>
  );
};

const ReviewRail = ({ screen, onNavigate }) => {
  const screens = [
    ["login", "01 / 登录"],
    ["interests", "02 / 兴趣选择"],
    ["home", "03 / 首页"],
    ["player", "04 / 播放器"],
    ["me", "05 / 我的学习"],
    ["settings", "06 / 设置"],
    ["preferences", "07 / 学习偏好"],
  ];

  return (
    <aside className="review-rail">
      <SaylineWordmark />
      <p className="review-rail__eyebrow">Learner UI · Interactive review</p>
      <h1>一句一句，<br />听见自己。</h1>
      <div className="review-rail__links">
        {screens.map(([value, label]) => (
          <button
            className={screen === value ? "is-active" : ""}
            key={value}
            onClick={() => onNavigate(value)}
            type="button"
          >
            <span>{label}</span>
            <i></i>
          </button>
        ))}
      </div>
      <p className="review-rail__note">可直接点击分类、课程、学习模式和底部导航。播放器支持键盘方向键切换课程。</p>
    </aside>
  );
};

window.SaylineShared = {
  SaylineWordmark,
  CoverArt,
  WeekChart,
  MonthHeatmap,
  ReviewRail,
};
