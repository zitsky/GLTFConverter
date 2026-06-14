import type { TransformMode } from '../../engine/gizmos/TransformGizmo.ts'
import { SUB_OBJECT_MODES } from '../../engine/subobject/SubObjectMode.ts'
import { useEditorStore } from '../../state/useEditorStore.ts'

const TRANSFORM_MODES: TransformMode[] = ['translate', 'rotate', 'scale']
const MODE_LABEL: Record<TransformMode, string> = {
  translate: 'Move',
  rotate: 'Rotate',
  scale: 'Scale',
}

/** Slim strip of stateful tool toggles; commands live in the menu bar. */
export function Toolbar() {
  const transformMode = useEditorStore((s) => s.transformMode)
  const setTransformMode = useEditorStore((s) => s.setTransformMode)
  const subObjectMode = useEditorStore((s) => s.subObjectMode)
  const setSubObjectMode = useEditorStore((s) => s.setSubObjectMode)

  return (
    <div className="toolbar">
      <div className="group">
        {TRANSFORM_MODES.map((mode) => (
          <button
            key={mode}
            className={transformMode === mode ? 'active' : ''}
            onClick={() => setTransformMode(mode)}
          >
            {MODE_LABEL[mode]}
          </button>
        ))}
      </div>

      <div className="group">
        {SUB_OBJECT_MODES.map((mode) => (
          <button
            key={mode}
            className={subObjectMode === mode ? 'active' : ''}
            onClick={() => setSubObjectMode(mode)}
            title="Sub-object режим"
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  )
}
