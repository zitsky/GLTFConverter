import { create } from 'zustand'
import type { TransformMode } from '../engine/gizmos/TransformGizmo.ts'
import type { SubObjectMode } from '../engine/subobject/SubObjectMode.ts'
import type { NodeId } from '../domain/scene/ids.ts'

interface EditorState {
  selectedId: NodeId | null
  transformMode: TransformMode
  subObjectMode: SubObjectMode
  status: string
  busy: boolean

  select: (id: NodeId | null) => void
  setTransformMode: (mode: TransformMode) => void
  setSubObjectMode: (mode: SubObjectMode) => void
  setStatus: (status: string) => void
  setBusy: (busy: boolean) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedId: null,
  transformMode: 'translate',
  subObjectMode: 'object',
  status: 'Готово',
  busy: false,

  select: (id) => set({ selectedId: id }),
  setTransformMode: (mode) => set({ transformMode: mode }),
  setSubObjectMode: (mode) => set({ subObjectMode: mode }),
  setStatus: (status) => set({ status }),
  setBusy: (busy) => set({ busy }),
}))
