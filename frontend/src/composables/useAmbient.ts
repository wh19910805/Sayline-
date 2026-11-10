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
  if (!saved?.primary) return
  const root = document.documentElement
  root.style.setProperty('--ambient', saved.primary)
  root.style.setProperty('--ambient-2', saved.secondary || saved.primary)
  root.style.setProperty('--ambient-cover', saved.cover ? `url("${saved.cover}")` : 'none')
}
