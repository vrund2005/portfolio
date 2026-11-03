import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { useLenis } from '../hooks/useLenis'
import { useFinePointer, useMediaQuery, useReducedMotion } from '../hooks/useMediaQuery'
import { applySeo, breadcrumbJsonLd } from '../lib/seo'
import { games, STATUS_LABEL } from '../data/games'
import { stage } from './games/store'
import GameArt from './games/GameArt'
import './games/games.css'

// WebGL is the heaviest part of the page: load it after first paint.
const ThermalField = lazy(() => import('./games/ThermalField'))

const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;900&family=Martian+Mono:wght@300;400;600&family=Instrument+Sans:wght@400;500;600&display=swap'

const BEATS = [
  { word: 'SEE', n: '01', line: 'A plain webcam frame, thirty times a second. No depth sensor, no gloves, no controller.' },
  { word: 'TRACK', n: '02', line: '21 landmarks per hand, smoothed so a shaky fingertip still draws a steady line.' },
  { word: 'PLAY', n: '03', line: 'Gestures become inputs. Point to draw, pinch to grab, swipe to slice. Your hand is the controller.' },
]

const BOOT_LINES = [
  'VRCADE/OS 1.0 — cold boot',
  'mounting thermal renderer ........ ok',
  'loading hand landmarker ........... ok',
  '21 landmarks online · 0 controllers found',
  'PRESS ANY HAND TO CONTINUE',
]

const CARBON = '#0b0a09'
const BONE = '#ece6da'
const INK = '#14110e'

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const smooth = (v) => v * v * (3 - 2 * v)

function Boot({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1900)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="vrc-boot" aria-hidden="true">
      <div className="vrc-boot-lines">
        {BOOT_LINES.map((l, i) => (
          <p key={l} style={{ animationDelay: `${i * 0.24}s` }} className={i === BOOT_LINES.length - 1 ? 'is-hot' : ''}>
            {l}
          </p>
        ))}
      </div>
      <div className="vrc-boot-bar"><i /></div>
    </div>
  )
}

function Reticle() {
  const ref = useRef(null)
  const label = useRef(null)
  useEffect(() => {
    const el = ref.current
    const xTo = gsap.quickTo(el, 'x', { duration: 0.25, ease: 'power3' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.25, ease: 'power3' })
    const move = (e) => {
      xTo(e.clientX)
      yTo(e.clientY)
      const target = e.target.closest?.('[data-cursor]')
      el.classList.toggle('is-target', !!target)
      label.current.textContent = target ? target.dataset.cursor : ''
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])
  return (
    <div ref={ref} className="vrc-reticle" aria-hidden="true">
      <i /><i /><i /><i />
      <span ref={label} />
    </div>
  )
}

function GameCard({ game, index }) {
  const ref = useRef(null)
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    ref.current.style.setProperty('--mx', `${x * 100}%`)
    ref.current.style.setProperty('--my', `${y * 100}%`)
    ref.current.style.setProperty('--rx', `${(0.5 - y) * 8}deg`)
    ref.current.style.setProperty('--ry', `${(x - 0.5) * 10}deg`)
  }
  const onLeave = () => {
    ref.current.style.setProperty('--rx', '0deg')
    ref.current.style.setProperty('--ry', '0deg')
  }
  const live = game.status === 'live'
  return (
    <article
      ref={ref}
      className={`vrc-card is-${game.status}`}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      data-cursor={live ? 'PLAY' : 'SOON'}
    >
      <div className="vrc-card-inner">
        <header className="vrc-card-top">
          <span className="vrc-card-n">{String(index + 1).padStart(2, '0')}</span>
          <span className={`vrc-chip is-${game.status}`}>
            {live && <i className="vrc-dot" />}
            {STATUS_LABEL[game.status]}
          </span>
        </header>
        <GameArt kind={game.art} />
        <p className="vrc-card-kicker">{game.kicker}</p>
        <h3 className="vrc-card-title">{game.title}</h3>
        <p className="vrc-card-blurb">{game.blurb}</p>
        <ul className="vrc-card-controls">
          {game.controls.map((c) => <li key={c}>{c}</li>)}
        </ul>
        <footer className="vrc-card-foot">
          <span className="vrc-card-meta">{game.players} · {game.tech.join(' · ')}</span>
          {live ? (
            <a className="vrc-play" href={game.url} target="_blank" rel="noopener noreferrer">
              Play now <span aria-hidden="true">→</span>
            </a>
          ) : (
            <span className="vrc-play is-off">{game.status === 'porting' ? 'In the lab' : 'Desktop only'}</span>
          )}
        </footer>
      </div>
    </article>
  )
}

