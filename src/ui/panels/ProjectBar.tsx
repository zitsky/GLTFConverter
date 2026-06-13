import { useEffect, useState } from 'react'
import { ProjectRepository } from '../../infrastructure/persistence/ProjectRepository.ts'
import type { ProjectSummary } from '../../infrastructure/persistence/ProjectRepository.ts'
import { useEditorStore } from '../../state/useEditorStore.ts'
import { useProjectStore } from '../../state/useProjectStore.ts'

export function ProjectBar() {
  const project = useProjectStore((s) => s.project)
  const setProject = useProjectStore((s) => s.setProject)
  const newProject = useProjectStore((s) => s.newProject)
  const setProjectName = useProjectStore((s) => s.setProjectName)
  const status = useEditorStore((s) => s.status)
  const busy = useEditorStore((s) => s.busy)
  const setStatus = useEditorStore((s) => s.setStatus)
  const select = useEditorStore((s) => s.select)

  const [list, setList] = useState<ProjectSummary[]>([])

  const refresh = () => ProjectRepository.list().then(setList)
  useEffect(() => {
    void refresh()
  }, [])

  // Debounced autosave whenever the project changes.
  useEffect(() => {
    const handle = setTimeout(() => {
      void ProjectRepository.save(project).then(refresh)
    }, 1500)
    return () => clearTimeout(handle)
  }, [project])

  const save = async () => {
    await ProjectRepository.save(project)
    await refresh()
    setStatus('Проект сохранён')
  }

  const open = async (id: string) => {
    if (!id) return
    const loaded = await ProjectRepository.load(id)
    if (loaded) {
      select(null)
      setProject(loaded)
      setStatus(`Открыт «${loaded.meta.name}»`)
    }
  }

  const remove = async () => {
    await ProjectRepository.remove(project.meta.id)
    await refresh()
    setStatus('Проект удалён')
  }

  return (
    <div className="projects">
      <strong>Проект:</strong>
      <input
        style={{ width: 160 }}
        value={project.meta.name}
        onChange={(e) => setProjectName(e.target.value)}
      />
      <button onClick={() => { select(null); newProject() }}>Новый</button>
      <button onClick={() => void save()}>Сохранить</button>
      <button onClick={() => void remove()}>Удалить</button>
      <select value="" onChange={(e) => void open(e.target.value)}>
        <option value="">Открыть…</option>
        {list.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} — {new Date(p.updatedAt).toLocaleString('ru')}
          </option>
        ))}
      </select>
      <span className="spacer" style={{ flex: 1 }} />
      <span className="status">{busy ? '⏳ ' : ''}{status}</span>
    </div>
  )
}
