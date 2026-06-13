import { Toolbar } from '../panels/Toolbar.tsx'
import { SceneTree } from '../panels/SceneTree.tsx'
import { Inspector } from '../panels/Inspector/Inspector.tsx'
import { ProjectBar } from '../panels/ProjectBar.tsx'
import { ViewportCanvas } from '../viewport/ViewportCanvas.tsx'

export function EditorLayout() {
  return (
    <div className="editor">
      <Toolbar />
      <SceneTree />
      <ViewportCanvas />
      <Inspector />
      <ProjectBar />
    </div>
  )
}
