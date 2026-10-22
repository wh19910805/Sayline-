# Sayline 逐句英语 Design System

Sayline 是一套面向成人英语自学者的声音学习品牌与移动端界面系统。产品以一段音频、一组双语字幕和“听、读、写、说”四个训练环节为核心。

品牌主张：**一句一句，听见自己。**

英文表达：**Every line is a place to pause and listen.**

## 设计来源

- 产品需求：[英语学习应用 MVP 设计](../../docs/superpowers/specs/2026-10-21-english-learning-mvp-design.md)
- 用户提供的沉浸式音乐播放器参考：封面取色背景、歌词式字幕、底部播放控制
- 品牌探索：[`explorations/brand-directions.html`](explorations/brand-directions.html)
- 标记探索：[`explorations/mark-refinements.html`](explorations/mark-refinements.html)
- 最终选择：编辑感方向 A“墨与余烬”，加入方向 B 的深绿、燕麦色与陪伴感；Logo 使用 A“行间停顿”

## 品牌定位

Sayline 不做游戏化闯关，也不把成人学习包装成儿童课程。它更像一间安静的学习室：有明确的训练节奏、真实的学习反馈，以及可以长期坚持的低压力体验。

三个品牌原则：

1. **一句也算进步。** 学习被拆成可完成的句子，而不是遥不可及的课程。
2. **声音先于装饰。** 播放器、字幕和训练反馈是视觉主角，品牌元素保持克制。
3. **反馈要诚实。** 不夸张庆祝，不用虚假的热血文案；清晰告诉用户哪里完成、哪里还差一点。

## CONTENT FUNDAMENTALS

- 语气：冷静、清楚、尊重成年人；像一位可靠的学习同伴。
- 句子短，动词具体。优先写“继续上次学习”，不写“开启你的英语蜕变之旅”。
- 直接称呼“你”，但不制造焦虑。避免“再不学就晚了”“最后机会”。
- 不使用 emoji、网络热梗、感叹号堆叠或游戏化称号。
- 状态文案说明事实和下一步：`还差 3 句完成听写`、`已保存到第 4 句`、`音频加载失败，点击重试`。
- 品牌与栏目英文标签使用全大写小字号；正文保持正常大小写。
- 课程标题保留英文原名，中文书名或短说明放在次级位置。

示例：

- `今天，练点英语。`
- `保持自己的节奏，一句也算进步。`
- `这一句已听 2 次。`
- `本列表已学完。`
- `还差 3 句完成听写。`

避免：

- `冲鸭！今天也要元气满满！`
- `学霸专属课程，秒变英语大神！`
- `你已击败 99% 的学习者！`

## VISUAL FOUNDATIONS

### 色彩

- 主背景使用温暖纸张色，而不是纯白，降低屏幕刺激。
- 文字使用近黑墨色。行动与当前句使用陶土橙；深绿用于长时间学习和进度。
- 课程播放器由封面主色和辅助色生成模糊背景。内容层叠加固定深色遮罩，保证字幕与控件可读。
- 不使用蓝紫渐变、霓虹高亮或大面积纯饱和色。

### 字体

- 英文展示字体：Instrument Serif。用于品牌词、标题、引语和完成提示，带来编辑感与可记忆的停顿。
- 界面字体：Manrope。用于导航、按钮、字段、数据与说明。
- 中文使用 `PingFang SC / Microsoft YaHei / Noto Sans SC` 系统回退；中文正文行高约 1.7–1.78。
- 数据使用 tabular numerals，避免学习时长变化时布局跳动。

### 空间与布局

- 移动端页面边距 20px，触控目标不小于 44×44px。
- 采用 4px 基础节奏；常用间距为 8、12、16、20、24、32。
- 首页与管理页使用清晰的纵向信息层级；播放器为满屏沉浸式，不使用课程详情页。
- 主标题与内容之间使用充足留白，避免把每块信息都装进卡片。

### 形状与材质

- 字段 6px、封面 10px、卡片 14px、面板 20px、对话框 28px。
- 卡片主要依靠细边框和极浅暖阴影，不以浮夸投影制造层级。
- 使用少量半透明玻璃层承载播放器控件；正文不放入高透明层。
- 品牌标记是一条被播放节点打断的句子线，不替代功能图标。

### 动效

- 快速反馈 140ms，状态切换 220ms，整屏或进度过渡 320ms。
- 统一使用 `cubic-bezier(.2, .8, .2, 1)`，不使用弹跳和夸张回弹。
- 上滑切课使用 320ms 垂直位移；录音时波形可以柔和呼吸。
- 尊重 `prefers-reduced-motion`，关闭循环和进入动画。

### 交互状态

