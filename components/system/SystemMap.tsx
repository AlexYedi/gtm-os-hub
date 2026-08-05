'use client'

import { useState } from 'react'
import { SystemDiagram } from './SystemDiagram'
import { MobileSystemList } from './MobileSystemList'
import { NodeDetail } from './NodeDetail'
import { EDGES } from '@/content/system-map'
import type { SystemNode } from '@/content/system-map'
import type { StatusMap } from '@/lib/sources/system-status'

/**
 * Client island for the Living System Map. Owns exactly one piece of state: the selected node
 * id. It does NO fetching — the server page assembles + gates the data and passes it in as
 * serializable props. Desktop shows the SVG diagram; < md swaps to a stacked list (CSS only,
 * both rendered, no viewport measuring → SSR-safe). NodeDetail is shared below both.
 */
export function SystemMap({ nodes, status }: { nodes: SystemNode[]; status: StatusMap }) {
  const [selectedId, setSelectedId] = useState<string>(nodes[0]?.id ?? '')
  const selected = nodes.find((n) => n.id === selectedId) ?? nodes[0]
  if (!selected) return null

  return (
    <div className="grid gap-6 md:grid-cols-[3fr_2fr]">
      <div>
        <div className="hidden md:block">
          <SystemDiagram
            nodes={nodes}
            edges={EDGES}
            status={status}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        <div className="md:hidden">
          <MobileSystemList nodes={nodes} status={status} selectedId={selectedId} onSelect={setSelectedId} />
        </div>
      </div>

      <NodeDetail node={selected} state={status[selected.id]} nodes={nodes} edges={EDGES} />
    </div>
  )
}
