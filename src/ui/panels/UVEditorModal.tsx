import { useEffect, useState } from 'react'
import { isMeshNode } from '../../domain/nodes/SceneNode.ts'
import { useEditorStore } from '../../state/useEditorStore.ts'
import { useProjectStore } from '../../state/useProjectStore.ts'
import { Icon } from '../icons/Icon.tsx'
import { MeshPreview } from './MeshPreview.tsx'
import { UVCanvas } from './UVCanvas.tsx'

/** Large UV workspace: live model preview beside the full UV editor. */
export function UVEditorModal({ onClose }: { onClose: () => void }) {
  const selectedId = useEditorStore((s) => s.selectedId)
  const node = useProjectStore((s) => (selectedId ? s.project.scene.nodes[selectedId] : undefined))
  const mesh = node && isMeshNode(node) ? node : null
  const [showChecker, setShowChecker] = useState(false)

  const setUvSelection = useEditorStore((s) => s.setUvSelection)
  // Clear the UV selection only when the modal opens / closes. Must NOT depend on
  // onClose: the parent passes a fresh arrow each render, so re-running this on
  // every re-render (e.g. after a UV edit commits) would wipe the selection.
  useEffect(() => {
    setUvSelection([])
    return () => setUvSelection([])
  }, [setUvSelection])

  // Escape closes; kept separate so an unstable onClose can't trigger the reset.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal uv-modal" onClick={(e) => e.stopPropagation()}>
        <div className="uv-modal-head">
          <h2>Редактор UV-развёртки{mesh ? ` — ${mesh.name}` : ''}</h2>
          <button onClick={onClose}>Закрыть</button>
        </div>
        {mesh ? (
          <div className="uv-modal-body">
            <div className="uv-modal-preview">
              <div className="uv-preview-head">
                <span className="set-label">Модель</span>
                <button
                  className={`icon-btn${showChecker ? ' active' : ''}`}
                  onClick={() => setShowChecker((v) => !v)}
                  title="UV-шахматка"
                  aria-pressed={showChecker}
                >
                  <Icon name="checker" />
                </button>
              </div>
              <MeshPreview node={mesh} showChecker={showChecker} />
            </div>
            <div className="uv-modal-canvas">
              <UVCanvas />
            </div>
          </div>
        ) : (
          <p className="hint">Выберите меш в сцене, чтобы открыть его развёртку.</p>
        )}
      </div>
    </div>
  )
}
