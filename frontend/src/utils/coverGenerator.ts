export interface CoverSpec {
  title: string
  categoryName?: string
  colorA: string
  colorB: string
  coverImageUrl?: string
}

export const COVER_WIDTH = 600
export const COVER_HEIGHT = 800

const FONT_SERIF = "'Instrument Serif', Georgia, 'Noto Serif SC', 'Songti SC', serif"
const FONT_SANS = "'Manrope', 'PingFang SC', 'Microsoft YaHei', sans-serif"

interface TextTheme {
  fg: string
  muted: string
  underline: string
}

const LIGHT_TEXT: TextTheme = {
  fg: '#fffdfa',
  muted: 'rgba(255,253,250,0.72)',
  underline: 'rgba(255,253,250,0.9)',
}

const DARK_TEXT: TextTheme = {
  fg: '#171a16',
  muted: 'rgba(23,26,22,0.68)',
  underline: 'rgba(23,26,22,0.9)',
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = Number.parseInt(h || '000000', 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

// Split into: a single CJK character, a whitespace run, or a run of latin/digits/punctuation.
function tokenize(text: string): string[] {
  return (
    text.match(/[⺀-鿿豈-﫿＀-￯]|\s+|[^\s⺀-鿿豈-﫿＀-￯]+/g) ??
    [text]
  )
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const token of tokenize(text)) {
    if (token === '\n') {
      if (line.trim()) lines.push(line.trim())
      line = ''
      continue
    }
    const candidate = line + token
    if (line.trim() && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line.trimEnd())
      line = token.trimStart()
    } else {
      line = candidate
    }
  }
  if (line.trim()) lines.push(line.trim())
  return lines
}

const imageCache = new Map<string, Promise<HTMLImageElement>>()

function loadImage(url: string): Promise<HTMLImageElement> {
  let pending = imageCache.get(url)
  if (!pending) {
    pending = new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('封面图片加载失败'))
      img.src = url
    })
    imageCache.set(url, pending)
  }
  return pending
}

function drawGradient(ctx: CanvasRenderingContext2D, spec: CoverSpec): void {
  const w = COVER_WIDTH
  const h = COVER_HEIGHT

  const background = ctx.createLinearGradient(0, 0, 0, h)
  background.addColorStop(0, spec.colorA)
  background.addColorStop(1, spec.colorB)
  ctx.fillStyle = background
  ctx.fillRect(0, 0, w, h)

  const shade = ctx.createLinearGradient(0, h * 0.5, 0, h)
  shade.addColorStop(0, 'rgba(0,0,0,0)')
  shade.addColorStop(1, 'rgba(0,0,0,0.28)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, w, h)
}

function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement): void {
  const w = COVER_WIDTH
  const h = COVER_HEIGHT
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)

  ctx.fillStyle = 'rgba(0,0,0,0.42)'
  ctx.fillRect(0, 0, w, h)

  const shade = ctx.createLinearGradient(0, h * 0.4, 0, h)
  shade.addColorStop(0, 'rgba(0,0,0,0)')
  shade.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, w, h)
}

function drawText(ctx: CanvasRenderingContext2D, spec: CoverSpec, theme: TextTheme): void {
  ctx.textBaseline = 'alphabetic'

  if (spec.categoryName) {
    ctx.fillStyle = theme.fg
    ctx.font = `600 40px ${FONT_SANS}`
    ctx.fillText(spec.categoryName, 56, 96)
  }

  const fontSize = 72
  const lineHeight = 88
  const maxWidth = COVER_WIDTH - 112
  ctx.fillStyle = theme.fg
  ctx.font = `700 ${fontSize}px ${FONT_SERIF}`
  const lines = wrapText(ctx, spec.title, maxWidth).slice(0, 4)
  const blockTop = COVER_HEIGHT - 168 - lines.length * lineHeight
  let baseline = blockTop + fontSize * 0.82
  for (const line of lines) {
    ctx.fillText(line, 56, baseline)
    baseline += lineHeight
  }

  ctx.fillStyle = theme.underline
  ctx.fillRect(56, COVER_HEIGHT - 128, 96, 6)
}

export async function renderCover(ctx: CanvasRenderingContext2D, spec: CoverSpec): Promise<void> {
  ctx.clearRect(0, 0, COVER_WIDTH, COVER_HEIGHT)

  let theme: TextTheme
  if (spec.coverImageUrl) {
    try {
      const img = await loadImage(spec.coverImageUrl)
      drawImageCover(ctx, img)
      theme = LIGHT_TEXT
    } catch {
      drawGradient(ctx, spec)
      theme = luminance(spec.colorB) > 0.5 ? DARK_TEXT : LIGHT_TEXT
    }
  } else {
    drawGradient(ctx, spec)
    theme = luminance(spec.colorB) > 0.5 ? DARK_TEXT : LIGHT_TEXT
  }

  drawText(ctx, spec, theme)
}

export async function generateCoverBlob(spec: CoverSpec): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = COVER_WIDTH
  canvas.height = COVER_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('无法创建画布'))
  await renderCover(ctx, spec)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('封面生成失败'))), 'image/png')
  })
}
