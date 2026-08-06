import { STATUS_META } from './NodeDetail'
import type { StatusMap } from '@/lib/sources/system-status'
import type { SystemNode } from '@/content/system-map'

/**
 * The < md fallback: the same node data as a stacked, semantic list of real buttons — no SVG
 * lines (so the page body never scrolls horizontally on a phone). Selecting a row drives the
 * same shared NodeDetail as the desktop diagram.
 */
export function MobileSystemList({
  nodes,
  status,
  selectedId,
  onSelect,
}: {
  nodes: SystemNode[]
  status: StatusMap
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <ul className="space-y-2">
      {nodes.map((n) => {
        const meta = STATUS_META[status[n.id]?.status ?? 'planned']
        const selected = n.id === selectedId
        return (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => onSelect(n.id)}
              aria-pressed={selected}
              className={`flex w-full items-center gap-2 rounded-lg border bg-surface px-3 py-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
                selected ? 'border-accent ring-2 ring-accent/30' : 'border-edge'
              }`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: meta.color }} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium leading-snug">{n.label}</span>
                <span className="block font-mono text-[11px] text-ink-soft">{n.source}</span>
              </span>
              <span className="shrink-0 font-mono text-[11px] text-ink-soft">{meta.word}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
