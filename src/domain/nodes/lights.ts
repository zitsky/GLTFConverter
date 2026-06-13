import type { RGB } from '../math/types.ts'

export type LightType =
  | 'ambient'
  | 'hemisphere'
  | 'directional'
  | 'point'
  | 'spot'

export interface LightData {
  type: LightType
  color: RGB
  intensity: number
  /** point/spot */
  distance?: number
  decay?: number
  /** spot */
  angle?: number
  penumbra?: number
  /** hemisphere */
  groundColor?: RGB
  /** directional/spot cast shadows */
  castShadow?: boolean
}
