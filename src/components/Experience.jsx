import { useEffect, useRef } from 'react'
import { FiArrowUpRight } from 'react-icons/fi'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { useReducedMotion } from '../hooks/useMediaQuery'
import FadeIn from './fx/FadeIn'
import SplitText from './fx/SplitText'
import GhostWord from './fx/GhostWord'
import Spotlight from './fx/Spotlight'
import { experience, companyPeriod, describeMetric, formatPeriod, formatTenure } from '../data/experience'

// The career arc as an ML lifecycle; each stage keeps one marker colour
const STAGE_DOT = {
  'pre-training': 'bg-violet-300',
  'fine-tuning': 'bg-indigo-300',
  production: 'bg-emerald-300',
}

const TYPE_CHIP = {
  'Full-time': 'border-indigo-300/30 bg-indigo-300/10 text-indigo-100',
  Internship: 'border-white/10 bg-white/5 text-slate-300',
}

const TILE =
  'flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-colors duration-300 hover:border-indigo-300/25'

// clip-path keeps a bar's 4px rounded data-end crisp while it shrinks (scaleX would squash it)
const FULL_CLIP = 'inset(0% 0% 0% 0% round 0px 4px 4px 0px)'

const RING_R = 22
const RING_C = 2 * Math.PI * RING_R
const UNIT_COUNT = 25

// Plays once, when the element scrolls into view
function revealTimeline(trigger) {
  return gsap.timeline({
    defaults: { duration: 1.8, ease: 'power3.inOut' },
    scrollTrigger: { trigger, start: 'top 85%', once: true },
  })
}

// Counts a number in place as part of a timeline (written to the DOM, no re-render per frame)
function addCounter(tl, el, from, to, decimals, position) {
  const counter = { value: from }
  tl.to(
    counter,
    {
      value: to,
      onUpdate: () => {
        el.textContent = counter.value.toFixed(decimals)
      },
    },
    position,
  )
}

