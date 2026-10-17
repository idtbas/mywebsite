import * as THREE from 'three'
import { simplexNoise } from '../shaders/noise'

export const TOXIC = new THREE.Color('#8dff2f')

export interface OrganicUniforms {
  [key: string]: THREE.IUniform
  uTime: THREE.IUniform<number>
  uGlow: THREE.IUniform<number>
  uVeins: THREE.IUniform<number>
  uPulse: THREE.IUniform<number>
  uSense: THREE.IUniform<number>
  uReveal: THREE.IUniform<number>
  uDissolve: THREE.IUniform<number>
  uRim: THREE.IUniform<number>
  uSwayAmp: THREE.IUniform<number>
  uToxic: THREE.IUniform<THREE.Color>
  uHeart: THREE.IUniform<THREE.Vector3>
  uRevealOrigin: THREE.IUniform<THREE.Vector3>
}

export function createOrganicUniforms(shared?: { uTime: THREE.IUniform<number> }): OrganicUniforms {
  return {
    uTime: shared?.uTime ?? { value: 0 },
    uGlow: { value: 1 },
    uVeins: { value: 1 },
    uPulse: { value: 0 },
    uSense: { value: 1 },
    uReveal: { value: 1 },
    uDissolve: { value: 0 },
    uRim: { value: 1 },
    uSwayAmp: { value: 1 },
    uToxic: { value: TOXIC.clone() },
    uHeart: { value: new THREE.Vector3(0, 2.6, 0.5) },
    uRevealOrigin: { value: new THREE.Vector3(0, 3.3, 2) },
  }
}

const vertexPars = /* glsl */ `
attribute vec3 aRest;
attribute vec4 aData;
uniform float uTime;
uniform float uSwayAmp;
varying vec3 vRest;
varying vec4 vData;
`

const vertexBegin = /* glsl */ `
#include <begin_vertex>
vRest = aRest;
vData = aData;
float swayW = aData.y * uSwayAmp;
if (swayW > 0.0) {
  float ph = uTime * 1.05 - aData.x * 4.0;
  transformed.x += sin(ph) * swayW * 0.32;
  transformed.y += sin(ph * 0.8 + 1.7) * swayW * 0.1;
  transformed.z += cos(ph * 0.6) * swayW * 0.06;
}
`

const fragmentPars = /* glsl */ `
uniform float uTime;
uniform float uGlow;
uniform float uVeins;
uniform float uPulse;
uniform float uSense;
uniform float uReveal;
uniform float uDissolve;
uniform float uRim;
uniform vec3 uToxic;
uniform vec3 uHeart;
uniform vec3 uRevealOrigin;
varying vec3 vRest;
varying vec4 vData;
${simplexNoise}

float oCls;
float oLocalT;
float oVein;
float oCrev;
float oNB;
float oNA;
float oRegion;
float oBurn;
float oWave;
float oMask;
float oHeight;

vec3 organicPerturb(vec3 surfPos, vec3 surfNorm, vec2 dHdxy, float faceDir) {
  vec3 sigmaX = normalize(dFdx(surfPos));
  vec3 sigmaY = normalize(dFdy(surfPos));
  vec3 r1 = cross(sigmaY, surfNorm);
  vec3 r2 = cross(surfNorm, sigmaX);
  float det = dot(sigmaX, r1) * faceDir;
  vec3 grad = sign(det) * (dHdxy.x * r1 + dHdxy.y * r2);
  return normalize(abs(det) * surfNorm - grad);
}
`

/* evaluated once at the top of main() */
const fragmentSetup = /* glsl */ `
#include <clipping_planes_fragment>
oCls = floor(vData.z + 0.001);
oLocalT = fract(vData.z) / 0.9;
oBurn = 0.0;
if (uDissolve > 0.001) {
  float dn = snoise(vRest * 1.7 + vec3(0.0, uTime * 0.35, 0.0)) * 0.5 + 0.5;
  float dv = dn * 0.78 + clamp(vRest.y / 4.6, 0.0, 1.0) * 0.22;
  float edge = uDissolve * 1.14 - 0.07;
  if (dv < edge) discard;
  oBurn = 1.0 - smoothstep(0.0, 0.075, dv - edge);
}
oNA = snoise(vRest * vec3(1.25, 1.7, 1.25) + vec3(4.1, 0.0, 2.3));
oVein = 1.0 - abs(oNA);
// veins only run through some regions of the body, never as an even net
oRegion = smoothstep(-0.15, 0.55, snoise(vRest * 0.42 + vec3(11.0, 3.0, -7.0)));
oNB = snoise(vRest * 3.4 + vec3(-2.0, 7.0, 1.0));
oCrev = 1.0 - smoothstep(0.0, 0.11, abs(oNB));
float hd = length(vRest - uHeart);
float w = fract(hd * 0.3 - uTime * 0.36);
oWave = smoothstep(0.0, 0.035, w) * (1.0 - smoothstep(0.035, 0.3, w));
oMask = 1.0 - smoothstep(uReveal * 9.5 - 1.4, uReveal * 9.5, length(vRest - uRevealOrigin));
float isArmour = 1.0 - step(0.5, oCls);
oHeight = (smoothstep(0.9, 0.99, oVein) * 0.3 * oRegion - oCrev * 0.9 + oNB * 0.08) * isArmour;
`

