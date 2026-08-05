import { INSTRUMENTING } from '@/lib/ui-constants'
import type { NodeState, NodeStatus } from '@/lib/sources/system-status'
import type { SystemNode, SystemEdge } from '@/content/system-map'

// Shared status presentation. Status is ALWAYS dot + word — never color-only (a11y).
export const STATUS_META: Record<NodeStatus, { word: string; color: string }> = {
  live: { word: 'live', color: 'var(--color-done)' },
  instrumenting: { word: 'instrumenting', color: 'var(--color-pending)' },
  planned: { word: 'planned', color: 'var(--color-ink-soft)' },
}

export function StatusBadge({ status }: { status: NodeStatus }) {
  const meta = STATUS_META[status]
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs">
      <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} aria-hidden />
      {meta.word}
    </span>
  )
}

/**
 * The reading pane for the selected node. aria-live="polite" so a screen reader announces the
 * detail when selection changes. Edge relationships are decorative in the SVG, so they are ALSO
 * stated here as text — the honest "what feeds what" without relying on the diagram.
 */
export function NodeDetail({
  node,
  state,
  nodes,
  edges,
}: {
  node: SystemNode
  state: NodeState
  nodes: SystemNode[]
  edges: SystemEdge[]
}) {
  const labelOf = (id: string) => nodes.find((n) => n.id === id)?.label ?? id
  const feeds = edges.filter((e) => e.from === node.id).map((e) => labelOf(e.to))
  const fedBy = edges.filter((e) => e.to === node.id).map((e) => labelOf(e.from))
  const isolated = feeds.length === 0 && fedBy.length === 0

  return (
    <div aria-live="polite" className="rounded-lg border border-edge bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{node.label}</h3>
        <StatusBadge status={state.status} />
      </div>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-ink-soft">{node.source}</p>

      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{node.blurb}</p>

      <div className="mt-4 border-t border-edge pt-3">
        {state.status === 'live' && state.metric ? (
          <p className="font-mono text-sm text-ink">{state.metric}</p>
        ) : state.status === 'planned' ? (
          <p className="font-mono text-xs text-ink-soft">— planned · not yet wired —</p>
        ) : (
          <p className="font-mono text-xs text-ink-soft">{INSTRUMENTING}</p>
        )}
      </div>

      <div className="mt-3 space-y-0.5 font-mono text-[11px] text-ink-soft">
        {isolated ? (
          <p>isolated — not yet connected</p>
        ) : (
          <>
            {fedBy.length > 0 ? <p>← fed by {fedBy.join(', ')}</p> : null}
            {feeds.length > 0 ? <p>→ feeds {feeds.join(', ')}</p> : null}
          </>
        )}
      </div>
    </div>
  )
}
