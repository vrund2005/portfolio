/**
 * Line-art "cartridge labels" for each game. Pure SVG: stroke uses
 * currentColor (follows the card's ink/bone inversion), --hot is the accent.
 */
const HAND = [
  [100, 128], [118, 120], [130, 108], [138, 96], [146, 86],
  [116, 92], [119, 72], [121, 58], [122, 46],
  [102, 92], [103, 68], [103, 52], [104, 38],
  [90, 93], [88, 72], [87, 58], [86, 48],
  [80, 98], [75, 84], [72, 74], [70, 66],
]
const BONES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]]

function HandSkeleton({ dx = 0, dy = 0, s = 1, dots = true }) {
  const P = HAND.map(([x, y]) => [dx + x * s, dy + y * s])
  return (
    <g>
      {BONES.map(([a, b]) => (
        <line key={`${a}-${b}`} x1={P[a][0]} y1={P[a][1]} x2={P[b][0]} y2={P[b][1]} />
      ))}
      {dots && P.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === 8 ? 3.4 : 2} className={i === 8 ? 'hot-fill' : 'ink-fill'} />)}
    </g>
  )
}

const arts = {
  doodle: (
    <>
      <path className="hot" d="M22 112 C 40 60, 70 60, 66 92 S 96 130, 112 64" strokeDasharray="4 5" />
      <HandSkeleton dx={52} dy={-4} s={0.9} />
      <circle className="hot" cx="162" cy="34" r="10" />
      <path d="M150 128 h40 M150 120 h28 M150 112 h34" />
    </>
  ),
  wizard: (
    <>
      <path className="hot" d="M60 76 m-26 0 a26 26 0 1 0 52 0 a26 26 0 1 0 -52 0" />
      <path className="hot" d="M60 76 m-12 0 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0" />
      <path d="M118 30 l18 26 l-14 4 l22 34 l-30 -26 l14 -4 z" />
      <path d="M150 128 L188 94" strokeWidth="4" />
      <path d="M20 132 h60" strokeDasharray="2 6" />
    </>
  ),
  fruit: (
    <>
      <path d="M58 88 a30 30 0 0 1 60 0 z" transform="translate(-6 -8) rotate(-12 88 88)" />
      <path className="hot" d="M58 92 a30 30 0 0 0 60 0 z" transform="translate(8 10) rotate(-12 88 92)" />
      <path className="hot" d="M20 130 L180 28" strokeWidth="3" />
      <circle cx="160" cy="112" r="16" />
      <path d="M154 92 q6 -8 12 0" />
      <circle cx="34" cy="40" r="9" />
    </>
  ),
  palm: (
    <>
      <HandSkeleton dx={30} dy={8} s={0.95} dots={false} />
      <path className="hot" d="M72 52 h66" strokeWidth="5" />
      <rect className="hot-fill" x="96" y="38" width="10" height="14" />
      <rect x="160" y="22" width="22" height="34" />
      <path d="M24 30 l10 -8 l10 8 l-10 8 z" />
      <circle cx="40" cy="126" r="8" strokeDasharray="3 3" />
    </>
  ),
  cube: (
    <>
      <path d="M100 26 L150 52 L150 108 L100 134 L50 108 L50 52 Z" />
      <path d="M100 26 L100 80 M50 52 L100 80 L150 52 M100 80 L100 134" />
      <path d="M67 61 L117 35 M83 70 L133 44 M50 70 L100 98 M50 89 L100 116" opacity="0.55" />
      <path className="hot" d="M158 64 C 182 80, 182 104, 158 118" strokeWidth="3" />
      <path className="hot" d="M152 112 L160 120 L166 110" strokeWidth="3" />
    </>
  ),
  stardust: (
    <>
      {Array.from({ length: 140 }, (_, i) => {
        const a = (i * 137.5 * Math.PI) / 180
        const head = i < 50
        const r = head ? Math.sqrt(i / 50) * 20 : 0
        const x = head ? 100 + Math.cos(a) * r : 64 + ((i * 37) % 72)
        const y = head ? 46 + Math.sin(a) * r : 76 + ((i * 53) % 60) * (1 - Math.abs(64 + ((i * 37) % 72) - 100) / 90)
        return <circle key={i} cx={x} cy={y} r={i % 9 === 0 ? 1.8 : 1.1} className={i % 7 === 0 ? 'hot-fill' : 'ink-fill'} />
      })}
    </>
  ),
  holo: (
    <>
      {Array.from({ length: 14 }, (_, i) => {
        const y = 28 + i * 7.5
        const w = 36 * Math.sin(((i + 1) / 15) * Math.PI) + 8
        return <path key={i} className={i % 4 === 1 ? 'hot' : undefined} d={`M${100 - w} ${y} Q 100 ${y - 5} ${100 + w} ${y}`} />
      })}
      <path d="M30 136 L60 116 M170 136 L140 116" strokeDasharray="3 4" />
    </>
  ),
}

export default function GameArt({ kind }) {
  return (
    <svg className="vrc-art" viewBox="0 0 200 150" aria-hidden="true">
      {arts[kind]}
    </svg>
  )
}
