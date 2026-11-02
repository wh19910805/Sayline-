export type UploadKind = 'COVER' | 'AUDIO' | 'SUBTITLE'

const CONTENT_TYPES_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp3: 'audio/mpeg',
  m4a: 'audio/x-m4a',
  aac: 'audio/aac',
  srt: 'application/x-subrip',
  vtt: 'text/vtt',
}

export function resolveContentType(file: File, kind: UploadKind): string {
  if (file.type) return file.type
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return CONTENT_TYPES_BY_EXT[ext] ?? (kind === 'SUBTITLE' ? 'text/plain' : 'application/octet-stream')
}
