const KEY = 'sayline:ambient'

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

/** 设置状态栏主题色（theme-color meta）。 */
export function setThemeColor(color: string) {
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', color)
}

/** 页面背景是 ambient 混白（30%），据此同步状态栏颜色；不传参则读当前 --ambient。 */
export function syncThemeColor(primary?: string) {
  const base = primary || document.documentElement.style.getPropertyValue('--ambient') || '#f6f5f2'
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
