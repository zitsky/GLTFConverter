import { useState } from 'react'
import { isMeshNode } from '../../domain/nodes/SceneNode.ts'
import type { TransformMode } from '../../engine/gizmos/TransformGizmo.ts'
import { SUB_OBJECT_MODES } from '../../engine/subobject/SubObjectMode.ts'
import type { SubObjectMode } from '../../engine/subobject/SubObjectMode.ts'
import { useEditorStore } from '../../state/useEditorStore.ts'
import { useProjectStore } from '../../state/useProjectStore.ts'
import { Icon } from '../icons/Icon.tsx'
import type { IconName } from '../icons/Icon.tsx'
import { UVEditorModal } from './UVEditorModal.tsx'

const TRANSFORM_MODES: { mode: TransformMode; icon: IconName; label: string }[] = [
  { mode: 'translate', icon: 'move', label: 'Перемещение (W)' },
  { mode: 'rotate', icon: 'rotate', label: 'Поворот (E)' },
  { mode: 'scale', icon: 'scale', label: 'Масштаб (R)' },
]

const SUB_LABEL: Record<SubObjectMode, { icon: IconName; label: string }> = {
  object: { icon: 'object', label: 'Объект' },
  vertex: { icon: 'vertex', label: 'Вершины' },
  edge: { icon: 'edge', label: 'Рёбра' },
  polygon: { icon: 'polygon', label: 'Полигоны' },
}

/** Slim strip of flat icon tool toggles; commands live in the menu bar. */
export function Toolbar() {
  const transformMode = useEditorStore((s) => s.transformMode)
  const setTransformMode = useEditorStore((s) => s.setTransformMode)
  const subObjectMode = useEditorStore((s) => s.subObjectMode)
  const setSubObjectMode = useEditorStore((s) => s.setSubObjectMode)

  const selectedId = useEditorStore((s) => s.selectedId)
  const node = useProjectStore((s) => (selectedId ? s.project.scene.nodes[selectedId] : undefined))
  const isMesh = node ? isMeshNode(node) : false
  const [uvOpen, setUvOpen] = useState(false)

  return (
    <div className="toolbar">
      <div className="group">
        {TRANSFORM_MODES.map(({ mode, icon, label }) => (
          <button
            key={mode}
            className={`icon-btn${transformMode === mode ? ' active' : ''}`}
            onClick={() => setTransformMode(mode)}
            title={label}
          >
            <Icon name={icon} />
          </button>
        ))}
      </div>

      <div className="group">
        {SUB_OBJECT_MODES.map((mode) => (
          <button
            key={mode}
            className={`icon-btn${subObjectMode === mode ? ' active' : ''}`}
            onClick={() => setSubObjectMode(mode)}
            title={SUB_LABEL[mode].label}
          >
            <Icon name={SUB_LABEL[mode].icon} />
          </button>
        ))}
      </div>

      <div className="group">
        <button
          className="uv-launch"
          disabled={!isMesh}
          title={isMesh ? 'Открыть редактор UV-развёртки' : 'Выберите меш'}
          onClick={() => setUvOpen(true)}
        >
          <Icon name="image" size={16} />
          UV-развёртка
        </button>
      </div>

      {uvOpen && <UVEditorModal onClose={() => setUvOpen(false)} />}
    </div>
  )
}
