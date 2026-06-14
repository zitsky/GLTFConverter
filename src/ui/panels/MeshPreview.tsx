import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { MeshNode } from '../../domain/nodes/SceneNode.ts'
import { AssetFactory } from '../../engine/asset/AssetFactory.ts'
import { useEditorStore } from '../../state/useEditorStore.ts'
import { useProjectStore } from '../../state/useProjectStore.ts'

/** Self-contained interactive 3D preview of one mesh, with its material/texture. */
export function MeshPreview({ node }: { node: MeshNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const assets = useProjectStore((s) => s.project.assets)
  const geometry = assets.geometries[node.geometryId]

  useEffect(() => {
    const container = ref.current
    if (!container) return

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    const dir = new THREE.DirectionalLight(0xffffff, 2)
    dir.position.set(3, 5, 4)
    scene.add(dir)

    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    const factory = new AssetFactory(assets)
    const mesh = new THREE.Mesh(
      factory.getGeometry(node.geometryId),
      factory.buildMaterials(node.materialIds),
    )
    scene.add(mesh)

    // Frame the mesh.
    const sphere = new THREE.Box3()
      .setFromObject(mesh)
      .getBoundingSphere(new THREE.Sphere())
    const dist = (sphere.radius || 1) / Math.sin((45 * Math.PI) / 360) + sphere.radius
    controls.target.copy(sphere.center)
    camera.position
      .copy(sphere.center)
      .add(new THREE.Vector3(1, 0.7, 1).normalize().multiplyScalar(dist))

    // Click a face on the model to select its UV vertices in the editor.
    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const down = { x: 0, y: 0 }
    const onDown = (e: PointerEvent) => {
      down.x = e.clientX
      down.y = e.clientY
    }
    const onUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return
      const rect = renderer.domElement.getBoundingClientRect()
      ndc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(ndc, camera)
      const hit = raycaster.intersectObject(mesh, false)[0]
      if (!hit?.face) return
      const { a, b, c } = hit.face
      const store = useEditorStore.getState()
      const base = e.shiftKey ? store.uvSelection : []
      store.setUvSelection([...new Set([...base, a, b, c])])
    }
    renderer.domElement.addEventListener('pointerdown', onDown)
    renderer.domElement.addEventListener('pointerup', onUp)

    const resize = () => {
      const w = container.clientWidth || 1
      const h = container.clientHeight || 1
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    let raf = 0
    const loop = () => {
      raf = requestAnimationFrame(loop)
      controls.update()
      renderer.render(scene, camera)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('pointerup', onUp)
      ro.disconnect()
      controls.dispose()
      factory.dispose()
      pmrem.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
    // Rebuild when the mesh or its geometry (e.g. UV edits) changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, geometry])

  return <div className="mesh-preview" ref={ref} />
}
