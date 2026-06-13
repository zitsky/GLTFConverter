import * as THREE from 'three'

/**
 * Foundation of the mesh editor: shows a mesh's vertices as draggable points
 * and writes moves back into the geometry's position attribute. Edge/polygon
 * modes will build on this picking + drag-plane machinery later.
 */
export class VertexEditor {
  private points: THREE.Points | null = null
  private mesh: THREE.Mesh | null = null
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private dragPlane = new THREE.Plane()
  private dragIndex = -1
  private dragging = false
  private onCommit: (() => void) | null = null

  onDragChange?: (dragging: boolean) => void

  private downHandler = (e: PointerEvent) => this.onPointerDown(e)
  private moveHandler = (e: PointerEvent) => this.onPointerMove(e)
  private upHandler = (e: PointerEvent) => this.onPointerUp(e)

  constructor(
    private readonly camera: THREE.Camera,
    private readonly dom: HTMLElement,
  ) {
    this.raycaster.params.Points = { threshold: 0.15 }
  }

  activate(mesh: THREE.Mesh, onCommit: () => void): void {
    if (this.mesh === mesh && this.points) return
    this.deactivate()
    this.mesh = mesh
    this.onCommit = onCommit

    const pointsGeo = new THREE.BufferGeometry()
    pointsGeo.setAttribute('position', mesh.geometry.getAttribute('position'))
    const mat = new THREE.PointsMaterial({
      size: 8,
      sizeAttenuation: false,
      color: 0x4ea1ff,
      depthTest: false,
    })
    this.points = new THREE.Points(pointsGeo, mat)
    this.points.renderOrder = 999
    mesh.add(this.points) // inherit the mesh transform

    this.dom.addEventListener('pointerdown', this.downHandler)
    this.dom.addEventListener('pointermove', this.moveHandler)
    this.dom.addEventListener('pointerup', this.upHandler)
  }

  deactivate(): void {
    if (this.points) {
      this.points.parent?.remove(this.points)
      this.points.geometry.dispose()
      ;(this.points.material as THREE.Material).dispose()
      this.points = null
    }
    this.dom.removeEventListener('pointerdown', this.downHandler)
    this.dom.removeEventListener('pointermove', this.moveHandler)
    this.dom.removeEventListener('pointerup', this.upHandler)
    this.mesh = null
    this.dragIndex = -1
    this.dragging = false
  }

  isDragging(): boolean {
    return this.dragging
  }

  private setPointer(e: PointerEvent): void {
    const rect = this.dom.getBoundingClientRect()
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    )
    this.raycaster.setFromCamera(this.pointer, this.camera)
  }

  private onPointerDown(e: PointerEvent): void {
    if (!this.points || !this.mesh || e.button !== 0) return
    this.setPointer(e)
    const hits = this.raycaster.intersectObject(this.points, false)
    if (hits.length === 0 || hits[0].index === undefined) return
    this.dragIndex = hits[0].index
    this.dragging = true
    // Drag plane through the vertex, facing the camera.
    const worldPoint = hits[0].point.clone()
    const normal = this.camera.getWorldDirection(new THREE.Vector3()).negate()
    this.dragPlane.setFromNormalAndCoplanarPoint(normal, worldPoint)
    this.onDragChange?.(true)
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.dragging || !this.mesh || !this.points || this.dragIndex < 0) return
    this.setPointer(e)
    const hit = new THREE.Vector3()
    if (!this.raycaster.ray.intersectPlane(this.dragPlane, hit)) return
    const local = this.mesh.worldToLocal(hit.clone())
    const attr = this.mesh.geometry.getAttribute('position') as THREE.BufferAttribute
    attr.setXYZ(this.dragIndex, local.x, local.y, local.z)
    attr.needsUpdate = true
    this.mesh.geometry.computeVertexNormals()
    this.mesh.geometry.computeBoundingSphere()
    ;(this.points.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true
  }

  private onPointerUp(_e: PointerEvent): void {
    if (!this.dragging) return
    this.dragging = false
    this.dragIndex = -1
    this.onDragChange?.(false)
    this.onCommit?.()
  }

  dispose(): void {
    this.deactivate()
  }
}
