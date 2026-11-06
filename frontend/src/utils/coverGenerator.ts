export interface CoverSpec {
  title: string
  colorA: string
  colorB: string
  coverImageUrl?: string
}

export const COVER_WIDTH = 600
export const COVER_HEIGHT = 800

const FONT_SERIF = "'Instrument Serif', Georgia, 'Noto Serif SC', 'Songti SC', serif"

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

// 底色层：分类主色→辅色渐变 + 暖调光斑
function drawColorBase(ctx: CanvasRenderingContext2D, spec: CoverSpec): void {
  const w = COVER_WIDTH
  const h = COVER_HEIGHT

  const base = ctx.createLinearGradient(0, 0, 0, h)
  base.addColorStop(0, spec.colorA)
  base.addColorStop(1, spec.colorB)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)

  const glow = ctx.createRadialGradient(w * 0.72, h * 0.2, 0, w * 0.72, h * 0.2, w * 0.5)
  glow.addColorStop(0, 'rgba(217,181,110,0.34)')
  glow.addColorStop(1, 'rgba(217,181,110,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, w, h)
}

// 氛围层：分类封面图淡化为灰调纹理，叠在渐变上提供质感而不夺色
function drawTexture(ctx: CanvasRenderingContext2D, img: HTMLImageElement): void {
  const w = COVER_WIDTH
  const h = COVER_HEIGHT
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale

  ctx.save()
  if ('filter' in ctx) {
    ctx.filter = 'grayscale(1) contrast(1.02) brightness(0.82)'
  }
  ctx.globalAlpha = 0.4
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
  ctx.restore()
}

// 程序化纸张颗粒
let grainTile: HTMLCanvasElement | null = null

function drawGrain(ctx: CanvasRenderingContext2D): void {
  const w = COVER_WIDTH
  const h = COVER_HEIGHT
  if (!grainTile) {
    const size = 128
    grainTile = document.createElement('canvas')
    grainTile.width = grainTile.height = size
    const g = grainTile.getContext('2d')
    if (!g) return
    const data = g.createImageData(size, size)
    for (let i = 0; i < data.data.length; i += 4) {
      const v = 120 + Math.floor(Math.random() * 60)
      data.data[i] = data.data[i + 1] = data.data[i + 2] = v
      data.data[i + 3] = 255
    }
    g.putImageData(data, 0, 0)
  }
  const pattern = ctx.createPattern(grainTile, 'repeat')
  if (!pattern) return
  ctx.save()
  ctx.globalAlpha = 0.05
  ctx.globalCompositeOperation = 'overlay'
  ctx.fillStyle = pattern
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

// 底部暗化：保证标题可读
function drawShade(ctx: CanvasRenderingContext2D): void {
  const w = COVER_WIDTH
  const h = COVER_HEIGHT
  const shade = ctx.createLinearGradient(0, h * 0.5, 0, h)
  shade.addColorStop(0, 'rgba(0,0,0,0)')
  shade.addColorStop(1, 'rgba(0,0,0,0.34)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, w, h)
}

// 印刷 motif：右上角细圆环
function drawMotif(ctx: CanvasRenderingContext2D): void {
  const w = COVER_WIDTH
  const h = COVER_HEIGHT
  ctx.save()
  ctx.strokeStyle = 'rgba(255,253,250,0.16)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(w * 0.82, h * 0.16, 120, 0, Math.PI * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(w * 0.82, h * 0.16, 96, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawText(ctx: CanvasRenderingContext2D, spec: CoverSpec, theme: TextTheme): void {
  ctx.textBaseline = 'alphabetic'

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

  let usedImage = false
  drawColorBase(ctx, spec)
  if (spec.coverImageUrl) {
    try {
      const img = await loadImage(spec.coverImageUrl)
      drawTexture(ctx, img)
      usedImage = true
    } catch {
      // 分类封面图加载失败则退回纯渐变，不影响生成
    }
  }
  drawGrain(ctx)
  drawShade(ctx)
  drawMotif(ctx)

  const theme = usedImage ? LIGHT_TEXT : luminance(spec.colorB) > 0.5 ? DARK_TEXT : LIGHT_TEXT
  drawText(ctx, spec, theme)
}

export async function generateCoverBlob(spec: CoverSpec): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = COVER_WIDTH
  canvas.height = COVER_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('无法创建画布'))
  await renderCover(ctx, spec)
  const output = document.createElement('canvas')
  output.width = 450
  output.height = 600
  const outputCtx = output.getContext('2d')
  if (!outputCtx) return Promise.reject(new Error('无法创建画布'))
  outputCtx.drawImage(canvas, 0, 0, 450, 600)
  return new Promise((resolve, reject) => {
    output.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('封面生成失败'))), 'image/webp', 0.78)
  })
}
