import { useRef } from 'react'
import { importAccept, importFile } from '../../application/import/ImportService.ts'
import {
  exportScene,
  suggestedFormat,
} from '../../application/export/ExportService.ts'
import type { ExportFormat } from '../../application/export/ExportService.ts'
import {
  createLightFragment,
  createPrimitiveFragment,
} from '../../application/scene/factory.ts'
import type { PrimitiveKind } from '../../application/scene/factory.ts'
import type { LightType } from '../../domain/nodes/lights.ts'
import type { SceneFragment } from '../../domain/project/SceneFragment.ts'
import type { TransformMode } from '../../engine/gizmos/TransformGizmo.ts'
import { SUB_OBJECT_MODES } from '../../engine/subobject/SubObjectMode.ts'
import { useEditorStore } from '../../state/useEditorStore.ts'
import { useEngineStore } from '../../state/useEngineStore.ts'
import { useProjectStore } from '../../state/useProjectStore.ts'

const TRANSFORM_MODES: TransformMode[] = ['translate', 'rotate', 'scale']
const MODE_LABEL: Record<TransformMode, string> = {
  translate: 'Move',
  rotate: 'Rotate',
  scale: 'Scale',
}
const PRIMITIVES: PrimitiveKind[] = ['box', 'sphere', 'cylinder', 'plane', 'torus']
const LIGHTS: LightType[] = ['directional', 'point', 'spot', 'ambient', 'hemisphere']

export function Toolbar() {
  const fileRef = useRef<HTMLInputElement>(null)
  const mergeFragment = useProjectStore((s) => s.mergeFragment)
  const undo = useProjectStore((s) => s.undo)
  const redo = useProjectStore((s) => s.redo)
  const canUndo = useProjectStore((s) => s.past.length > 0)
  const canRedo = useProjectStore((s) => s.future.length > 0)

  const transformMode = useEditorStore((s) => s.transformMode)
  const setTransformMode = useEditorStore((s) => s.setTransformMode)
  const subObjectMode = useEditorStore((s) => s.subObjectMode)
  const setSubObjectMode = useEditorStore((s) => s.setSubObjectMode)
  const select = useEditorStore((s) => s.select)
  const setStatus = useEditorStore((s) => s.setStatus)
  const setBusy = useEditorStore((s) => s.setBusy)

  const addFragment = (fragment: SceneFragment) => {
    mergeFragment(fragment)
    const firstRoot = fragment.rootIds[0]
    if (firstRoot) {
      select(firstRoot)
      requestAnimationFrame(() => useEngineStore.getState().engine?.focusSelected())
    }
  }

  const onImport = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setBusy(true)
    try {
      for (const file of Array.from(files)) {
        setStatus(`Импорт «${file.name}»…`)
        const fragment = await importFile(file)
        addFragment(fragment)
      }
      setStatus('Импорт завершён')
    } catch (err) {
      console.error(err)
      setStatus(err instanceof Error ? err.message : 'Ошибка импорта')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const onExport = async (format: ExportFormat) => {
    const engine = useEngineStore.getState().engine
    if (!engine) return
    const project = useProjectStore.getState().project
    setBusy(true)
    setStatus('Экспорт…')
    try {
      const result = await exportScene(engine.getExportRoot(), project.meta.name, format)
      setStatus(`Сохранено: ${result.filename} (${result.kind})`)
    } catch (err) {
      console.error(err)
      setStatus(err instanceof Error ? err.message : 'Ошибка экспорта')
    } finally {
      setBusy(false)
    }
  }

  const handleUndo = () => {
    useEngineStore.getState().engine?.invalidateGeometryCache()
    undo()
  }
  const handleRedo = () => {
    useEngineStore.getState().engine?.invalidateGeometryCache()
    redo()
  }

  const project = useProjectStore((s) => s.project)
  const smartFormat = suggestedFormat(project)

  return (
    <div className="toolbar">
      <input
        ref={fileRef}
        type="file"
        accept={importAccept}
        multiple
        hidden
        onChange={(e) => onImport(e.target.files)}
      />

      <div className="group">
        <button className="primary" onClick={() => fileRef.current?.click()}>
          Импорт
        </button>
        <button
          className={smartFormat === 'glb' ? 'active' : ''}
          onClick={() => onExport('glb')}
          title="GLB с встроенными текстурами"
        >
          Экспорт GLB
        </button>
        <button
          className={smartFormat === 'gltf' ? 'active' : ''}
          onClick={() => onExport('gltf')}
          title="GLTF (zip, если есть текстуры)"
        >
          Экспорт GLTF
        </button>
      </div>

      <div className="group">
        <button disabled={!canUndo} onClick={handleUndo}>
          ↶ Undo
        </button>
        <button disabled={!canRedo} onClick={handleRedo}>
          ↷ Redo
        </button>
      </div>

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

      <div className="group">
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) addFragment(createPrimitiveFragment(e.target.value as PrimitiveKind))
            e.target.value = ''
          }}
        >
          <option value="">+ Примитив</option>
          {PRIMITIVES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) addFragment(createLightFragment(e.target.value as LightType))
            e.target.value = ''
          }}
        >
          <option value="">+ Свет</option>
          {LIGHTS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <button onClick={() => useEngineStore.getState().engine?.focusSelected()}>
        Фокус
      </button>
    </div>
  )
}
