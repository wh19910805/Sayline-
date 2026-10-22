window.__overlays = {
  views: [
    {
      id: "visual-polish",
      label: "精致感提升机会",
      sentence: {
        metric: "视觉精致度",
        cohort: "成人英语自学者",
        window: "当前 MVP",
      },
      finding: "现有设计已经有明确的编辑气质和沉浸播放器，但页面仍偏“完整原型”：层级偏碎、小标签偏多、同一种圆角容器重复过多。下一步应把注意力留给课程封面、当前字幕和真正的操作。",
      dim: 0.3,
      elements: [
        {
          id: "home-feed",
          callout: {
            head: "信息流有价值，但层次还差一口气",
            body: "分类大图与课程卡都很完整，也都拥有圆角、边框和阴影，导致主次竞争。建议让分类图成为唯一的强视觉块，课程卡改为更安静的纸面层级，标题和封面先被看见。",
            place: "right",
          },
        },
        {
          id: "player-controls",
          callout: {
            head: "播放器应更像一个完整场景",
            body: "当前歌词氛围已经成立，但播控、完成按钮和模式图标形成三层底部界面。建议合并完成状态与播放信息，让控制层更像一次短暂的浮现，而不是第二个工具栏。",
            place: "left",
          },
        },
        {
          id: "write-current",
          callout: {
            head: "写模式仍需做减法",
            body: "当前句内同时出现模式名、序号、听原句、中文、逐词填写、自动提交提示和两个操作入口。建议保留“听原句、中文、填空”三件事，其余提示降级为状态或移除。",
            place: "left",
          },
        },
        {
          id: "my-shortcuts",
          callout: {
            head: "设置入口可以更有编辑感",
            body: "个人信息、快捷设置、学习统计依次堆叠后，页面更像后台账户页。建议用一段连续的个人资料区加细线菜单，让学习数据成为页面下半部的主叙事。",
            place: "right",
          },
        },
        {
          id: "settings-display",
          callout: {
            head: "设置页需要更少的容器",
            body: "字号、颜色和预览目前被放入多个白卡和标签中。建议采用连续设置纸张：标题、控制项和预览共享一个表面，只用细线和留白区分层级。",
            place: "left",
          },
        },
        {
          id: "settings-translations",
          callout: {
            head: "四个翻译开关可以更紧凑",
            body: "四项设置能读懂，但连续四行开关显得像系统设置面板。可将听、读、写、说做成一行四列的节奏控制，与播放器底部的四模式形成呼应。",
            place: "right",
          },
        },
      ],
    },
    {
      id: "what-works",
      label: "已经成立的部分",
      sentence: {
        metric: "设计辨识度",
        cohort: "成人英语自学者",
        window: "当前 MVP",
      },
      finding: "品牌不是缺装饰，而是需要把已经成立的部分推到更清楚的位置。墨纸配色、封面取色播放器和双语字幕节奏值得保留。",
      dim: 0.22,
      elements: [
        {
          id: "home-category-cover",
          callout: {
            head: "分类图让首页不像普通课程商城",
            body: "真实照片、方形比例和瀑布流造成的内容错位已经形成产品记忆点。后续应继续减少覆盖文字，而不是再增加装饰。",
            place: "right",
          },
        },
        {
          id: "player-lyrics",
          callout: {
            head: "播放器是整套设计最强的画面",
            body: "封面生成的暗色氛围、当前句的尺度反差和上下淡出的双语字幕共同形成了沉浸感。这里应继续做减法，保护这块视觉中心。",
            place: "left",
          },
        },
        {
          id: "settings-colors",
          callout: {
            head: "字幕颜色选择有真实预览",
            body: "颜色不是孤立色卡，而是在深色播放器场景里即时展示。保留这种“设置即预览”的做法，并扩大预览与控件的联系。",
            place: "left",
          },
        },
        {
          id: "home-navigation",
          callout: {
            head: "分类导航轻盈，不抢内容",
            body: "没有 Logo 和口号后，首页更直接。保留当前顶部克制的搜索与分类结构，下一步只需统一字号和间距。",
            place: "right",
          },
        },
      ],
    },
    {
      id: "consistency-closeout",
      label: "一致性收尾",
      sentence: {
        metric: "界面一致性",
        cohort: "成人英语自学者",
        window: "当前 MVP",
      },
      finding: "整体视觉语言统一，但还有几处细节会暴露原型感：微小英文字号、过多的圆角卡、进度色与行动色混用，以及页面标题层级不完全一致。",
      dim: 0.3,
      elements: [
        {
          id: "home-card-metadata",
          callout: {
            head: "最小字号需要抬高",
            body: "课程元信息、辅助标签和说明大量使用 7–9px。建议将可读信息提升到 10–11px，同时删掉不承担决策的微文案，精致感来自留白，不来自更多字。",
            place: "right",
          },
        },
        {
          id: "player-progress",
          callout: {
            head: "进度色应只表达一种含义",
            body: "首页课程进度使用橙色，学习统计使用绿色，播放器当前进度又接近白色。建议固定：橙色代表行动，绿色代表完成与历史，播放器保留白色媒体进度。",
            place: "left",
          },
        },
        {
          id: "settings-header",
          callout: {
            head: "设置与偏好应共用同一套标题系统",
            body: "设置页使用大号衬线标题，学习偏好页结构相近但层级不同。建议统一返回、标题、英文眉题和保存操作的位置。",
            place: "left",
          },
        },
        {
          id: "write-blanks",
          callout: {
            head: "表单线可以更有节奏",
            body: "逐词下划线已经独特，但词块宽度和行间变化还可以更规整。建议固定基线、按词长分级字号，并让正误色只在内容出现后显现。",
            place: "right",
          },
        },
      ],
    },
  ],
};
