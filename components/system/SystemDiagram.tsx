import { STATUS_META } from './NodeDetail'
import type { StatusMap } from '@/lib/sources/system-status'
import type { SystemNode, SystemEdge } from '@/content/system-map'

/**
 * The desktop diagram: one aria-hidden SVG drawing ONLY the edges, with real HTML <button>
 * nodes absolutely positioned on top at authored % coordinates. Not <foreignObject> — this
 * gives first-class DOM focus/keyboard/pointer behaviour and avoids foreignObject flakiness.
 * Edges are decorative (relationships are also stated as text in NodeDetail).
 */
export function SystemDiagram({
  nodes,
  edges,
  status,
  selectedId,
  onSelect,
}: {
  nodes: SystemNode[]
  edges: SystemEdge[]
  status: StatusMap
  selectedId: string
  onSelect: (id: string) => void
}) {
  const byId = (id: string) => nodes.find((n) => n.id === id)

  return (
    <div className="relative aspect-[16/10] w-full rounded-xl border border-edge bg-paper">
      {/* Edge layer — decorative. vector-effect keeps stroke width constant under non-uniform scale. */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        {edges.map((e) => {
          const a = byId(e.from)
          const b = byId(e.to)
          if (!a || !b) return null
          return (
            <line
              key={`${e.from}-${e.to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="var(--color-edge)"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
      </svg>

      {/* Node layer — real buttons. */}
      {nodes.map((n) => {
        const meta = STATUS_META[status[n.id]?.status ?? 'planned']
        const selected = n.id === selectedId
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => onSelect(n.id)}
            aria-pressed={selected}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-surface px-3 py-2 text-left shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${
              selected ? 'border-accent ring-2 ring-accent/30' : 'border-edge hover:border-ink-soft'
            }`}
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
          >
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: meta.color }} aria-hidden />
              <span className="text-xs font-medium leading-none">{n.label}</span>
            </span>
            <span className="mt-1 block font-mono text-[10px] leading-none text-ink-soft">{meta.word}</span>
          </button>
        )
      })}
    </div>
  )
}
