import { nextTick, onBeforeUnmount, type Ref } from 'vue'

export function useScrollMemory(
  element: Ref<HTMLElement | null>,
  storageKey: () => string,
) {
  const key = () => `sayline:scroll:${storageKey()}`
  let frame = 0

  function save() {
    if (!element.value) return
    sessionStorage.setItem(key(), String(element.value.scrollTop))
  }

  function onScroll() {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      save()
    })
  }

  function attach() {
    element.value?.addEventListener('scroll', onScroll, { passive: true })
  }

  async function restore() {
    await nextTick()
    const container = element.value
    if (!container) return
    const value = Number(sessionStorage.getItem(key()) ?? 0)
    if (Number.isFinite(value) && value > 0) {
      container.scrollTop = value
    }
  }

  onBeforeUnmount(() => {
    if (frame) cancelAnimationFrame(frame)
    save()
    element.value?.removeEventListener('scroll', onScroll)
  })

  return { attach, restore, save }
}
