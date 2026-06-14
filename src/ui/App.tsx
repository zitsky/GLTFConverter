import { useEffect } from 'react'
import { ProjectRepository } from '../infrastructure/persistence/ProjectRepository.ts'
import { useEditorStore } from '../state/useEditorStore.ts'
import { useEngineStore } from '../state/useEngineStore.ts'
import { useProjectStore } from '../state/useProjectStore.ts'
import { EditorLayout } from './layout/EditorLayout.tsx'

export function App() {
  const project = useProjectStore((s) => s.project)

  // Debounced autosave to IndexedDB whenever the project changes.
  useEffect(() => {
    const handle = setTimeout(() => void ProjectRepository.save(project), 1500)
    return () => clearTimeout(handle)
  }, [project])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing = target.tagName === 'INPUT' || target.tagName === 'SELECT'

      const projectStore = useProjectStore.getState()
      const editor = useEditorStore.getState()
      const key = e.key.toLowerCase()

      if ((e.ctrlKey || e.metaKey) && key === 's') {
        e.preventDefault()
        void ProjectRepository.save(useProjectStore.getState().project)
        editor.setStatus('Проект сохранён')
        return
      }
      if ((e.ctrlKey || e.metaKey) && key === 'n') {
        e.preventDefault()
        editor.select(null)
        projectStore.newProject()
        return
      }
      if ((e.ctrlKey || e.metaKey) && key === 'z') {
        e.preventDefault()
        useEngineStore.getState().engine?.invalidateGeometryCache()
        if (e.shiftKey) projectStore.redo()
        else projectStore.undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && key === 'y') {
        e.preventDefault()
        useEngineStore.getState().engine?.invalidateGeometryCache()
        projectStore.redo()
        return
      }

      if (typing) return

      if ((e.key === 'Delete' || e.key === 'Backspace') && editor.selectedId) {
        projectStore.removeNode(editor.selectedId)
        editor.select(null)
      } else if (key === 'f') {
        useEngineStore.getState().engine?.focusSelected()
      } else if (key === 'w') editor.setTransformMode('translate')
      else if (key === 'e') editor.setTransformMode('rotate')
      else if (key === 'r') editor.setTransformMode('scale')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return <EditorLayout />
}
