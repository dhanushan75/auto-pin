import type { McpToolResult, Register } from 'claude-code'

const IDLE_MS = 14 * 60 * 60 * 1000
const SWEEP_MS = 60 * 60 * 1000
// Sessions this mod pinned. Pins you make yourself are never in here, so never auto-unpinned.
const KEY = 'autoPinned'

type Row = { sessionId: string; pinned?: boolean; isRunning?: boolean; lastActivityAt?: string }

const json = (r: McpToolResult) => JSON.parse(r.content.find((c) => c.text)?.text ?? 'null')

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    const r = await next(e)

    const mine = async () => ((await $.store.get(KEY)) as string[] | undefined) ?? []
    const pin = (id: string, pinned: boolean) =>
      $.mcp.call('ccd_sidebar', 'set_pinned', { session_id: id, pinned })

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
        if (!s.pinned) continue // you unpinned it: forget it
        const idle = !s.isRunning && now - Date.parse(s.lastActivityAt ?? '') > IDLE_MS
        if (idle && !(await pin(id, false)).isError) continue
        keep.push(id)
      }
      await $.store.set(KEY, keep)
    }

    void (async () => {
      const self: Row = json(await $.mcp.call('ccd_session_mgmt', 'get_session', { session_id: 'self' }))
      if (!self.pinned && !(await pin('self', true)).isError) {
        const ids = await mine()
        if (!ids.includes(self.sessionId)) await $.store.set(KEY, [...ids, self.sessionId])
      }
      await sweep()
      $.clock.every(SWEEP_MS, () => void sweep().catch(() => {}))
    })().catch(() => {}) // no ccd servers (CLI, SDK): do nothing

    return r
  })
}
