import type { McpToolResult, Register } from 'claude-code'

const SWEEP_MS = 60 * 60 * 1000
const TICK_MS = 30 * 1000
// Sessions this mod pinned. Pins you make yourself are never in here, so never auto-unpinned.
const KEY = 'autoPinned'

type Row = { sessionId: string; pinned?: boolean; isRunning?: boolean; lastActivityAt?: string }

const json = (r: McpToolResult) => {
  if (r.isError) throw new Error(r.content.find((c) => c.text)?.text ?? 'MCP error')
  return JSON.parse(r.content.find((c) => c.text)?.text ?? 'null')
}

export const register: Register = (on, options) => {
  const idleHours = Number(options.idleHours ?? 14)
  const IDLE_MS = idleHours * 60 * 60 * 1000

  on('session.start', async ($, e, next) => {
    const r = await next(e)

    const mine = async () => ((await $.store.get(KEY)) as string[] | undefined) ?? []
    const pin = (id: string, pinned: boolean) =>
      $.mcp.call('ccd_sidebar', 'set_pinned', { session_id: id, pinned })

    // The app's reported `pinned` lags behind the sidebar, so trust set_pinned's own reply instead.
    const pinSelf = async () => {
      const self: Row = json(await $.mcp.call('ccd_session_mgmt', 'get_session', { session_id: 'self' }))
      const res = await pin('self', true)
      if (res.isError) throw new Error('set_pinned failed')
      if (/already/i.test(res.content.find((c) => c.text)?.text ?? '')) return // pinned before: yours, or ours from an earlier start
      const ids = await mine()
      if (!ids.includes(self.sessionId)) await $.store.set(KEY, [...ids, self.sessionId])
    }

    // ponytail: read-modify-write on the store, two sessions sweeping at once can drop an id; the cost is one pin that never auto-unpins
    const sweep = async () => {
      const ids = await mine()
      if (!ids.length) return
      const rows: Row[] = json(await $.mcp.call('ccd_session_mgmt', 'list_sessions', { limit: 200 })) ?? []
      const byId = new Map(rows.map((s) => [s.sessionId, s]))
      const now = await $.clock.now()
      const keep: string[] = []
      for (const id of ids) {
        const s = byId.get(id)
        if (!s) { keep.push(id); continue } // this session (the list leaves it out), or not listed
        // No `pinned` check: it lags. Unpinning one you already unpinned is a harmless no-op.
        const idle = !s.isRunning && now - Date.parse(s.lastActivityAt ?? '') > IDLE_MS
        if (idle && !(await pin(id, false)).isError) continue
        keep.push(id)
      }
      await $.store.set(KEY, keep)
    }

    // The app's tools may not be connected the instant a session starts, so retry on a timer
    // until the self-pin goes through; no ccd servers at all (CLI, SDK) just keeps failing quietly.
    let selfDone = false
    let lastSweep = 0
    const tick = async () => {
      if (!selfDone) { await pinSelf(); selfDone = true }
      const now = await $.clock.now()
      if (idleHours > 0 && now - lastSweep >= SWEEP_MS) { await sweep(); lastSweep = now }
    }
    $.clock.after(2000, () => void tick().catch(() => {}))
    $.clock.every(TICK_MS, () => void tick().catch(() => {}))

    return r
  })
}
