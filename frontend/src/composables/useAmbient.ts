const KEY = 'sayline:ambient'
const DEFAULT_SURFACE = '#f6f5f2'

interface AmbientState {
  primary: string
  secondary: string
  cover: string | null
}

function readSaved(): AmbientState | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as AmbientState) : null
  } catch {
    return null
  }
}

/** 同时设置页面根背景与状态栏主题色；安全区取色不会和页面内容产生接缝。 */
export function setThemeColor(color: string) {
  document.documentElement.style.setProperty('--app-bg', color)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', color)
}

/** 以 ambient 混白 30% 生成统一页面底色，并同步状态栏颜色。 */
export function syncThemeColor(primary?: string) {
  const base = primary || document.documentElement.style.getPropertyValue('--ambient') || DEFAULT_SURFACE
  setThemeColor(mixWithWhite(base, 0.3))
}

function mixWithWhite(hex: string, weight: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const ch = (v: number) => Math.round(v * weight + 255 * (1 - weight)).toString(16).padStart(2, '0')
  return `#${ch(r)}${ch(g)}${ch(b)}`
}

/** 设置动态背景颜色（并持久化），cover 传 undefined 表示不改变当前封面。 */
export function setAmbient(primary: string, secondary: string, cover?: string | null) {
  const root = document.documentElement
  const sec = secondary || primary
  root.style.setProperty('--ambient', primary)
  root.style.setProperty('--ambient-2', sec)

  const saved = readSaved()
  const nextCover = cover !== undefined ? cover : (saved?.cover ?? null)
  if (cover !== undefined) {
    root.style.setProperty('--ambient-cover', nextCover ? `url("${nextCover}")` : 'none')
  }

  try {
    localStorage.setItem(KEY, JSON.stringify({ primary, secondary: sec, cover: nextCover }))
  } catch {
    /* 忽略配额/隐私异常 */
  }
}

/** 应用启动时恢复上次的动态背景，避免刷新后回到白色。 */
export function restoreAmbient() {
  const saved = readSaved()
  const root = document.documentElement
  if (saved?.primary) {
    root.style.setProperty('--ambient', saved.primary)
    root.style.setProperty('--ambient-2', saved.secondary || saved.primary)
    root.style.setProperty('--ambient-cover', saved.cover ? `url("${saved.cover}")` : 'none')
  }
  syncThemeColor()
}

export function clearAmbient() {
  const root = document.documentElement
  root.style.removeProperty('--ambient')
  root.style.removeProperty('--ambient-2')
  root.style.removeProperty('--ambient-cover')
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* 忽略隐私模式异常 */
  }
  syncThemeColor()
}
