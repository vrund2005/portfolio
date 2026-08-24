import { useId } from 'react'

/**
 * Animated cover artwork for a post.
 *
 * Which motif a post gets is decided in this order:
 *   1. the post's own `art:` frontmatter value  (explicit, always wins)
 *   2. a score over the post's own tags          (automatic fallback)
 *
 * Both inputs come only from the post itself, so adding, removing or
 * reordering posts can never change the artwork of an existing one.
 *
 * To add a motif later: draw a component, add it to MOTIFS, and list the
 * tags that should select it in MOTIF_TAGS. Nothing else needs to change.
 *
 * Drawn wide and painted with `slice` so it always fills its container;
 * only the ambient decoration at the edges is ever cropped.
 */

const MOTIF_TAGS = {
  graph: ['agentic ai', 'agenticai', 'langgraph', 'mcp', 'fastmcp', 'agent', 'agents', 'orchestration'],
  retrieval: ['rag', 'faiss', 'chromadb', 'embeddings', 'embedding', 'vector', 'vectordb', 'bm25', 'retrieval', 'langchain', 'llamaindex', 'genai', 'gemini'],
  pipeline: ['n8n', 'automation', 'etl', 'pipeline', 'workflow', 'airflow', 'scraping', 'api', 'fastapi'],
  vision: ['computer vision', 'opencv', 'cnn', 'yolo', 'mediapipe', 'image classification', 'whisper'],
  chart: ['power bi', 'powerbi', 'dashboard', 'business intelligence', 'data visualization', 'tableau', 'analytics', 'sql', 'ml', 'nlp'],
  vector: ['vector', 'vector database', 'vectordb', 'hnsw', 'ivf', 'ann', 'pgvector', 'qdrant', 'pinecone', 'weaviate', 'milvus', 'index'],
}

// Tie-break order when two motifs score equally — fixed, so it never drifts
const MOTIF_PRIORITY = ['graph', 'vector', 'retrieval', 'vision', 'pipeline', 'chart', 'flow']

function pickKind(art, tags = []) {
  if (art && MOTIF_PRIORITY.includes(art)) return art

  const lower = tags.map((tag) => tag.toLowerCase().trim())
  let best = 'flow'
  let bestScore = 0

  for (const kind of MOTIF_PRIORITY) {
    const list = MOTIF_TAGS[kind]
    if (!list) continue
    const score = lower.filter((tag) => list.includes(tag)).length
    if (score > bestScore) {
      best = kind
      bestScore = score
    }
  }

  return best
}

/* ---------- Ambient layer: fills the frame behind every motif ---------- */

const DUST = [
  [28, 54], [62, 168], [96, 92], [124, 32], [150, 196], [188, 74], [214, 148],
  [246, 40], [286, 190], [318, 30], [352, 198], [386, 42], [420, 186], [452, 62],
  [488, 150], [512, 36], [548, 176], [578, 88], [604, 42], [628, 152], [16, 118],
  [78, 208], [268, 208], [466, 210], [596, 200], [340, 14], [126, 132], [510, 108],
]

function Ambient({ c1, gid }) {
  return (
    <g aria-hidden="true">
      <rect x="0" y="0" width="640" height="220" fill={`url(#${gid}-wash)`} />

      <line x1="0" y1="196" x2="640" y2="196" stroke={c1} strokeWidth="0.5" opacity="0.1" />
      {Array.from({ length: 21 }, (_, i) => i * 32).map((x) => (
        <line key={x} x1={x} y1="192" x2={x} y2="196" stroke={c1} strokeWidth="0.5" opacity="0.14" />
      ))}

      {DUST.map(([x, y], i) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={i % 4 === 0 ? 1.6 : 1}
          fill={c1}
          opacity="0.28"
          className="ca-drift"
          style={{ animationDelay: `${(i % 6) * 0.8}s` }}
        />
      ))}
    </g>
  )
}

/* ---------- graph: agent workflow with a feedback loop ---------- */

const NODES = [
  { x: 170, y: 110, r: 5 },
  { x: 245, y: 68, r: 4.5 },
  { x: 245, y: 152, r: 4.5 },
  { x: 320, y: 110, r: 6.5 },
  { x: 395, y: 66, r: 4.5 },
  { x: 395, y: 154, r: 4.5 },
  { x: 470, y: 110, r: 5 },
]

