import { MenuBar } from '../panels/MenuBar.tsx'
import { Toolbar } from '../panels/Toolbar.tsx'
import { SceneTree } from '../panels/SceneTree.tsx'
import { Inspector } from '../panels/Inspector/Inspector.tsx'
import { ViewportCanvas } from '../viewport/ViewportCanvas.tsx'

export function EditorLayout() {
  return (
    <div className="editor">
      <MenuBar />
      <Toolbar />
      <SceneTree />
      <ViewportCanvas />
      <Inspector />
    </div>
  )
}
