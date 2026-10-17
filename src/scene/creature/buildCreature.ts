import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { buildTube, type V3 } from './tube'
import { creatureSpec } from './creatureSpec'

export interface CreaturePart {
  id: string
  pivot: V3
  geometry: THREE.BufferGeometry
}

/**
 * Turns the spec into one merged geometry per animated part. Each geometry is
 * re-centred on its pivot so the part can be rotated around its joint, while
 * the `aRest` attribute keeps the creature-space rest position for the shader.
 */
export function buildCreature(detail: number): CreaturePart[] {
  return creatureSpec().map((part) => {
    const geos = part.tubes.map((tube) => buildTube(tube, detail))
    const merged = mergeGeometries(geos, false)
    if (!merged) throw new Error(`Could not merge creature part "${part.id}"`)
    geos.forEach((g) => g.dispose())
    merged.translate(-part.pivot[0], -part.pivot[1], -part.pivot[2])
    merged.computeBoundingSphere()
    return { id: part.id, pivot: part.pivot, geometry: merged }
  })
}
