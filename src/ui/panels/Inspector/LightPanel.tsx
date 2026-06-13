import type { LightNode } from '../../../domain/nodes/SceneNode.ts'
import { useProjectStore } from '../../../state/useProjectStore.ts'
import { CheckField, ColorField, NumberField, SliderField } from './widgets.tsx'

export function LightPanel({ node }: { node: LightNode }) {
  const updateLight = useProjectStore((s) => s.updateLight)
  const light = node.light

  return (
    <div className="section">
      <h3>Свет — {light.type}</h3>
      <ColorField
        label="Цвет"
        value={light.color}
        onChange={(color) => updateLight(node.id, { color })}
      />
      <NumberField
        label="Интенсивн."
        value={light.intensity}
        step={0.1}
        onChange={(intensity) => updateLight(node.id, { intensity })}
      />
      {(light.type === 'point' || light.type === 'spot') && (
        <>
          <NumberField
            label="Дистанция"
            value={light.distance ?? 0}
            onChange={(distance) => updateLight(node.id, { distance })}
          />
          <NumberField
            label="Затухание"
            value={light.decay ?? 2}
            onChange={(decay) => updateLight(node.id, { decay })}
          />
        </>
      )}
      {light.type === 'spot' && (
        <>
          <SliderField
            label="Угол"
            value={light.angle ?? Math.PI / 6}
            min={0}
            max={Math.PI / 2}
            onChange={(angle) => updateLight(node.id, { angle })}
          />
          <SliderField
            label="Penumbra"
            value={light.penumbra ?? 0}
            onChange={(penumbra) => updateLight(node.id, { penumbra })}
          />
        </>
      )}
      {light.type === 'hemisphere' && (
        <ColorField
          label="Земля"
          value={light.groundColor ?? { r: 0.2, g: 0.2, b: 0.2 }}
          onChange={(groundColor) => updateLight(node.id, { groundColor })}
        />
      )}
      {(light.type === 'directional' || light.type === 'spot') && (
        <CheckField
          label="Тени"
          value={light.castShadow ?? false}
          onChange={(castShadow) => updateLight(node.id, { castShadow })}
        />
      )}
    </div>
  )
}