- Hover：背景轻微提亮或表面色加深，文字对比增强，不改变布局。
- Press：控件缩放到 0.985–0.94，持续 140ms。
- Focus：2px 陶土橙外框，偏移 3px，不能被裁切。
- Disabled：透明度约 45%，指针事件关闭，不显示伪可用状态。
- 收藏：空心心形变为陶土橙实心，并保留至少 34px 的局部命中区。

## ICONOGRAPHY

- 功能图标使用 Lucide line 图标，默认 1.75px 描边。
- 图标尺寸主要使用 16、19、20、22、24px；独立操作使用 44px 触控区域。
- 不混用填充和线性图标，不使用 emoji 充当图标。
- 播放、收藏、录音、模式切换等核心操作必须有可访问名称和清晰的选中状态。
- 图标资产复制在 [`assets/icons`](assets/icons)；原始集合为 `lucide-static@1.61.0`。

## TOKENS

- [`tokens/colors.css`](tokens/colors.css)：品牌色、中性色、语义色、播放器主题
- [`tokens/typography.css`](tokens/typography.css)：字体、字号、行高、字重
- [`tokens/spacing.css`](tokens/spacing.css)：间距、页面边距、触控尺寸、安全区
- [`tokens/shape.css`](tokens/shape.css)：圆角、边框、焦点框
- [`tokens/elevation.css`](tokens/elevation.css)：阴影与玻璃模糊
- [`tokens/motion.css`](tokens/motion.css)：时长、缓动与减少动效策略
- [`tokens/fonts.css`](tokens/fonts.css)：本地字体声明

全局样式入口是 [`styles.css`](styles.css)。消费者只需要链接这个文件并加载编译后的 `_ds_bundle.js`。

## COMPONENTS

- Core：`Icon`、`Button`、`IconButton`、`Input`、`Textarea`、`Checkbox`、`Badge`
- Navigation：`Tabs`、`BottomNav`
- Learning：`CategoryCard`、`ProgressBar`、`ModeSwitcher`、`CourseCard`、`StatTile`、`WordInput`
- Feedback：`Dialog`、`Toast`

所有组件都包含 `.d.ts` props 契约与 `.prompt.md` 使用说明。

## UI KIT

交互式用户端：[`ui_kits/learner/index.html`](ui_kits/learner/index.html)

包含：

- 登录页
- 首次登录兴趣选择
- 首页仅展示已选兴趣与“我喜欢”，支持课程搜索
- 每个兴趣分类的瀑布流第一张为正方形分类图片，后续课程卡片使用不同高度形成错位
- 播放器听、读、写、说四种模式
- 写模式以可滚动完整字幕流提供上下文，当前句嵌入按单词长度生成的填空线；字母逐字显示红绿反馈，离开输入区后自动提交
- 听/读模式进入后显示控制区，6 秒后连同模式图标自动隐藏；点击画面恢复。写/说模式保持控制区常显
- 上下滑动/方向键切换课程
- 个人信息与周/月学习统计
- 学习偏好：添加/移除兴趣、排序、设置默认 Tab

可用 URL 参数快速定位：

- `?screen=home`
- `?screen=login`
- `?screen=interests`
- `?screen=player&mode=listen|read|write|speak`
- `?screen=me&period=week|month`
- `?screen=preferences`
- `?screen=home&category=favorite`

## FILE INDEX

- `assets/brand/`：Logo 标记、反白版本、App 图标
- `assets/fonts/`：Instrument Serif 与 Manrope
- `assets/icons/`：Lucide 图标资产
- `assets/covers/`：分类封面演示图，正式产品由管理端按分类上传
- `components/`：可复用组件与组件展示卡
- `guidelines/`：色彩、字体、间距、材质、动效和无障碍规范卡
- `ui_kits/learner/`：高保真可交互学习端
- `explorations/`：品牌方向与标记探索
- `scripts/generate-icons.mjs`：从本地 Lucide 资产重建 `Icon.jsx`

字体许可见 `assets/fonts/LICENSE-*.txt`；Lucide 许可见 `assets/icons/LICENSE-Lucide.txt`。

分类演示图片来源：

- 职场：https://images.unsplash.com/photo-1497366754035-f200968a6e72
- 口语：https://images.unsplash.com/photo-1495474472287-4d71bcdd2085
- 听力：https://images.unsplash.com/photo-1505740420928-5e560c06d30e

## 已知限制

- 品牌名称与标识仍需完成商标和域名检索。
- 中文品牌字体采用系统中文字体回退，正式发布前建议完成中文字体授权与字重选择。
- UI kit 中的课程封面是色彩与线条构成的占位艺术，接入真实课程后应使用真实封面图。
- 播放器交互为设计原型，不包含真实音频文件、真实录音或服务端同步。
- 管理端不在本次用户端设计范围内。