const EDGES = [
  'M170,110 C 202,110 213,68 245,68',
  'M170,110 C 202,110 213,152 245,152',
  'M245,68 C 278,68 290,110 320,110',
  'M245,152 C 278,152 290,110 320,110',
  'M320,110 C 352,110 364,66 395,66',
  'M320,110 C 352,110 364,154 395,154',
  'M395,66 C 428,66 440,110 470,110',
  'M395,154 C 428,154 440,110 470,110',
]

const LOOP = 'M395,154 C 376,180 338,178 320,158'

function GraphArt({ c1, c2, gid }) {
  return (
    <>
      <g stroke={`url(#${gid}-line)`} fill="none" strokeLinecap="round">
        {EDGES.map((d) => (
          <path key={d} d={d} strokeWidth="1" opacity="0.3" />
        ))}
        <path d={LOOP} strokeWidth="1" opacity="0.24" strokeDasharray="3 4" />
        {EDGES.map((d, i) => (
          <path key={`p-${d}`} d={d} strokeWidth="1.6" className="ca-pulse" style={{ animationDelay: `${i * 0.45}s` }} />
        ))}
      </g>

      {NODES.map((node, i) => (
        <g key={`${node.x}-${node.y}`}>
          <circle cx={node.x} cy={node.y} r={node.r} className="ca-ring" fill="none" stroke={i === 3 ? c2 : c1} strokeWidth="1" style={{ animationDelay: `${i * 0.5}s` }} />
          <circle cx={node.x} cy={node.y} r={node.r} fill={i === 3 ? c2 : c1} opacity="0.9" />
          <circle cx={node.x} cy={node.y} r={node.r + 6} fill={`url(#${gid}-glow)`} opacity="0.5" />
        </g>
      ))}
    </>
  )
}

/* ---------- retrieval: a query reaching into a vector cloud ---------- */

const CLOUD = [
  [300, 62], [334, 50], [372, 68], [404, 56], [432, 80], [318, 88], [354, 98],
  [386, 88], [422, 110], [298, 116], [332, 128], [370, 120], [400, 138], [434, 146],
  [314, 156], [348, 166], [382, 158], [416, 170], [290, 142], [356, 60], [444, 124],
]

const HITS = [6, 10, 11, 16]

function RetrievalArt({ c1, c2, gid }) {
  return (
    <>
      <g>
        {[0, 1, 2].map((i) => (
          <circle key={i} cx="196" cy="110" r="12" fill="none" stroke={c2} strokeWidth="1" className="ca-sonar" style={{ animationDelay: `${i * 1.1}s` }} />
        ))}
        <circle cx="196" cy="110" r="7" fill={c2} opacity="0.9" />
        <circle cx="196" cy="110" r="18" fill={`url(#${gid}-glow)`} opacity="0.6" />
      </g>

      <g stroke={`url(#${gid}-line)`} fill="none" strokeLinecap="round">
        {HITS.map((index, i) => {
          const [x, y] = CLOUD[index]
          return (
            <path
              key={index}
              d={`M196,110 Q ${(196 + x) / 2},${110 + (y - 110) * 0.32} ${x},${y}`}
              strokeWidth="1.4"
              className="ca-pulse"
              style={{ animationDelay: `${i * 0.6}s` }}
            />
          )
        })}
      </g>

      {CLOUD.map(([x, y], i) => {
        const hit = HITS.includes(i)
        return (
          <circle
            key={`${x}-${y}`}
            cx={x}
            cy={y}
            r={hit ? 3.8 : 2.3}
            fill={hit ? c1 : '#94a3b8'}
            opacity={hit ? 0.95 : 0.32}
            className={hit ? 'ca-blink' : 'ca-drift'}
            style={{ animationDelay: `${(i % 7) * 0.5}s` }}
          />
        )
      })}
    </>
  )
}

/* ---------- pipeline: staged processing with packets in transit ---------- */

const STAGES = [175, 273, 371, 469]