export default function Games() {
  const reduced = useReducedMotion()
  const finePointer = useFinePointer()
  const mobile = useMediaQuery('(max-width: 767px)')
  const [booting, setBooting] = useState(() => {
    if (typeof window === 'undefined') return false
    try { return !reduced && !sessionStorage.getItem('vrc-booted') } catch { return !reduced }
  })
  const [showField, setShowField] = useState(false)
  const root = useRef(null)
  const hud = useRef({})
  const [countdown, setCountdown] = useState(9)

  useLenis(!reduced)

  useEffect(() => {
    applySeo({
      title: 'VRCADE — Hand-tracking games by Vrund Patel',
      description:
        'Browser games you play with your hands: computer-vision games by Vrund Patel built on real-time hand tracking. Draw in the air, slice fruit with your fingers, cast spells.',
      path: '/games',
      jsonLd: breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Games', path: '/games' },
      ]),
    })
    // page-only fonts
    let link = document.querySelector('link[data-vrc-fonts]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = FONTS_HREF
      link.dataset.vrcFonts = ''
      document.head.appendChild(link)
    }
    // match overscroll / rubber-band colour to the page
    const prevBg = document.documentElement.style.background
    document.documentElement.style.background = CARBON
    const t = setTimeout(() => setShowField(true), 60)
    return () => {
      clearTimeout(t)
      document.documentElement.style.background = prevBg
      stage.morph = 0
      stage.light = 0
    }
  }, [])

  const finishBoot = () => {
    try { sessionStorage.setItem('vrc-booted', '1') } catch { /* private mode */ }
    setBooting(false)
  }

  // Particles assemble into the hand once the page is ready.
  useEffect(() => {
    if (reduced) { stage.morph = 1; return undefined }
    stage.morph = 0
    const tween = gsap.to(stage, { morph: 1, duration: 2.4, ease: 'expo.out', delay: booting ? 1.2 : 0.2 })
    return () => tween.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced])

  // Pointer → particles + live landmark readout in the hero HUD.
  useEffect(() => {
    let raf = 0
    let last = null
    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return
      last = e
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const x = last.clientX / window.innerWidth
        const y = last.clientY / window.innerHeight
        stage.pointer.x = x * 2 - 1
        stage.pointer.y = -(y * 2 - 1)
        stage.pointer.active = true
        if (hud.current.x) hud.current.x.textContent = x.toFixed(3)
        if (hud.current.y) hud.current.y.textContent = y.toFixed(3)
      })
    }
    const onOut = () => { stage.pointer.active = false }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onOut)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onOut)
      stage.pointer.active = false
    }
  }, [])

  // All scroll choreography.
  useLayoutEffect(() => {
    const el = root.current
    if (!el) return undefined
    const lerpBg = gsap.utils.interpolate(CARBON, BONE)
    const lerpFg = gsap.utils.interpolate(BONE, INK)
    const setTheme = (p) => {
      el.style.setProperty('--bg', lerpBg(p))
      el.style.setProperty('--fg', lerpFg(p))
      el.style.setProperty('--light', p.toFixed(3))
      document.documentElement.style.background = lerpBg(p)
    }
    setTheme(0)

    // gsap.context() doesn't own ticker callbacks, so track and remove them ourselves
    const tickers = []
    const addTick = (fn) => { gsap.ticker.add(fn); tickers.push(fn) }

    const ctx = gsap.context(() => {
      // page progress → side ruler + sector readout
      const sectors = ['BOOT', 'CALIBRATE', 'INSERT COIN', 'SELECT', 'CONTINUE']
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          el.style.setProperty('--progress', self.progress.toFixed(4))
          stage.velocity = self.getVelocity()
          if (hud.current.pct) hud.current.pct.textContent = String(Math.round(self.progress * 100)).padStart(3, '0')
          const idx = Math.min(sectors.length - 1, Math.floor(self.progress * sectors.length * 0.999))
          if (hud.current.sector && hud.current.sector.textContent !== sectors[idx]) hud.current.sector.textContent = sectors[idx]
        },
      })
      addTick(() => { stage.velocity *= 0.92 })

      if (reduced) {
        // static, readable page: no pinning, beats simply listed
        ScrollTrigger.create({
          trigger: '#select',
          start: 'top 70%',
          onEnter: () => { setTheme(1); stage.light = 1; stage.morph = 5 },
          onLeaveBack: () => { setTheme(0); stage.light = 0; stage.morph = 1 },
        })
        return
      }

      // Hero: title letters lift off at different speeds as you scroll away.
      gsap.utils.toArray('.vrc-title .ch').forEach((ch, i) => {
        gsap.to(ch, {
          yPercent: -60 - ((i * 37) % 5) * 22,
          rotate: ((i % 2 ? 1 : -1) * (6 + (i * 13) % 9)),
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: '.vrc-hero', start: 'top top', end: 'bottom 30%', scrub: true },
        })
      })
      gsap.to('.vrc-hero-copy, .vrc-hud', {
        opacity: 0,
        y: -40,
        ease: 'none',
        scrollTrigger: { trigger: '.vrc-hero', start: '20% top', end: '70% top', scrub: true },
      })

      // Manifesto: pinned (CSS sticky); particles hold each shape while its word is on screen.
      const beats = gsap.utils.toArray('.vrc-beat')
      const bar = el.querySelector('.vrc-beats-bar i')
      ScrollTrigger.create({
        trigger: '.vrc-manifesto',
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const q = self.progress * 3
          const i = Math.min(2, Math.floor(q))
          const f = q - i
          stage.morph = 1 + i + smooth(clamp01(f / 0.45))
          beats.forEach((b, k) => {
            const local = q - k
            const vin = clamp01((local - 0.12) / 0.25)
            const vout = k === 2 ? 0 : clamp01((local - 0.88) / 0.12)
            const v = smooth(vin) * (1 - smooth(vout))
            b.style.opacity = v
            b.style.setProperty('--reveal', v.toFixed(3))
            b.style.transform = `translate3d(0, ${(1 - vin) * 60 - vout * 60}px, 0)`
          })
          if (bar) bar.style.transform = `scaleX(${self.progress})`
        },
        onLeaveBack: () => { stage.morph = 1 },
      })

      // Crossing into game select: carbon → bone, particles flatten into the floor.
      ScrollTrigger.create({
        trigger: '#select',
        start: 'top 95%',
        end: 'top 15%',
        onUpdate: (self) => {
          const p = smooth(self.progress)
          setTheme(p)
          stage.light = p
          stage.morph = 4 + p
        },
      })

      // Marquee: runs constantly, speeds up and flips direction with scroll velocity.
      const strip = el.querySelector('.vrc-marquee-track')
      if (strip) {
        let x = 0
        let dir = -1
        const tick = (_t, dt) => {
          const v = stage.velocity
          if (Math.abs(v) > 30) dir = v > 0 ? -1 : 1
          x += dir * (0.06 + Math.min(1.2, Math.abs(v) / 2500)) * dt
          const w = strip.scrollWidth / 2
          if (x < -w) x += w
          if (x > 0) x -= w
          strip.style.transform = `translate3d(${x}px,0,0) skewX(${Math.max(-12, Math.min(12, -v / 260))}deg)`
        }
        addTick(tick)
      }

      // Desktop: game select scrolls sideways like a cartridge shelf.
      const mm = gsap.matchMedia()
      mm.add('(min-width: 1024px)', () => {
        const wrap = el.querySelector('.vrc-shelf')
        const track = el.querySelector('.vrc-track')
        if (!wrap || !track) return undefined
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth + 64)
        const size = () => { wrap.style.height = `${distance() + window.innerHeight}px` }
        size()
        const st = ScrollTrigger.create({
          trigger: wrap,
          start: 'top top',
          end: 'bottom bottom',
          invalidateOnRefresh: true,
          onRefreshInit: size,
          onUpdate: (self) => {
            track.style.transform = `translate3d(${-self.progress * distance()}px,0,0)`
            el.style.setProperty('--shelf', self.progress.toFixed(3))
          },
        })
        return () => { st.kill(); wrap.style.height = ''; track.style.transform = '' }
      })

      // Cartridges slot in one after another when the shelf arrives
      gsap.from('.vrc-card', {
        y: 90,
        opacity: 0,
        rotate: 2,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.07,
        scrollTrigger: { trigger: '.vrc-select', start: 'top 55%', toggleActions: 'play none none reverse' },
      })
    }, el)

    // fonts / WebGL loading shift layout: re-measure once settled
    const r = setTimeout(() => ScrollTrigger.refresh(), 900)
    return () => {
      clearTimeout(r)
      tickers.forEach((fn) => gsap.ticker.remove(fn))
      ctx.revert()
    }
  }, [reduced])

  // CONTINUE? countdown, only while the footer is on screen
  useEffect(() => {
    const foot = document.querySelector('.vrc-foot')
    if (!foot) return undefined
    let timer = 0
    const io = new IntersectionObserver(([entry]) => {
      clearInterval(timer)
      if (entry.isIntersecting && !reduced) {
        setCountdown(9)
        timer = setInterval(() => setCountdown((c) => (c <= 0 ? 9 : c - 1)), 900)
      }
    })
    io.observe(foot)
    return () => { io.disconnect(); clearInterval(timer) }
  }, [reduced])

  const liveCount = games.filter((g) => g.status === 'live').length

  return (
    <div ref={root} className={`vrc${finePointer && !reduced ? ' has-reticle' : ''}${reduced ? ' is-reduced' : ''}`}>
      <div className="vrc-bg" aria-hidden="true" />
      {showField && (
        <Suspense fallback={null}>
          <ThermalField mobile={mobile} />
        </Suspense>
      )}
      <div className="vrc-grain" aria-hidden="true" />
      <div className="vrc-scanlines" aria-hidden="true" />
      {booting && <Boot onDone={finishBoot} />}
      {finePointer && !reduced && <Reticle />}

      <header className="vrc-top">
        <Link to="/" className="vrc-back" data-cursor="EXIT">
          <span aria-hidden="true">←</span> vrund.dev
        </Link>
        <span className="vrc-brand">VRCADE</span>
        <span className="vrc-sector">
          <span ref={(n) => { hud.current.sector = n }}>BOOT</span>
          <b ref={(n) => { hud.current.pct = n }}>000</b>
        </span>
      </header>

      <div className="vrc-ruler" aria-hidden="true">
        <i className="vrc-ruler-fill" />
        {Array.from({ length: 21 }, (_, i) => <b key={i} style={{ top: `${i * 5}%` }} className={i % 5 === 0 ? 'major' : ''} />)}
      </div>

      <main>
        <section className="vrc-hero" aria-labelledby="vrc-title">
          <div className="vrc-hud" aria-hidden="true">
            <span className="tl">CAM_00 · HAND_LANDMARKER · 30FPS</span>
            <span className="tr"><i className="vrc-dot" /> REC</span>
            <span className="bl">
              LM_08 <em>x</em> <b ref={(n) => { hud.current.x = n }}>0.500</b> <em>y</em> <b ref={(n) => { hud.current.y = n }}>0.500</b>
            </span>
            <span className="br">THERMAL VIEW · 0 CONTROLLERS</span>
          </div>

          <h1 id="vrc-title" className="vrc-title" aria-label="VRCADE">
            {'VRCADE'.split('').map((c, i) => (
              <span key={i} className="ch" aria-hidden="true" style={{ '--i': i }}>{c}</span>
            ))}
          </h1>

          <div className="vrc-hero-copy">
            <p className="vrc-lede">
              Games you play <em>with your hands</em>. No controller, no install. Just a camera, a browser and
              a fingertip.
            </p>
            <div className="vrc-hero-row">
              <a href="#select" className="vrc-btn" data-cursor="GO">
                Insert coin <span aria-hidden="true">↓</span>
              </a>
              <span className="vrc-mini">
                {String(liveCount).padStart(2, '0')} live · {String(games.length - liveCount).padStart(2, '0')} in the lab · by Vrund Patel
              </span>
            </div>
          </div>
          <div className="vrc-cue" aria-hidden="true"><span>Scroll to calibrate</span><i /></div>
        </section>

        <section className="vrc-manifesto" aria-label="How it works">
          <div className="vrc-sticky">
            {BEATS.map((b) => (
              <div key={b.word} className="vrc-beat">
                <span className="vrc-beat-n">{b.n} / 03</span>
                <h2 className="vrc-beat-word" data-word={b.word}>{b.word}</h2>
                <p className="vrc-beat-line">{b.line}</p>
              </div>
            ))}
            <div className="vrc-beats-bar" aria-hidden="true"><i /></div>
          </div>
        </section>

        <div className="vrc-marquee" aria-hidden="true">
          <div className="vrc-marquee-track">
            {Array.from({ length: 2 }, (_, k) => (
              <span key={k}>
                INSERT COIN <b>✦</b> NO CONTROLLER REQUIRED <b>✦</b> HANDS ONLY <b>✦</b> PLAYER 1 READY <b>✦</b> WEBCAM = GAMEPAD <b>✦</b>{' '}
              </span>
            ))}
          </div>
        </div>

        <section id="select" className="vrc-select" aria-labelledby="vrc-select-title">
          <div className="vrc-shelf">
            <div className="vrc-shelf-sticky">
              <div className="vrc-select-head">
                <p className="vrc-eyebrow">Sector 03 · Cartridges</p>
                <h2 id="vrc-select-title" className="vrc-select-title">Select<br />a game</h2>
                <ul className="vrc-legend">
                  <li><i className="is-live" /> Live in browser</li>
                  <li><i className="is-porting" /> Being ported</li>
                  <li><i className="is-desktop" /> Desktop build</li>
                </ul>
              </div>
              <div className="vrc-track">
                {games.map((g, i) => <GameCard key={g.slug} game={g} index={i} />)}
                <div className="vrc-card vrc-card-next" aria-hidden="true">
                  <div className="vrc-card-inner">
                    <span className="vrc-card-n">0{games.length + 1}</span>
                    <p className="vrc-next">Next cartridge<br />loading<span className="vrc-blink">_</span></p>
                  </div>
                </div>
              </div>
              <div className="vrc-shelf-progress" aria-hidden="true"><i /></div>
            </div>
          </div>
        </section>

        <footer className="vrc-foot">
          <p className="vrc-eyebrow">Game over?</p>
          <p className="vrc-continue">
            Continue<span className="vrc-q">?</span> <span className="vrc-count">{countdown}</span>
          </p>
          <div className="vrc-foot-links">
            <Link to="/" className="vrc-btn" data-cursor="EXIT">← Back to vrund.dev</Link>
            <Link to="/blog" className="vrc-btn is-ghost" data-cursor="READ">Read how they’re built</Link>
          </div>
          <p className="vrc-credits">
            Built by Vrund Patel · MediaPipe · WebGL · three.js · Every game runs on your device; video never leaves it.
          </p>
        </footer>
      </main>
    </div>
  )
}
