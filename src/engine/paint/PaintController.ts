import * as THREE from 'three'
import type { RGB } from '../../domain/math/types.ts'

export interface PaintConfig {
  active: boolean
  color: RGB
  radius: number
  strength: number
}

const TEX = 1024

interface Target {
  material: THREE.MeshStandardMaterial
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  texture: THREE.CanvasTexture
}

/**
 * Texture paint brush: drag over a mesh to paint onto its base-colour map.
 * If the material has no paintable map yet, a canvas-backed one is created
 * (seeded from the existing map or the base colour).
 */
export class PaintController {
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private cursor: THREE.Mesh
  private painting = false
  private target: Target | null = null
  private stroke: THREE.Mesh | null = null

  config: PaintConfig = { active: false, color: { r: 1, g: 0, b: 0 }, radius: 0.5, strength: 0.6 }
  onDragChange?: (dragging: boolean) => void
  onCommit?: (mesh: THREE.Mesh, dataUrl: string) => void

  private down = (e: PointerEvent) => this.onDown(e)
  private move = (e: PointerEvent) => this.onMove(e)
  private up = () => this.onUp()

  constructor(
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.Camera,
    private readonly dom: HTMLElement,
    private readonly root: THREE.Object3D,
  ) {
    this.cursor = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, depthTest: false, transparent: true, opacity: 0.6 }),
    )
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

  /** Build (or reuse) a paintable canvas map on the mesh's first material. */
  private ensureTarget(mesh: THREE.Mesh): Target | null {
    const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial
    if (!mat || !('map' in mat)) return null
    if (this.target && this.target.material === mat && mat.map === this.target.texture) {
      return this.target
    }
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = TEX
    const ctx = canvas.getContext('2d')!
    if (mat.map?.image) {
      try {
        ctx.drawImage(mat.map.image as CanvasImageSource, 0, 0, TEX, TEX)
      } catch {
        seedColor(ctx, mat)
      }
    } else {
      seedColor(ctx, mat)
    }
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.flipY = true
    mat.map = texture
    mat.color.setRGB(1, 1, 1) // let the texture carry the colour
    mat.needsUpdate = true
    this.target = { material: mat, canvas, ctx, texture }
    return this.target
  }

  private onDown(e: PointerEvent): void {
    if (!this.config.active || e.button !== 0) return
    const hit = this.pick(e)
    if (!hit || hit.uv === undefined) return
    const target = this.ensureTarget(hit.object as THREE.Mesh)
    if (!target) return
    this.painting = true
    this.stroke = hit.object as THREE.Mesh
    this.onDragChange?.(true)
    this.stamp(target, hit.uv)
  }

  private onMove(e: PointerEvent): void {
    if (!this.config.active) return
    const hit = this.pick(e)
    if (hit) {
      this.cursor.visible = true
      this.cursor.position.copy(hit.point)
      this.cursor.scale.setScalar(this.config.radius)
    } else {
      this.cursor.visible = false
    }
    if (this.painting && hit?.uv && this.target) this.stamp(this.target, hit.uv)
  }

  private onUp(): void {
    if (!this.painting) return
    this.painting = false
    this.onDragChange?.(false)
    if (this.stroke && this.target) {
      this.onCommit?.(this.stroke, this.target.canvas.toDataURL('image/png'))
    }
    this.stroke = null
  }

  private stamp(target: Target, uv: THREE.Vector2): void {
    const px = uv.x * TEX
    const py = (1 - uv.y) * TEX
    const r = Math.max(4, this.config.radius * 160)
    const c = this.config.color
    const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`
    const grd = target.ctx.createRadialGradient(px, py, 0, px, py, r)
    grd.addColorStop(0, `rgba(${rgb},${this.config.strength})`)
    grd.addColorStop(1, `rgba(${rgb},0)`)
    target.ctx.fillStyle = grd
    target.ctx.beginPath()
    target.ctx.arc(px, py, r, 0, Math.PI * 2)
    target.ctx.fill()
    target.texture.needsUpdate = true
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

const seedColor = (ctx: CanvasRenderingContext2D, mat: THREE.MeshStandardMaterial): void => {
  ctx.fillStyle = mat.color ? `#${mat.color.getHexString(THREE.SRGBColorSpace)}` : '#ffffff'
  ctx.fillRect(0, 0, TEX, TEX)
}
