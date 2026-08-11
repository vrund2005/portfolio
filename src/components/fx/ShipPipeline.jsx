import { useId } from 'react'

/**
 * Animated "notebook → train → production" strip.
 * Illustrates the About section's own headline instead of repeating its text.
 * Pure inline SVG + CSS; freezes for prefers-reduced-motion.
 */

const L1 = [52, 75, 98]
const L2 = [41, 64, 87, 110]
const L3 = [64, 87]

function ShipPipeline() {
  const rawId = useId()
  const gid = `sp${rawId.replace(/:/g, '')}`

  return (
    <svg
      viewBox="0 0 560 152"
      className="h-auto w-full"
      role="img"
      aria-label="Animation: a notebook trains a model which is then deployed to production"
    >
      <defs>
        <linearGradient id={`${gid}-line`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <radialGradient id={`${gid}-glow`}>
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
      </defs>

      <style>{`
        .sp-packet { stroke-dasharray: 12 90; stroke-dashoffset: 102; opacity: 0; }
        .sp-edge-pulse { stroke-dasharray: 14 70; stroke-dashoffset: 84; opacity: 0; }
        .sp-led, .sp-node { transform-box: fill-box; transform-origin: center; }
        @media (prefers-reduced-motion: no-preference) {
          .sp-packet { animation: sp-send 2.6s linear infinite; }
          .sp-edge-pulse { animation: sp-send 2.2s linear infinite; }
          .sp-cell { animation: sp-cell 2.4s ease-in-out infinite; }
          .sp-node { animation: sp-node 2.8s ease-in-out infinite; }
          .sp-led { animation: sp-led 2.1s ease-in-out infinite; }
          .sp-live { animation: sp-live 2s ease-out infinite; }
          .sp-caret { animation: sp-caret 1.1s steps(1) infinite; }
        }
        @keyframes sp-send {
          0% { stroke-dashoffset: 102; opacity: 0; }
          15% { opacity: 1; }
          80% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        @keyframes sp-cell {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 1; }
        }
        @keyframes sp-node {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.35); opacity: 1; }
        }
        @keyframes sp-led {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes sp-live {
          0% { transform: scale(0.6); opacity: 0.9; }
          75%, 100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes sp-caret {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>

      {/* ---- rails ---- */}
      <line x1="134" y1="75" x2="212" y2="75" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <line x1="350" y1="75" x2="428" y2="75" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <path d="M134,75 L212,75" stroke={`url(#${gid}-line)`} strokeWidth="2.5" strokeLinecap="round" className="sp-packet" />
      <path d="M350,75 L428,75" stroke={`url(#${gid}-line)`} strokeWidth="2.5" strokeLinecap="round" className="sp-packet" style={{ animationDelay: '0.9s' }} />

      {/* ---- 1. notebook ---- */}
      <g>
        <rect x="20" y="38" width="112" height="74" rx="9" fill="#0a0d1a" stroke="rgba(255,255,255,0.12)" />
        <line x1="20" y1="56" x2="132" y2="56" stroke="rgba(255,255,255,0.1)" />
        <circle cx="32" cy="47" r="2.6" fill="#f87171" opacity="0.75" />
        <circle cx="41" cy="47" r="2.6" fill="#fbbf24" opacity="0.75" />
        <circle cx="50" cy="47" r="2.6" fill="#34d399" opacity="0.75" />

        <rect x="31" y="66" width="58" height="4.5" rx="2.2" fill="#a78bfa" opacity="0.55" />
        <rect x="31" y="78" width="42" height="4.5" rx="2.2" fill="#ffffff" opacity="0.18" />
        <rect x="31" y="90" width="66" height="4.5" rx="2.2" fill="#22d3ee" className="sp-cell" />
        <rect x="101" y="90" width="5" height="6" fill="#22d3ee" className="sp-caret" />
      </g>

      {/* ---- 2. training ---- */}
      <g>
        {L1.map((y1) =>
          L2.map((y2) => (
            <line key={`a${y1}-${y2}`} x1="238" y1={y1} x2="281" y2={y2} stroke="rgba(255,255,255,0.09)" strokeWidth="0.8" />
          )),
        )}
        {L2.map((y1) =>
          L3.map((y2) => (
            <line key={`b${y1}-${y2}`} x1="281" y1={y1} x2="324" y2={y2} stroke="rgba(255,255,255,0.09)" strokeWidth="0.8" />
          )),
        )}

        {/* a few edges carry signal */}
        {[
          'M238,52 L281,41',
          'M238,75 L281,87',
          'M281,41 L324,64',
          'M281,87 L324,87',
          'M238,98 L281,64',
        ].map((d, i) => (
          <path key={d} d={d} stroke={`url(#${gid}-line)`} strokeWidth="1.6" fill="none" strokeLinecap="round" className="sp-edge-pulse" style={{ animationDelay: `${i * 0.42}s` }} />
        ))}

        {L1.map((y, i) => (
          <circle key={`n1${y}`} cx="238" cy={y} r="4" fill="#a78bfa" className="sp-node" style={{ animationDelay: `${i * 0.3}s` }} />
        ))}
        {L2.map((y, i) => (
          <circle key={`n2${y}`} cx="281" cy={y} r="4" fill="#818cf8" className="sp-node" style={{ animationDelay: `${0.4 + i * 0.3}s` }} />
        ))}
        {L3.map((y, i) => (
          <circle key={`n3${y}`} cx="324" cy={y} r="4.5" fill="#22d3ee" className="sp-node" style={{ animationDelay: `${0.9 + i * 0.3}s` }} />
        ))}
      </g>

      {/* ---- 3. production ---- */}
      <g>
        <rect x="430" y="38" width="112" height="74" rx="9" fill="#0a0d1a" stroke="rgba(255,255,255,0.12)" />
        {[46, 66, 86].map((y, i) => (
          <g key={y}>
            <rect x="441" y={y} width="90" height="18" rx="4.5" fill="#ffffff" fillOpacity="0.04" stroke="rgba(255,255,255,0.09)" />
            <circle cx="452" cy={y + 9} r="3" fill={i === 0 ? '#34d399' : '#22d3ee'} className="sp-led" style={{ animationDelay: `${i * 0.55}s` }} />
            <rect x="462" y={y + 7} width={i === 1 ? 34 : 50} height="3.5" rx="1.7" fill="#ffffff" opacity="0.16" />
          </g>
        ))}
        <circle cx="530" cy="47" r="4" fill="#34d399" />
        <circle cx="530" cy="47" r="4" fill="none" stroke="#34d399" strokeWidth="1.2" className="sp-live" />
        <circle cx="486" cy="75" r="46" fill={`url(#${gid}-glow)`} opacity="0.4" />
      </g>

      {/* ---- labels ---- */}
      <g fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="9.5" fill="#64748b" textAnchor="middle" letterSpacing="1.2">
        <text x="76" y="134">notebook.ipynb</text>
        <text x="281" y="134">train</text>
        <text x="486" y="134">production</text>
      </g>
    </svg>
  )
}

export default ShipPipeline
