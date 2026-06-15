import * as THREE from 'three'
import type { RGB } from '../../domain/math/types.ts'

export interface PaintConfig {
  active: boolean
  color: RGB
  radius: number
  strength: number
}

/** Vertex-colour paint brush: drag over a mesh to blend its vertices toward a colour. */
export class PaintController {
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private cursor = new THREE.Mesh(
    new THREE.SphereGeometry(1, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, depthTest: false, transparent: true, opacity: 0.6 }),
  )
  private painting = false
  private stroke: THREE.Mesh | null = null

  config: PaintConfig = { active: false, color: { r: 1, g: 0, b: 0 }, radius: 0.5, strength: 0.6 }
  onDragChange?: (dragging: boolean) => void
  onCommit?: (mesh: THREE.Mesh) => void

  private down = (e: PointerEvent) => this.onDown(e)
  private move = (e: PointerEvent) => this.onMove(e)
  private up = () => this.onUp()

  constructor(
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.Camera,
    private readonly dom: HTMLElement,
    private readonly root: THREE.Object3D,
  ) {
    this.cursor.visible = false
    this.cursor.renderOrder = 995
    this.scene.add(this.cursor)
    this.dom.addEventListener('pointerdown', this.down)
    this.dom.addEventListener('pointermove', this.move)
    this.dom.addEventListener('pointerup', this.up)
  }

  setActive(active: boolean): void {
    this.config.active = active
    if (!active) this.cursor.visible = false
  }

  isActive(): boolean {
    return this.config.active
  }

  private pick(e: PointerEvent): THREE.Intersection | null {
    const rect = this.dom.getBoundingClientRect()
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    )
    this.raycaster.setFromCamera(this.pointer, this.camera)
    return this.raycaster.intersectObject(this.root, true).find((h) => (h.object as THREE.Mesh).isMesh) ?? null
  }

  private onDown(e: PointerEvent): void {
    if (!this.config.active || e.button !== 0) return
    const hit = this.pick(e)
    if (!hit) return
    this.painting = true
    this.stroke = hit.object as THREE.Mesh
    this.onDragChange?.(true)
    this.paintAt(this.stroke, hit.point)
  }

  private onMove(e: PointerEvent): void {
    if (!this.config.active) return
    const hit = this.pick(e)
    // brush cursor follows the surface
    if (hit) {
      this.cursor.visible = true
      this.cursor.position.copy(hit.point)
      this.cursor.scale.setScalar(this.config.radius)
    } else {
      this.cursor.visible = false
    }
    if (this.painting && hit) this.paintAt(hit.object as THREE.Mesh, hit.point)
  }

  private onUp(): void {
    if (!this.painting) return
    this.painting = false
    this.onDragChange?.(false)
    if (this.stroke) this.onCommit?.(this.stroke)
    this.stroke = null
  }

  private paintAt(mesh: THREE.Mesh, point: THREE.Vector3): void {
    const geo = mesh.geometry
    const pos = geo.getAttribute('position') as THREE.BufferAttribute
    if (!pos) return
    let col = geo.getAttribute('color') as THREE.BufferAttribute | undefined
    if (!col) {
      col = new THREE.BufferAttribute(new Float32Array(pos.count * 3).fill(1), 3)
      geo.setAttribute('color', col)
    }
    const c = new THREE.Color().setRGB(
      this.config.color.r,
      this.config.color.g,
      this.config.color.b,
      THREE.SRGBColorSpace,
    )
    const radius = this.config.radius
    const v = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      mesh.localToWorld(v)
      const d = v.distanceTo(point)
      if (d > radius) continue
      const t = this.config.strength * (1 - d / radius)
      col.setXYZ(
        i,
        THREE.MathUtils.lerp(col.getX(i), c.r, t),
        THREE.MathUtils.lerp(col.getY(i), c.g, t),
        THREE.MathUtils.lerp(col.getZ(i), c.b, t),
      )
    }
    col.needsUpdate = true
    enableVertexColors(mesh.material)
  }

  dispose(): void {
    this.dom.removeEventListener('pointerdown', this.down)
    this.dom.removeEventListener('pointermove', this.move)
    this.dom.removeEventListener('pointerup', this.up)
    this.scene.remove(this.cursor)
    this.cursor.geometry.dispose()
    ;(this.cursor.material as THREE.Material).dispose()
  }
}

const enableVertexColors = (m: THREE.Material | THREE.Material[]): void => {
  const arr = Array.isArray(m) ? m : [m]
  for (const mat of arr) {
    if ('vertexColors' in mat && !(mat as THREE.MeshStandardMaterial).vertexColors) {
      ;(mat as THREE.MeshStandardMaterial).vertexColors = true
      mat.needsUpdate = true
    }
  }
}