function StageTag({ stage }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${STAGE_DOT[stage]}`} />
      <span className="sr-only">Stage: </span>
      {stage}
    </span>
  )
}

function LiveBadge() {
  return (
    <span className="inline-flex w-fit shrink-0 items-center gap-2.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-300">
      <span aria-hidden="true" className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75 motion-reduce:animate-none" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
      </span>
      In production
    </span>
  )
}

function CompanyMark({ children }) {
  return (
    <span
      aria-hidden="true"
      className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-400/25 via-indigo-400/[0.06] to-cyan-300/10 shadow-lg shadow-indigo-950/50 sm:h-14 sm:w-14"
    >
      <span className="bg-gradient-to-br from-white via-indigo-100 to-cyan-200 bg-clip-text font-display text-lg font-bold tracking-tight text-transparent sm:text-xl">
        {children}
      </span>
    </span>
  )
}

/** Oldest → newest role at one company, drawn left → right with a "promoted" marker between */
function PromotionTrack({ roles }) {
  const ref = useRef(null)
  const lineRef = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return undefined

    const ctx = gsap.context(() => {
      revealTimeline(ref.current)
        .fromTo('.exp-stop', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.9 }, 0)
        .fromTo(lineRef.current, { scaleX: 0 }, { scaleX: 1, duration: 1.4 }, 0.15)
        .fromTo('.exp-promoted', { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2.2)' }, 0.75)
    }, ref)

    return () => ctx.revert()
  }, [reduced])

  return (
    <div
      ref={ref}
      className="pt-2 sm:rounded-2xl sm:border sm:border-white/[0.06] sm:bg-white/[0.02] sm:px-7 sm:pb-6 sm:pt-7"
    >
      <div className="relative">
        {/* Rail between the first and last stop, with a packet of light flowing along it */}
        <div aria-hidden="true" className="absolute inset-x-[7px] top-[7px] h-px bg-white/10" />
        <div
          ref={lineRef}
          aria-hidden="true"
          className="absolute inset-x-[7px] top-1.5 h-[3px] origin-left overflow-hidden rounded-full bg-gradient-to-r from-indigo-400/80 via-indigo-300/70 to-emerald-300/80"
          style={reduced ? undefined : { transform: 'scaleX(0)' }}
        >
          <span className="exp-packet absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-transparent via-white to-transparent" />
        </div>

        {roles.slice(1).map((role, index) => (
          <span
            key={role.start}
            aria-hidden="true"
            className="absolute top-[7px] -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${((index + 0.5) / (roles.length - 1)) * 100}%` }}
          >
            <span className="exp-promoted inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-indigo-300/30 bg-[#0c0e1f] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-200 shadow-lg shadow-indigo-950/60">
              <FiArrowUpRight size={12} />
              Promoted
            </span>
          </span>
        ))}

        <ol className="relative flex justify-between gap-4">
          {roles.map((role, index) => {
            const last = index === roles.length - 1
            return (
              <li key={role.start} className={`exp-stop flex flex-col ${last ? 'items-end text-right' : 'items-start'}`}>
                <span aria-hidden="true" className="relative grid h-3.5 w-3.5 place-items-center">
                  {role.end ? (
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-indigo-300 bg-ink" />
                  ) : (
                    <>
                      <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300/60 motion-reduce:animate-none" />
                      <span className="relative h-3.5 w-3.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.7)]" />
                    </>
                  )}
                </span>
                <p className="mt-4 text-sm font-semibold text-white">{role.type}</p>
                <p className="mt-1 font-mono text-[11px] text-slate-400">{formatPeriod(role.start, role.end)}</p>
                <div className="mt-2.5">
                  <StageTag stage={role.stage} />
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

function BarRow({ label, value, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="shrink-0 font-semibold text-slate-200">{value}</span>
      </div>
      <div className="mt-1.5 h-2 rounded-r-[4px] bg-white/[0.05]">{children}</div>
    </div>
  )
}

/** Hero number counts down while the "after" bar shrinks against the "before" range */
function ReductionTile({ metric }) {
  const ref = useRef(null)
  const valueRef = useRef(null)
  const barRef = useRef(null)
  const reduced = useReducedMotion()
  const { before, after } = metric
  const afterClip = `inset(0% ${(100 - (metric.value / before.max) * 100).toFixed(2)}% 0% 0% round 0px 4px 4px 0px)`
  // Solid up to the range's lower bound, fading out towards its upper bound
  const rangeFill = `linear-gradient(90deg, #64748b ${((before.min / before.max) * 100).toFixed(1)}%, rgba(100, 116, 139, 0.18))`

  useEffect(() => {
    if (reduced) return undefined

    const ctx = gsap.context(() => {
      const tl = revealTimeline(ref.current)
      tl.fromTo(barRef.current, { clipPath: FULL_CLIP }, { clipPath: afterClip }, 0.3)
      addCounter(tl, valueRef.current, before.max, metric.value, 0, 0.3)
    }, ref)

    return () => ctx.revert()
  }, [reduced, afterClip, before.max, metric.value])

  return (
    <div ref={ref} className={`${TILE} sm:col-span-2 lg:col-span-1`}>
      <p className="sr-only">{describeMetric(metric)}</p>
      <div aria-hidden="true" className="flex flex-1 flex-col">
        <p className="text-[13px] font-medium text-slate-400">{metric.label}</p>
        <p className="mt-2 flex items-baseline gap-2">
          <span ref={valueRef} className="font-display text-5xl font-bold tracking-tight text-white">
            {reduced ? metric.value : before.max}
          </span>
          <span className="text-lg font-semibold text-slate-400">{(metric.unit ?? '').trim()}</span>
        </p>

        <div className="mt-auto space-y-3.5 pt-6">
          <BarRow label={before.label} value={before.display}>
            <div className="h-full rounded-r-[4px]" style={{ backgroundImage: rangeFill }} />
          </BarRow>
          <BarRow label={after.label} value={after.display}>
            <div className="h-full [filter:drop-shadow(0_0_6px_rgba(129,140,248,0.7))]">
              <div
                ref={barRef}
                className="h-full bg-gradient-to-r from-indigo-400 to-indigo-300"
                style={{ clipPath: reduced ? afterClip : FULL_CLIP }}
              />
            </div>
          </BarRow>
        </div>
      </div>
    </div>
  )
}

/** A 0–1 score as a ring meter; the track is a lighter step of the fill's own hue */
function MeterTile({ metric }) {
  const ref = useRef(null)
  const valueRef = useRef(null)
  const arcRef = useRef(null)
  const reduced = useReducedMotion()
  const decimals = metric.decimals ?? 0
  const filledOffset = RING_C * (1 - metric.value)

  useEffect(() => {
    if (reduced) return undefined

    const ctx = gsap.context(() => {
      const tl = revealTimeline(ref.current)
      // Hidden until it moves: a zero-length dash with a round cap would still paint a dot
      tl.set(arcRef.current, { opacity: 1 }, 0.3)
        .fromTo(arcRef.current, { strokeDashoffset: RING_C }, { strokeDashoffset: filledOffset }, 0.3)
      addCounter(tl, valueRef.current, 0, metric.value, decimals, 0.3)
    }, ref)

    return () => ctx.revert()
  }, [reduced, filledOffset, metric.value, decimals])

  return (
    <div ref={ref} className={TILE}>
      <p className="sr-only">{describeMetric(metric)}</p>
      <div aria-hidden="true" className="flex flex-1 flex-col">
        <p className="text-[13px] font-medium text-slate-400">{metric.label}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span ref={valueRef} className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {(reduced ? metric.value : 0).toFixed(decimals)}
          </span>
          <svg viewBox="0 0 56 56" className="h-11 w-11 shrink-0 -rotate-90 sm:h-14 sm:w-14">
            <circle cx="28" cy="28" r={RING_R} fill="none" stroke="rgba(129, 140, 248, 0.16)" strokeWidth="5" />
            <circle
              ref={arcRef}
              cx="28"
              cy="28"
              r={RING_R}
              fill="none"
              stroke="#a5b4fc"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={reduced ? filledOffset : RING_C}
              style={reduced ? undefined : { opacity: 0 }}
            />
          </svg>
        </div>
        <p className="mt-auto pt-4 text-sm text-slate-400">{metric.note}</p>
      </div>
    </div>
  )
}

/** A percentage cut shown as 25 dots, most of them clearing away */
function UnitsTile({ metric }) {
  const ref = useRef(null)
  const valueRef = useRef(null)
  const reduced = useReducedMotion()
  // Dots left after the cut, e.g. 92% fewer → 2 of 25 remain
  const kept = Math.round(UNIT_COUNT * (1 - metric.value / 100))

  useEffect(() => {
    if (reduced) return undefined

    const ctx = gsap.context(() => {
      const tl = revealTimeline(ref.current)
      tl.to(
        '[data-cleared]',
        { opacity: 0, scale: 0.2, duration: 0.5, ease: 'power2.in', stagger: { each: 0.05, from: 'random' } },
        0.35,
      )
      addCounter(tl, valueRef.current, 0, metric.value, 0, 0.3)
    }, ref)

    return () => ctx.revert()
  }, [reduced, metric.value])

  return (
    <div ref={ref} className={TILE}>
      <p className="sr-only">{describeMetric(metric)}</p>
      <div aria-hidden="true" className="flex flex-1 flex-col">
        <p className="text-[13px] font-medium text-slate-400">{metric.label}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {metric.prefix}
            <span ref={valueRef}>{reduced ? metric.value : 0}</span>
            {metric.unit}
          </span>
          <span className="grid shrink-0 grid-cols-5 gap-1.5">
            {Array.from({ length: UNIT_COUNT }, (_, index) => {
              const cleared = index >= kept
              return (
                <span key={index} className="grid h-2 w-2 place-items-center rounded-full ring-1 ring-inset ring-white/15">
                  <span
                    data-cleared={cleared || undefined}
                    className="h-2 w-2 rounded-full bg-rose-300"
                    style={cleared && reduced ? { opacity: 0 } : undefined}
                  />
                </span>
              )
            })}
          </span>
        </div>
        <p className="mt-auto pt-4 text-sm text-slate-400">{metric.note}</p>
      </div>
    </div>
  )
}

function MetricTile({ metric }) {
  if (metric.kind === 'reduction') return <ReductionTile metric={metric} />
  if (metric.kind === 'meter') return <MeterTile metric={metric} />
  return <UnitsTile metric={metric} />
}

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-4">
      <h4 className="shrink-0 font-mono text-[10px] font-normal uppercase tracking-[0.25em] text-slate-500">{children}</h4>
      <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
    </div>
  )
}

function Highlights({ items, className = '' }) {
  return (
    <ul className={`grid gap-x-10 gap-y-3.5 ${className}`}>
      {items.map((item) => (
        <li key={item} className="flex gap-3.5 text-[15px] leading-7 text-slate-300">
          <span aria-hidden="true" className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-indigo-300 to-cyan-300" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Stack({ items }) {
  return (
    <ul aria-label="Tech stack" className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300 transition-colors duration-300 hover:border-indigo-300/30 hover:text-white"
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

/** Timeline node, aligned with the card's company mark; lights up as the scroll beam reaches it */
function RailNode({ live }) {
  const reduced = useReducedMotion()

  return (
    <span
      data-exp-node=""
      data-lit={reduced ? 'true' : undefined}
      aria-hidden="true"
      className="group absolute left-0 top-[37px] grid h-[22px] w-[22px] place-items-center rounded-full border border-white/15 bg-ink transition-[border-color,box-shadow] duration-500 data-[lit=true]:border-indigo-300/70 data-[lit=true]:shadow-[0_0_0_5px_rgba(99,102,241,0.12),0_0_24px_rgba(129,140,248,0.55)] sm:top-[53px]"
    >
      {live && (
        <span className="absolute inset-0 rounded-full bg-emerald-300/40 opacity-0 group-data-[lit=true]:animate-ping group-data-[lit=true]:opacity-100 motion-reduce:!animate-none" />
      )}
      <span
        className={`relative h-2 w-2 rounded-full bg-slate-600 transition-colors duration-500 ${
          live ? 'group-data-[lit=true]:bg-emerald-300' : 'group-data-[lit=true]:bg-indigo-300'
        }`}
      />
      {/* Branch from the node to its card */}
      <span className="absolute left-full top-1/2 h-px w-[18px] bg-gradient-to-r from-white/15 to-transparent group-data-[lit=true]:from-indigo-300/70 sm:w-[42px]" />
    </span>
  )
}

function Chapter({ company }) {
  const [lead] = company.roles
  const live = !lead.end
  const period = companyPeriod(company)
  const oldestFirst = [...company.roles].reverse()
  const metrics = company.roles.flatMap((role) => role.metrics ?? [])
  const highlights = company.roles.flatMap((role) => role.highlights ?? [])
  const stack = company.roles.flatMap((role) => role.stack ?? [])

  return (
    <li className="relative pl-10 sm:pl-16">
      <RailNode live={live} />

      <FadeIn>
        <Spotlight
          as="article"
          className={`glass rounded-3xl p-6 sm:p-9 ${
            live ? 'shadow-[0_40px_120px_-50px_rgba(99,102,241,0.55)]' : 'shadow-xl shadow-black/20'
          }`}
        >
          {live && (
            <span aria-hidden="true" className="exp-live-ring pointer-events-none absolute -inset-px rounded-[inherit] p-px" />
          )}

          <div className="relative">
            <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4 sm:gap-5">
                <CompanyMark>{company.monogram}</CompanyMark>
                <div className="min-w-0">
                  <h3 className="font-display text-2xl font-bold leading-tight text-white sm:text-3xl">
                    {company.company}
                  </h3>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[15px] font-semibold text-slate-200">
                    {lead.title}
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        TYPE_CHIP[lead.type] ?? TYPE_CHIP.Internship
                      }`}
                    >
                      {lead.type}
                    </span>
                  </p>
                  <p className="mt-2 font-mono text-xs text-slate-400">
                    {formatPeriod(period.start, period.end)}
                    <span aria-hidden="true" className="mx-2 text-slate-600">
                      ·
                    </span>
                    {formatTenure(period.start, period.end)}
                  </p>
                </div>
              </div>
              {live ? <LiveBadge /> : <StageTag stage={lead.stage} />}
            </header>

            {lead.summary && (
              <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-[17px] sm:leading-8">
                {lead.summary}
              </p>
            )}

            {oldestFirst.length > 1 && (
              <div className="mt-7">
                <PromotionTrack roles={oldestFirst} />
              </div>
            )}

            {metrics.length > 0 && (
              <div className="mt-10">
                <SectionLabel>Impact so far</SectionLabel>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
                  {metrics.map((metric) => (
                    <MetricTile key={metric.label} metric={metric} />
                  ))}
                </div>
              </div>
            )}

            {highlights.length > 0 && (
              <Highlights
                items={highlights}
                className={highlights.length > 3 ? 'mt-8 lg:grid-cols-2' : 'mt-7 max-w-3xl'}
              />
            )}

            {stack.length > 0 && (
              <div className="mt-8">
                <Stack items={stack} />
              </div>
            )}
          </div>
        </Spotlight>
      </FadeIn>
    </li>
  )
}

function Experience() {
  const listRef = useRef(null)
  const railRef = useRef(null)
  const fillRef = useRef(null)
  const headRef = useRef(null)
  const headDotRef = useRef(null)
  const reduced = useReducedMotion()

  // Scroll-drawn rail: the fill and its glowing head track a line 70% down the
  // viewport, and each node lights up as the head passes through it
  useEffect(() => {
    if (reduced) return undefined

    const ctx = gsap.context(() => {
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: railRef.current, start: 'top 70%', end: 'bottom 70%', scrub: true },
        })
        .fromTo(fillRef.current, { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0)
        .fromTo(headRef.current, { yPercent: -100 }, { yPercent: 0, duration: 1 }, 0)
        .fromTo(headDotRef.current, { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0)
        .fromTo(headDotRef.current, { opacity: 1 }, { opacity: 0, duration: 0.08, immediateRender: false }, 0.92)

      listRef.current.querySelectorAll('[data-exp-node]').forEach((node) => {
        ScrollTrigger.create({
          trigger: node,
          start: 'center 70%',
          onEnter: () => {
            node.dataset.lit = 'true'
          },
          onLeaveBack: () => {
            delete node.dataset.lit
          },
        })
      })
    })

    return () => ctx.revert()
  }, [reduced])

  return (
    <section id="experience" className="relative overflow-hidden px-5 py-24 sm:px-6 lg:px-8">
      <GhostWord direction={-1}>EPOCHS</GhostWord>
      <div
        aria-hidden="true"
        className="animate-blob absolute -right-40 top-1/4 h-96 w-96 rounded-full bg-indigo-500/[0.08] blur-3xl will-change-transform"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mb-14 text-center sm:mb-16">
          <FadeIn as="p" className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-300">
            Experience · now in production
          </FadeIn>
          <SplitText as="h2" className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl" stagger={0.015}>
            Pre-trained. Fine-tuned. Promoted.
          </SplitText>
          <FadeIn as="p" delay={0.1} className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Broad pre-training at Bacancy, fine-tuning on a real product at iQud Informatics, and a promotion to full-time
            AI/ML Engineer there.
          </FadeIn>
        </div>

        <div ref={listRef} className="relative mx-auto max-w-5xl">
          {/* Timeline rail, centred on the 22px nodes; starts at the first node and fades out at the end */}
          <div
            ref={railRef}
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-[11px] top-12 w-14 -translate-x-1/2 [mask-image:linear-gradient(to_bottom,#000_82%,transparent)] sm:top-16"
          >
            <div className="absolute inset-y-0 left-[27px] w-0.5 rounded-full bg-white/[0.08]" />
            <div
              ref={fillRef}
              className="absolute inset-y-0 left-[27px] w-0.5 origin-top rounded-full bg-gradient-to-b from-violet-400 via-indigo-400 to-cyan-300"
              style={reduced ? undefined : { transform: 'scaleY(0)' }}
            />
            {!reduced && (
              <div ref={headRef} className="absolute inset-0" style={{ transform: 'translateY(-100%)' }}>
                <span
                  ref={headDotRef}
                  className="absolute bottom-0 left-[23px] h-2.5 w-2.5 translate-y-1/2 rounded-full bg-cyan-100 opacity-0 shadow-[0_0_16px_5px_rgba(103,232,249,0.55)]"
                />
              </div>
            )}
          </div>

          <ol className="space-y-10 sm:space-y-14">
            {experience.map((company) => (
              <Chapter key={company.company} company={company} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

export default Experience
