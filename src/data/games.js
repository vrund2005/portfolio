/**
 * Games shown on /games. Shared by the page and the prerender script.
 *
 * status:
 *   live    — playable in the browser now (`url` required)
 *   porting — built as a desktop Python/OpenCV game, being rebuilt for the browser
 *   desktop — desktop CV experiment, not planned for the browser yet
 */
export const games = [
  {
    slug: 'vrundoodle',
    title: 'Vrundoodle',
    kicker: 'Multiplayer · Draw & guess',
    status: 'live',
    url: 'https://doodle.vrund.dev',
    blurb:
      'Skribbl, but you draw in the air. One player traces the secret word with a fingertip in front of their phone camera while everyone else races to guess it.',
    controls: ['☝️ Index up — draw', '✌️ Two fingers — lift', '🤏 Pinch mode'],
    tech: ['MediaPipe Hands', 'WebSockets', 'One Euro filter'],
    players: '2–12 players',
    art: 'doodle',
  },
  {
    slug: 'wizard-duel',
    title: 'Wizard Duel',
    kicker: 'Solo · Spellcasting',
    status: 'porting',
    blurb:
      'Trace spells in the air to duel an AI wizard. A loop hurls a fireball, a zigzag calls lightning, a straight slash raises a shield.',
    controls: ['☝️ Trace a shape', '✋ Relax to cast'],
    tech: ['Hand tracking', 'Gesture recognition'],
    players: '1 player',
    art: 'wizard',
  },
  {
    slug: 'fruit-frenzy',
    title: 'Fruit Frenzy',
    kicker: 'Solo · Arcade',
    status: 'porting',
    blurb: 'Fruit Ninja with your webcam. Both index fingers become blades. Swipe fast through flying fruit to slice it.',
    controls: ['☝️☝️ Both hands are blades'],
    tech: ['Two-hand tracking', 'Swipe velocity'],
    players: '1 player',
    art: 'fruit',
  },
  {
    slug: 'palm-hero',
    title: 'Palm Hero',
    kicker: 'Solo · Platformer',
    status: 'porting',
    blurb:
      'Your open palm is the level. A tiny hero walks on your knuckles. Carry him to the door and tilt your hand to keep him off the saws and spikes.',
    controls: ['✋ Palm is the platform', '↔️ Tilt to balance'],
    tech: ['Hand pose', '2D physics'],
    players: '1 player',
    art: 'palm',
  },
  {
    slug: 'cube-oracle',
    title: 'Cube Oracle',
    kicker: 'AR · Rubik’s solver',
    status: 'desktop',
    blurb:
      'Hold up a scrambled Rubik’s cube and the solution is drawn onto it, glued to the real faces as you turn it, and re-solved if you make the wrong move.',
    controls: ['🧊 Show a face', '🔄 Follow the arrow'],
    tech: ['Pose estimation', 'Colour classification', 'AR overlay'],
    players: '1 player',
    art: 'cube',
  },
  {
    slug: 'stardust-mirror',
    title: 'Stardust Mirror',
    kicker: 'Interactive art',
    status: 'desktop',
    blurb: '40,000 physics particles rebuild your live silhouette out of glowing dust and copy your every move, until you touch it.',
    controls: ['🧍 Just move'],
    tech: ['Segmentation', 'Particle physics'],
    players: '1 player',
    art: 'stardust',
  },
  {
    slug: 'holodeck',
    title: 'Holodeck',
    kicker: 'Experiment · 3D vision',
    status: 'desktop',
    blurb:
      'One ordinary webcam becomes a live 3D hologram scanner. A depth network turns each frame into 130,000 points you can view from angles the camera never saw.',
    controls: ['🖱️ Orbit the hologram'],
    tech: ['Monocular depth', 'Point clouds', 'OpenGL'],
    players: '1 player',
    art: 'holo',
  },
]

export const STATUS_LABEL = {
  live: 'Live',
  porting: 'Coming to browser',
  desktop: 'Desktop build',
}
