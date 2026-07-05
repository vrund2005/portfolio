import { scrollToId } from '../lib/scroll'

/**
 * Fixed scroll HUD (desktop only):
 * - Right rail: one dot per section, tinted to match the 3D scene's palette
 * - Bottom-left: terminal-style "pipeline phase" readout that follows scroll
 */

const railItems = [
  { id: 'home', label: 'Data', dot: 'bg-violet-400', glow: 'shadow-violet-400/60' },
  { id: 'about', label: 'Model', dot: 'bg-cyan-300', glow: 'shadow-cyan-300/60' },
  { id: 'skills', label: 'Stack', dot: 'bg-emerald-300', glow: 'shadow-emerald-300/60' },
  { id: 'projects', label: 'Ship', dot: 'bg-amber-300', glow: 'shadow-amber-300/60' },
  { id: 'contact', label: 'Connect', dot: 'bg-rose-300', glow: 'shadow-rose-300/60' },
]

const phases = {
  home: { num: '01', label: 'ingesting data', color: 'text-violet-300' },
  about: { num: '02', label: 'training the model', color: 'text-cyan-300' },
  skills: { num: '03', label: 'optimizing the stack', color: 'text-emerald-300' },
  projects: { num: '04', label: 'shipping projects', color: 'text-amber-300' },
  contact: { num: '05', label: 'connection open', color: 'text-rose-300' },
}

function ScrollHud({ activeSection }) {
  const phase = phases[activeSection] ?? phases.home

  return (
    <>
      {/* Section rail */}
      <nav
        aria-label="Section navigation"
        className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-5 lg:flex"
      >
        {railItems.map((item) => {
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToId(item.id)}
              aria-label={`Go to ${item.label}`}
              className="group flex cursor-pointer items-center gap-3"
            >
              <span
                className={`font-mono text-[10px] uppercase tracking-[0.25em] transition-all duration-300 ${
                  isActive ? 'text-slate-200 opacity-100' : 'translate-x-2 text-slate-500 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                }`}
              >
                {item.label}
              </span>
              <span
                className={`block rounded-full transition-all duration-300 ${item.dot} ${
                  isActive ? `h-2.5 w-2.5 shadow-[0_0_12px_2px] ${item.glow}` : 'h-1.5 w-1.5 opacity-40 group-hover:opacity-80'
                }`}
              />
            </button>
          )
        })}
      </nav>

      {/* Pipeline phase readout */}
      <div
        aria-hidden="true"
        className="fixed bottom-6 left-6 z-40 hidden items-center gap-2 font-mono text-[11px] tracking-wide text-slate-500 lg:flex"
      >
        <span className="text-slate-600">[</span>
        <span className={phase.color}>{phase.num}</span>
        <span className="text-slate-600">/05 ]</span>
        <span className={`transition-colors duration-500 ${phase.color}`}>{phase.label}</span>
        <span className={`inline-block h-3 w-1.5 animate-pulse ${phase.color.replace('text-', 'bg-')}`} />
      </div>
    </>
  )
}

export default ScrollHud
