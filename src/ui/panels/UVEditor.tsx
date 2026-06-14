import { useState } from 'react'
import { isMeshNode } from '../../domain/nodes/SceneNode.ts'
import { useEditorStore } from '../../state/useEditorStore.ts'
import { useProjectStore } from '../../state/useProjectStore.ts'
import { UVEditorModal } from './UVEditorModal.tsx'

/** Docked launcher for the large popup UV editor. */
export function UVEditor() {
  const [open, setOpen] = useState(false)
  const selectedId = useEditorStore((s) => s.selectedId)
  const node = useProjectStore((s) => (selectedId ? s.project.scene.nodes[selectedId] : undefined))
  const isMesh = node ? isMeshNode(node) : false

  return (
    <div>
      <button className="primary" disabled={!isMesh} onClick={() => setOpen(true)}>
        Открыть редактор UV…
      </button>
      {!isMesh && <p className="hint">Выберите меш, чтобы редактировать его UV-развёртку.</p>}
      {open && <UVEditorModal onClose={() => setOpen(false)} />}
    </div>
  )
}
