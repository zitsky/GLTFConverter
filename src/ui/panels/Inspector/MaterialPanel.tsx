import { createDefaultMaterial } from '../../../domain/assets/MaterialAsset.ts'
import type { MeshNode } from '../../../domain/nodes/SceneNode.ts'
import { useProjectStore } from '../../../state/useProjectStore.ts'
import { MaterialCard } from './MaterialCard.tsx'

export function MaterialPanel({ node }: { node: MeshNode }) {
  const materials = useProjectStore((s) => s.project.assets.materials)
  const addMaterialSlot = useProjectStore((s) => s.addMaterialSlot)
  const addMaterial = useProjectStore((s) => s.addMaterial)

  const addSlot = () => {
    const mat = createDefaultMaterial(`Material ${node.materialIds.length + 1}`)
    addMaterial(mat)
    addMaterialSlot(node.id, mat.id)
  }

  return (
    <div className="section">
      <h3>Материалы ({node.materialIds.length})</h3>
      {node.materialIds.map((id, slot) => {
        const material = materials[id]
        if (!material) return null
        return <MaterialCard key={`${id}-${slot}`} material={material} />
      })}
      <button onClick={addSlot}>+ слот материала</button>
    </div>
  )
}
