import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { MeshNode } from '../../domain/nodes/SceneNode.ts'
import { AssetFactory } from '../../engine/asset/AssetFactory.ts'
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