function PipelineArt({ c1, c2, gid }) {
  return (
    <>
      <line x1="175" y1="110" x2="469" y2="110" stroke={`url(#${gid}-line)`} strokeWidth="1" opacity="0.3" />

      {STAGES.slice(0, -1).map((x, i) => (
        <path
          key={x}
          d={`M${x + 26},110 L${STAGES[i + 1] - 26},110`}
          stroke={`url(#${gid}-line)`}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          className="ca-packet"
          style={{ animationDelay: `${i * 0.7}s` }}
        />
      ))}

      {STAGES.map((x, i) => (
        <g key={x}>
          <rect
            x={x - 26}
            y="86"
            width="52"
            height="48"
            rx="11"
            fill="#0b0f1c"
            fillOpacity="0.55"
            stroke={i === 3 ? c2 : c1}
            strokeWidth="1.6"
            className="ca-blink"
            style={{ animationDelay: `${i * 0.7}s` }}
          />
          <rect x={x - 13} y="103" width="26" height="3" rx="1.5" fill={i === 3 ? c2 : c1} opacity="0.85" />
          <rect x={x - 13} y="112" width="16" height="3" rx="1.5" fill={i === 3 ? c2 : c1} opacity="0.5" />
          <circle cx={x} cy="110" r="30" fill={`url(#${gid}-glow)`} opacity="0.32" />
        </g>
      ))}
    </>
  )
}

/* ---------- vision: a scanning frame with detections ---------- */

const BOXES = [
  { x: 232, y: 82, w: 62, h: 50 },
  { x: 350, y: 108, w: 78, h: 54 },
  { x: 300, y: 66, w: 44, h: 36 },
]

function VisionArt({ c1, c2, gid }) {
  const L = 196
  const R = 444
  const T = 56
  const B = 168

  return (
    <>
      {/* corner brackets */}
      <g stroke={c1} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.85">
        <path d={`M${L},${T + 20} L${L},${T} L${L + 20},${T}`} />
        <path d={`M${R - 20},${T} L${R},${T} L${R},${T + 20}`} />
        <path d={`M${R},${B - 20} L${R},${B} L${R - 20},${B}`} />
        <path d={`M${L + 20},${B} L${L},${B} L${L},${B - 20}`} />
      </g>

      {/* scan sweep */}
      <g className="ca-scan">
        <line x1={L} y1={T} x2={R} y2={T} stroke={c2} strokeWidth="1.8" opacity="0.9" />
        <rect x={L} y={T - 16} width={R - L} height="16" fill={`url(#${gid}-scan)`} />
      </g>

      {/* detections */}
      {BOXES.map((b, i) => (
        <g key={b.x} className="ca-blink" style={{ animationDelay: `${i * 1.05}s` }}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="4" fill="none" stroke={i === 1 ? c2 : c1} strokeWidth="1.6" />
          <rect x={b.x} y={b.y - 8} width="22" height="6" rx="3" fill={i === 1 ? c2 : c1} opacity="0.9" />
        </g>
      ))}

      <circle cx="320" cy="112" r="2.6" fill={c2} />
      <path d="M310,112 L316,112 M324,112 L330,112 M320,102 L320,108 M320,116 L320,122" stroke={c2} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
    </>
  )
}

/* ---------- chart: bars rising under a trend line ---------- */

const BARS = [
  { x: 196, h: 44 }, { x: 232, h: 70 }, { x: 268, h: 56 }, { x: 304, h: 88 },
  { x: 340, h: 74 }, { x: 376, h: 104 }, { x: 412, h: 90 }, { x: 448, h: 118 },
]

