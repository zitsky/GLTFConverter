import type { MaterialAsset, TextureSlot } from '../../../domain/assets/MaterialAsset.ts'
import { TEXTURE_SLOTS } from '../../../domain/assets/MaterialAsset.ts'
import { createDefaultMaterial } from '../../../domain/assets/MaterialAsset.ts'
import type { MeshNode } from '../../../domain/nodes/SceneNode.ts'
import { newAssetId } from '../../../domain/scene/ids.ts'
import type { AssetId } from '../../../domain/scene/ids.ts'
import { readFileAsDataUrl } from '../../../infrastructure/files/fileRead.ts'
import { useProjectStore } from '../../../state/useProjectStore.ts'
import { CheckField, ColorField, NumberField, SliderField } from './widgets.tsx'

const COLOR_SLOTS = new Set<TextureSlot>(['map', 'emissiveMap'])

export function MaterialPanel({ node }: { node: MeshNode }) {
  const materials = useProjectStore((s) => s.project.assets.materials)
  const textures = useProjectStore((s) => s.project.assets.textures)
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
        return (
          <MaterialCard
            key={`${id}-${slot}`}
            material={material}
            textureNameOf={(texId) => textures[texId]?.name}
          />
        )
      })}
      <button onClick={addSlot}>+ слот материала</button>
    </div>
  )
}

function MaterialCard(props: {
  material: MaterialAsset
  textureNameOf: (id: AssetId) => string | undefined
}) {
  const { material } = props
  const update = useProjectStore((s) => s.updateMaterial)
  const addTexture = useProjectStore((s) => s.addTexture)
  const setMaterialTexture = useProjectStore((s) => s.setMaterialTexture)

  const onUpload = async (slot: TextureSlot, file: File) => {
    const url = await readFileAsDataUrl(file)
    const id = newAssetId()
    addTexture({
      id,
      name: file.name,
      url,
      wrapS: 'repeat',
      wrapT: 'repeat',
      flipY: true,
      colorSpace: COLOR_SLOTS.has(slot) ? 'srgb' : 'linear',
      repeat: { x: 1, y: 1 },
      offset: { x: 0, y: 0 },
    })
    setMaterialTexture(material.id, slot, id)
  }

  return (
    <div className="material-card">
      <div className="field">
        <label>Имя</label>
        <input
          value={material.name}
          onChange={(e) => update(material.id, { name: e.target.value })}
        />
      </div>
      <div className="field">
        <label>Тип</label>
        <select
          value={material.type}
          onChange={(e) =>
            update(material.id, { type: e.target.value as MaterialAsset['type'] })
          }
        >
          <option value="standard">standard</option>
          <option value="physical">physical</option>
          <option value="basic">basic</option>
        </select>
      </div>
      <ColorField
        label="Цвет"
        value={material.color}
        onChange={(color) => update(material.id, { color })}
      />
      <SliderField
        label="Roughness"
        value={material.roughness}
        onChange={(roughness) => update(material.id, { roughness })}
      />
      <SliderField
        label="Metalness"
        value={material.metalness}
        onChange={(metalness) => update(material.id, { metalness })}
      />
      <ColorField
        label="Emissive"
        value={material.emissive}
        onChange={(emissive) => update(material.id, { emissive })}
      />
      <NumberField
        label="Emissive ×"
        value={material.emissiveIntensity}
        onChange={(emissiveIntensity) => update(material.id, { emissiveIntensity })}
      />
      <SliderField
        label="Opacity"
        value={material.opacity}
        onChange={(opacity) =>
          update(material.id, { opacity, transparent: opacity < 1 })
        }
      />
      <div className="field">
        <label>Сторона</label>
        <select
          value={material.side}
          onChange={(e) =>
            update(material.id, { side: e.target.value as MaterialAsset['side'] })
          }
        >
          <option value="front">front</option>
          <option value="back">back</option>
          <option value="double">double</option>
        </select>
      </div>
      <CheckField
        label="Wireframe"
        value={material.wireframe}
        onChange={(wireframe) => update(material.id, { wireframe })}
      />
      <CheckField
        label="Flat shading"
        value={material.flatShading}
        onChange={(flatShading) => update(material.id, { flatShading })}
      />

      <h3 style={{ marginTop: 10 }}>Текстуры</h3>
      {TEXTURE_SLOTS.map((slot) => {
        const texId = material[slot]
        return (
          <div className="field" key={slot}>
            <label>{slot}</label>
            <div className="swatch-row">
              <label className="upload-btn">
                <button
                  type="button"
                  onClick={(e) =>
                    (e.currentTarget.nextElementSibling as HTMLInputElement)?.click()
                  }
                >
                  {texId ? props.textureNameOf(texId) ?? 'texture' : 'выбрать…'}
                </button>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void onUpload(slot, f)
                    e.target.value = ''
                  }}
                />
              </label>
              {texId && (
                <button onClick={() => setMaterialTexture(material.id, slot, undefined)}>
                  ✕
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
