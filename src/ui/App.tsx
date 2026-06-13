import { useEffect } from 'react'
import { useEditorStore } from '../state/useEditorStore.ts'
import { useEngineStore } from '../state/useEngineStore.ts'
import { useProjectStore } from '../state/useProjectStore.ts'
import { EditorLayout } from './layout/EditorLayout.tsx'

export function App() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT') return

      const project = useProjectStore.getState()
      const editor = useEditorStore.getState()

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        useEngineStore.getState().engine?.invalidateGeometryCache()
        if (e.shiftKey) project.redo()
        else project.undo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        useEngineStore.getState().engine?.invalidateGeometryCache()
        project.redo()
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && editor.selectedId) {
        project.removeNode(editor.selectedId)
        editor.select(null)
      } else if (e.key === 'f' || e.key === 'F') {
        useEngineStore.getState().engine?.focusSelected()
      } else if (e.key === 'w') editor.setTransformMode('translate')
      else if (e.key === 'e') editor.setTransformMode('rotate')
      else if (e.key === 'r') editor.setTransformMode('scale')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return <EditorLayout />
}
