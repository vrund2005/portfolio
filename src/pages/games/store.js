/**
 * Shared, mutable scroll state for the /games page.
 *
 * GSAP ScrollTriggers write into it, the WebGL scene reads it every frame.
 * A plain object (not React state) so scrolling never re-renders anything.
 *
 *   morph  0 scatter → 1 hand → 2 lens (SEE) → 3 tracked hand (TRACK)
 *          → 4 gamepad (PLAY) → 5 floor grid (game select)
 *   light  0 = carbon (dark) page, 1 = bone (light) page
 */
export const stage = {
  morph: 0,
  light: 0,
  velocity: 0,
  pointer: { x: 0, y: 0, active: false },
}

export const STAGE_COUNT = 6
