import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'

import { describe, expect, it } from 'vitest'

function loadServiceWorker() {
  const listeners: Record<string, (event: any) => void> = {}
  const cachePuts: string[] = []
  const cache = {
    put: async (request: { url: string }) => {
      cachePuts.push(request.url)
    },
    keys: async () => [],
    delete: async () => true,
  }
  const context = {
    self: {
      location: { origin: 'https://sayline.test' },
      addEventListener: (type: string, listener: (event: any) => void) => {
        listeners[type] = listener
      },
      skipWaiting: () => undefined,
      clients: { claim: () => undefined },
    },
    caches: {
      keys: async () => [],
      delete: async () => true,
      open: async () => cache,
      match: async () => undefined,
    },
    fetch: async () => ({
      ok: true,
      clone: () => ({ body: 'ok' }),
    }),
    URL,
    Promise,
    setTimeout,
    clearTimeout,
  }
  runInNewContext(
    readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8'),
    context,
  )
  return { listeners, cachePuts }
}

async function dispatchFetch(
  listeners: Record<string, (event: any) => void>,
  url: string,
) {
  let response: Promise<unknown> = Promise.resolve()
  listeners.fetch({
    request: { method: 'GET', url, mode: 'no-cors', destination: 'image' },
    respondWith: (value: Promise<unknown>) => {
      response = value
    },
  })
  await response
}

describe('service worker cache policy', () => {
  it('does not cache authenticated API responses', async () => {
    const { listeners, cachePuts } = loadServiceWorker()
    await dispatchFetch(listeners, 'https://sayline.test/api/v1/recent-lessons')
    expect(cachePuts).toEqual([])
  })

  it('caches static same-origin assets', async () => {
    const { listeners, cachePuts } = loadServiceWorker()
    await dispatchFetch(listeners, 'https://sayline.test/assets/app.js')
    expect(cachePuts).toEqual(['https://sayline.test/assets/app.js'])
  })
})
