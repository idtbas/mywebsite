/**
 * Project configuration.
 *
 * To replace the procedural sculpture with your own legally usable model,
 * place a .glb file in /public/models and set its path below, for example
 * `creatureModelUrl: 'models/sigmatox.glb'`. The model is scaled to
 * `creatureModelHeight`, placed on the ground facing +z and its first
 * animation clip (if any) is looped.
 */
export const CONFIG = {
  creatureModelUrl: null as string | null,
  creatureModelHeight: 4.3,
  wikiUrl: 'https://creatures-of-sonaria-official.fandom.com/wiki/Sigmatox',
}