const fragmentColor = /* glsl */ `
#include <color_fragment>
{
  vec3 armour = mix(vec3(0.011, 0.013, 0.013), vec3(0.046, 0.05, 0.05), smoothstep(-0.7, 0.9, oNB));
  armour *= 1.0 - oCrev * 0.6;
  armour = mix(armour, vec3(0.02, 0.04, 0.022), smoothstep(0.86, 0.98, oVein) * oRegion * 0.5);
  vec3 bone = mix(vec3(0.05, 0.05, 0.045), vec3(0.19, 0.185, 0.155), smoothstep(0.1, 0.95, oLocalT));
  vec3 keratin = mix(vec3(0.008, 0.009, 0.009), vec3(0.075, 0.08, 0.078), pow(oLocalT, 2.2));
  vec3 col = armour;
  col = mix(col, bone, step(0.5, oCls) * (1.0 - step(1.5, oCls)));
  col = mix(col, vec3(0.0), step(1.5, oCls) * (1.0 - step(2.5, oCls)));
  col = mix(col, keratin, step(2.5, oCls));
  diffuseColor.rgb = col;
}
`

const fragmentRoughness = /* glsl */ `
#include <roughnessmap_fragment>
{
  float r = 0.42 + oCrev * 0.4 + oNB * 0.07;
  r = mix(r, 0.58, step(0.5, oCls) * (1.0 - step(1.5, oCls)));
  r = mix(r, 0.24, step(2.5, oCls));
  roughnessFactor = clamp(r, 0.08, 1.0);
}
`

const fragmentMetalness = /* glsl */ `
#include <metalnessmap_fragment>
metalnessFactor = mix(0.28, 0.05, step(0.5, oCls));
`

const fragmentNormal = /* glsl */ `
#include <normal_fragment_maps>
normal = organicPerturb(-vViewPosition, normal, vec2(dFdx(oHeight), dFdy(oHeight)) * 1.4, faceDirection);
`

const fragmentEmissive = /* glsl */ `
#include <emissivemap_fragment>
{
  vec3 V = normalize(vViewPosition);
  float fres = pow(1.0 - clamp(dot(normal, V), 0.0, 1.0), 3.0);
  float isArmour = 1.0 - step(0.5, oCls);
  float isSense = step(1.5, oCls) * (1.0 - step(2.5, oCls));
  float isKeratin = step(2.5, oCls);
  float aa = fwidth(oVein) * 1.5;
  float veinLine = smoothstep(0.935 - aa, 0.985 + aa, oVein);
  float veinCore = smoothstep(0.972 - aa, 0.997 + aa, oVein);
  float flow = 0.55 + 0.45 * sin(uTime * 1.6 + vRest.y * 2.2 + oNA * 3.0);
  float energy = (veinLine * 0.22 + veinCore * 1.25) * (0.22 + 1.6 * oWave + uPulse * 1.8) * flow;
  float region = mix(oRegion, 1.0, clamp(uPulse * 0.6, 0.0, 1.0));
  vec3 em = uToxic * energy * uVeins * isArmour * oMask * region;
  em += uToxic * oCrev * 0.02 * isArmour * oMask * (0.3 + oWave + uPulse);
  em += uToxic * isKeratin * oMask * pow(1.0 - oLocalT, 3.0) * 0.03;
  float flick = 0.86 + 0.14 * sin(uTime * 21.0 + vData.w * 40.0) * sin(uTime * 6.3 + vData.w * 9.0);
  em += uToxic * 3.2 * isSense * uSense * flick;
  em += uToxic * fres * uRim * 0.14 * (1.0 - isSense);
  em += mix(uToxic, vec3(1.0), 0.35) * oBurn * 7.0;
  totalEmissiveRadiance += em * uGlow;
}
`

/**
 * Patches three's physical/standard material: we keep its physically based
 * lighting and environment reflections but drive colour, roughness, normals
 * and emission from procedural patterns evaluated in creature space.
 */
export function createOrganicMaterial(uniforms: OrganicUniforms, physical: boolean): THREE.MeshStandardMaterial {
  const params: THREE.MeshPhysicalMaterialParameters = {
    color: '#0b0e0d',
    roughness: 0.4,
    metalness: 0.2,
    envMapIntensity: 1,
  }
  const material = physical
    ? new THREE.MeshPhysicalMaterial({ ...params, clearcoat: 0.45, clearcoatRoughness: 0.22 })
    : new THREE.MeshStandardMaterial(params)

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${vertexPars}`)
      .replace('#include <begin_vertex>', vertexBegin)
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${fragmentPars}`)
      .replace('#include <clipping_planes_fragment>', fragmentSetup)
      .replace('#include <color_fragment>', fragmentColor)
      .replace('#include <roughnessmap_fragment>', fragmentRoughness)
      .replace('#include <metalnessmap_fragment>', fragmentMetalness)
      .replace('#include <normal_fragment_maps>', fragmentNormal)
      .replace('#include <emissivemap_fragment>', fragmentEmissive)
  }
  material.customProgramCacheKey = () => `organic-v2-${physical ? 'p' : 's'}`
  return material
}
