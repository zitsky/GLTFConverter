import { ProjectRepository } from '../infrastructure/persistence/ProjectRepository.ts'
import { useEngineStore } from '../state/useEngineStore.ts'
import { useProjectStore } from '../state/useProjectStore.ts'

/** Saves the current project to IndexedDB with a fresh scene thumbnail. */
export const saveCurrentProject = async (): Promise<void> => {
  const { project, markSaved } = useProjectStore.getState()
  const thumb = useEngineStore.getState().engine?.captureThumbnail()
  await ProjectRepository.save(project, thumb)
  markSaved()
}