function ChartArt({ c2, gid }) {
  const base = 172
  return (
    <>
      {BARS.map((bar, i) => (
        <rect
          key={bar.x}
          x={bar.x}
          y={base - bar.h}
          width="22"
          height={bar.h}
          rx="4"
          fill={`url(#${gid}-bar)`}
          className="ca-grow"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}

      <path
        d={`M207,${base - 52} L243,${base - 78} L279,${base - 64} L315,${base - 96} L351,${base - 82} L387,${base - 112} L423,${base - 98} L459,${base - 126}`}
        fill="none"
        stroke={`url(#${gid}-line)`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
      <path
        d={`M207,${base - 52} L243,${base - 78} L279,${base - 64} L315,${base - 96} L351,${base - 82} L387,${base - 112} L423,${base - 98} L459,${base - 126}`}
        fill="none"
        stroke={c2}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ca-trend"
      />
      <circle cx="459" cy={base - 126} r="4.5" fill={c2} className="ca-blink" />
      <circle cx="459" cy={base - 126} r="14" fill={`url(#${gid}-glow)`} opacity="0.6" />
    </>
  )
}

/* ---------- vector: an HNSW-style layered index, searched top-down ---------- */

// Sparse at the top, dense at the bottom — how a hierarchical ANN index is built
const LAYERS = [
  { y: 58, xs: [232, 300, 368, 436], r: 3.6 },
  { y: 110, xs: [200, 246, 292, 338, 384, 430, 470], r: 3.2 },
  { y: 162, xs: [180, 213, 246, 279, 312, 345, 378, 411, 444, 477], r: 2.8 },
]

// The greedy descent: entry point → closer node one level down → nearest neighbour
const DESCENT = ['M232,58 L292,110', 'M292,110 L312,162']

function VectorArt({ c1, c2, gid }) {
  return (
    <>
      {/* layer plates */}
      {LAYERS.map((layer, i) => (
        <g key={layer.y}>
          <line
            x1={layer.xs[0] - 26}
            y1={layer.y}
            x2={layer.xs[layer.xs.length - 1] + 26}
            y2={layer.y}
            stroke={c1}
            strokeWidth="0.7"
            opacity={0.14 + i * 0.04}
          />
          <text
            x={layer.xs[0] - 40}
            y={layer.y + 3.5}
            fill={c1}
            opacity="0.4"
            fontSize="8"
            fontFamily="ui-monospace, monospace"
            textAnchor="end"
          >
            L{LAYERS.length - 1 - i}
          </text>
        </g>
      ))}

      {/* intra-layer neighbour links */}
      <g stroke={c1} strokeWidth="0.7" opacity="0.22">
        {LAYERS.map((layer) =>
          layer.xs.slice(0, -1).map((x, i) => (
            <line key={`${layer.y}-${x}`} x1={x} y1={layer.y} x2={layer.xs[i + 1]} y2={layer.y} />
          )),
        )}
      </g>

      {/* nodes */}
      {LAYERS.map((layer, li) =>
        layer.xs.map((x, i) => (
          <circle
            key={`${layer.y}-${x}-n`}
            cx={x}
            cy={layer.y}
            r={layer.r}
            fill={c1}
            opacity="0.55"
            className="ca-blink"
            style={{ animationDelay: `${(li * 0.4 + i * 0.18) % 2.8}s` }}
          />
        )),
      )}

      {/* the descent path */}
      <g stroke={`url(#${gid}-line)`} fill="none" strokeLinecap="round">
        {DESCENT.map((d) => (
          <path key={d} d={d} strokeWidth="1.2" opacity="0.35" />
        ))}
        {DESCENT.map((d, i) => (
          <path
            key={`p-${d}`}
            d={d}
            strokeWidth="2"
            className="ca-pulse"
            style={{ animationDelay: `${i * 0.5}s` }}
          />
        ))}
      </g>

      {/* entry point and the hit it lands on */}
      <g>
        <circle cx="232" cy="58" r="5.5" fill={c2} />
        <circle cx="232" cy="58" r="5.5" fill="none" stroke={c2} strokeWidth="1" className="ca-ring" />
        <circle cx="232" cy="58" r="14" fill={`url(#${gid}-glow)`} opacity="0.55" />
      </g>
      <g>
        <circle cx="312" cy="162" r="5.5" fill={c2} />
        <circle
          cx="312"
          cy="162"
          r="5.5"
          fill="none"
          stroke={c2}
          strokeWidth="1"
          className="ca-ring"
          style={{ animationDelay: '1s' }}
        />
        <circle cx="312" cy="162" r="16" fill={`url(#${gid}-glow)`} opacity="0.6" />
      </g>
    </>
  )
}

/* ---------- flow: drifting signal lines (fallback) ---------- */

function FlowArt({ c1, c2, gid }) {
  return (
    <>
      <g fill="none" stroke={`url(#${gid}-line)`} strokeLinecap="round">
        {[0, 1, 2, 3].map((i) => (
          <path
            key={i}
            d={`M-60,${80 + i * 20} C 80,${48 + i * 20} 200,${112 + i * 20} 340,${80 + i * 20} S 600,${48 + i * 20} 740,${80 + i * 20}`}
            strokeWidth={i === 1 ? 1.6 : 1}
            opacity={i === 1 ? 0.7 : 0.32}
            className="ca-slide"
            style={{ animationDelay: `${i * 1.4}s` }}
          />
        ))}
      </g>
      {[[196, 78], [300, 126], [412, 70], [486, 134]].map(([x, y], i) => (
        <circle key={x} cx={x} cy={y} r="3.4" fill={i % 2 ? c2 : c1} className="ca-blink" style={{ animationDelay: `${i * 0.8}s` }} />
      ))}
    </>
  )
}

const MOTIFS = {
  graph: GraphArt,
  retrieval: RetrievalArt,
  pipeline: PipelineArt,
  vision: VisionArt,
  vector: VectorArt,
  chart: ChartArt,
  flow: FlowArt,
}

/* ------------------------------------------------------------------ */

function CoverArt({ tags = [], art, accent, className = '' }) {
  const rawId = useId()
  const gid = `ca${rawId.replace(/:/g, '')}`
  const c1 = accent?.c1 ?? '#a78bfa'
  const c2 = accent?.c2 ?? '#22d3ee'
  const Motif = MOTIFS[pickKind(art, tags)] ?? FlowArt

  return (
    <svg
      viewBox="0 0 640 220"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Decorative animation representing this article's topic"
      className={className}
    >
      <defs>
        <linearGradient id={`${gid}-line`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
        <linearGradient id={`${gid}-bar`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c2} stopOpacity="0.85" />
          <stop offset="100%" stopColor={c1} stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id={`${gid}-scan`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={c2} stopOpacity="0.35" />
          <stop offset="100%" stopColor={c2} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${gid}-glow`}>
          <stop offset="0%" stopColor={c1} stopOpacity="0.55" />
          <stop offset="100%" stopColor={c1} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${gid}-wash`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={c1} stopOpacity="0.14" />
          <stop offset="100%" stopColor={c1} stopOpacity="0" />
        </radialGradient>
      </defs>

      <style>{`
        .ca-pulse, .ca-packet {
          stroke-dasharray: 26 210;
          stroke-dashoffset: 236;
          opacity: 0;
        }
        .ca-packet { stroke-dasharray: 14 120; stroke-dashoffset: 134; }
        .ca-trend { stroke-dasharray: 300; stroke-dashoffset: 300; }
        .ca-ring, .ca-sonar, .ca-breathe { transform-box: fill-box; transform-origin: center; }
        .ca-grow { transform-box: fill-box; transform-origin: bottom; }
        .ca-scan { transform-box: fill-box; transform-origin: center; }
        @media (prefers-reduced-motion: no-preference) {
          .ca-pulse { animation: ca-travel 3.6s linear infinite; }
          .ca-packet { animation: ca-move 2.4s linear infinite; }
          .ca-ring { animation: ca-ring 3.2s ease-out infinite; }
          .ca-sonar { animation: ca-sonar 3.3s ease-out infinite; opacity: 0; }
          .ca-blink { animation: ca-blink 2.8s ease-in-out infinite; }
          .ca-drift { animation: ca-drift 5s ease-in-out infinite; }
          .ca-slide { animation: ca-slide 9s linear infinite; }
          .ca-breathe { animation: ca-breathe 7s ease-in-out infinite; }
          .ca-grow { animation: ca-grow 4.5s ease-in-out infinite; }
          .ca-trend { animation: ca-draw 5s ease-in-out infinite; }
          .ca-scan { animation: ca-sweep 4.2s ease-in-out infinite; }
        }
        @keyframes ca-travel {
          0% { stroke-dashoffset: 236; opacity: 0; }
          12% { opacity: 0.95; }
          70% { opacity: 0.95; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        @keyframes ca-move {
          0% { stroke-dashoffset: 134; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0; }
        }
        @keyframes ca-ring {
          0% { transform: scale(1); opacity: 0.7; }
          70%, 100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes ca-sonar {
          0% { transform: scale(0.5); opacity: 0.8; }
          80%, 100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes ca-blink {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }
        @keyframes ca-drift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes ca-slide {
          0% { transform: translateX(0); }
          100% { transform: translateX(-400px); }
        }
        @keyframes ca-breathe {
          0%, 100% { transform: scale(1); opacity: 0.05; }
          50% { transform: scale(1.06); opacity: 0.1; }
        }
        @keyframes ca-grow {
          0%, 100% { transform: scaleY(0.35); opacity: 0.55; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        @keyframes ca-draw {
          0% { stroke-dashoffset: 300; }
          55%, 80% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -300; }
        }
        @keyframes ca-sweep {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(112px); }
        }
      `}</style>

      <Ambient c1={c1} gid={gid} />
      <Motif c1={c1} c2={c2} gid={gid} />
    </svg>
  )
}

export default CoverArt
