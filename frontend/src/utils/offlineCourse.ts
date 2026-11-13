import type { CourseDetail } from '@/api/types'

const DB_NAME = 'sayline-offline'
const STORE = 'courses'

export interface OfflineCourse {
  id: number
  course: CourseDetail
  audio: Blob
  downloadedAt: string
  sizeBytes: number
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  return openDatabase().then((db) => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const request = action(tx.objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
    tx.onerror = () => reject(tx.error)
  }))
}

export async function downloadCourse(course: CourseDetail) {
  if (!course.audioUrl) throw new Error('该课时没有可下载的音频')
  const response = await fetch(course.audioUrl)
  if (!response.ok) throw new Error('音频下载失败')
  const audio = await response.blob()
  const record: OfflineCourse = {
    id: course.id,
    course,
    audio,
    downloadedAt: new Date().toISOString(),
    sizeBytes: audio.size,
  }
  await transaction('readwrite', (store) => store.put(record))
  return record
}

export function getOfflineCourse(id: number) {
  return transaction<OfflineCourse | undefined>('readonly', (store) => store.get(id))
}

export function listOfflineCourses() {
  return transaction<OfflineCourse[]>('readonly', (store) => store.getAll())
}

export function removeOfflineCourse(id: number) {
  return transaction<undefined>('readwrite', (store) => store.delete(id))
}

export async function storageEstimate() {
  if (!navigator.storage?.estimate) return { usage: 0, quota: 0 }
  const estimate = await navigator.storage.estimate()
  return { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 }
}
