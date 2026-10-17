import { Bloom, ChromaticAberration, EffectComposer, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'

const CA_OFFSET = new THREE.Vector2(0.0007, 0.0005)

/**
 * HDR bloom is what turns the emissive veins into light. The composer renders
 * in linear HDR, so tone mapping happens here as the last step.
 */
export function PostFX({ chromatic, msaa }: { chromatic: boolean; msaa: number }) {
  const bloom = (
    <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.35} intensity={0.95} radius={0.7} levels={6} />
  )
  if (chromatic) {
    return (
      <EffectComposer multisampling={msaa} enableNormalPass={false}>
        {bloom}
        <ChromaticAberration offset={CA_OFFSET} radialModulation modulationOffset={0.35} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    )
  }
  return (
    <EffectComposer multisampling={msaa} enableNormalPass={false}>
      {bloom}
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}
