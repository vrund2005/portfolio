/**
 * Work history, newest first. Drives the Experience section and the
 * crawler-readable copy baked in by scripts/prerender.mjs, so the two can
 * never drift apart. Plain data + pure helpers only (no JSX, no browser
 * APIs) so Node can import it directly.
 *
 * - Dates are 'YYYY-MM'; `end: null` marks the current role.
 * - `stage` is the section's ML metaphor for the career arc:
 *   pre-training → fine-tuning → production.
 * - `metrics` render as animated stat tiles; `kind` picks the visual:
 *   'reduction' (before/after bars), 'meter' (0–1 ring), 'units' (share of 25 dots).
 */
export const experience = [
  {
    company: 'iQud Informatics',
    monogram: 'iQ',
    roles: [
      {
        title: 'AI/ML Engineer',
        type: 'Full-time',
        start: '2026-09',
        end: null,
        stage: 'production',
        summary:
          "Promoted from intern to full-time after shipping the computer-vision pipeline that now powers iQud Informatics's core product and client deliverables.",
      },
      {
        title: 'AI/ML Engineer',
        type: 'Internship',
        start: '2026-05',
        end: '2026-08',
        stage: 'fine-tuning',
        metrics: [
          {
            kind: 'reduction',
            label: 'Smoke-study review time',
            value: 13,
            unit: ' min',
            note: 'down from 2–3 h across 3 QA engineers',
            // Both bars share one minute scale; the manual range's upper bound fills the track
            before: { label: 'Manual · 3 QA engineers', min: 120, max: 180, display: '2–3 h' },
            after: { label: 'Automated run', display: '13 min' },
          },
          {
            kind: 'meter',
            label: 'Smoke detection mAP@50',
            value: 0.879,
            decimals: 3,
            note: 'YOLO-seg model',
          },
          {
            kind: 'units',
            label: 'Repeat false positives',
            value: 92,
            prefix: '−',
            unit: '%',
            note: 'cut by a feedback loop',
          },
        ],
        highlights: [
          'Built the end-to-end computer-vision pipeline for pharmaceutical smoke-study analysis: scene gating, YOLO-seg smoke detection, pipe/camera validation gates, optical flow and statistical laminar-baseline scoring.',
          'A 10-metric deviation engine turns every run into explainable verdicts and annotated defect clips, replacing hours of manual QA review.',
          'Deployed GPU inference on SageMaker behind an S3 job queue and Lambda triggers: a fully automated upload-to-results workflow, monitored in CloudWatch for cost control.',
          'Owned the full lifecycle independently: data annotation, model training, pipeline architecture, cloud deployment and production integration.',
        ],
        stack: ['YOLO-seg', 'Optical flow', 'AWS SageMaker', 'S3', 'Lambda', 'CloudWatch'],
      },
    ],
  },
  {
    company: 'Bacancy Technology',
    monogram: 'B',
    roles: [
      {
        title: 'AI/ML Engineer',
        type: 'Internship',
        start: '2026-01',
        end: '2026-04',
        stage: 'pre-training',
        highlights: [
          'Completed 15+ hands-on implementations across ML, DL, CV, NLP and GenAI (CNNs, RNNs/LSTMs and transformer-based models), from data preprocessing through training and evaluation.',
          'Designed workflow automations with n8n to streamline business processes and API integrations.',
          'Built scalable backend services with FastAPI and integrated them with React applications.',
        ],
        stack: ['CNNs', 'RNNs / LSTMs', 'Transformers', 'n8n', 'FastAPI', 'React'],
      },
    ],
  },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const parseMonth = (ym) => ym.split('-').map(Number)

/** '2026-09' → 'Sep 2026' */
export function formatMonth(ym) {
  const [year, month] = parseMonth(ym)
  return `${MONTHS[month - 1]} ${year}`
}

/** 'Jan – May 2026', 'Nov 2025 – Feb 2026', 'Sep 2026 – Present' */
export function formatPeriod(start, end) {
  if (!end) return `${formatMonth(start)} – Present`

  const [startYear, startMonth] = parseMonth(start)
  const [endYear] = parseMonth(end)
  return startYear === endYear
    ? `${MONTHS[startMonth - 1]} – ${formatMonth(end)}`
    : `${formatMonth(start)} – ${formatMonth(end)}`
}

/** LinkedIn-style inclusive tenure: '1 mo', '5 mos', '1 yr 2 mos' */
export function formatTenure(start, end, now = new Date()) {
  const [startYear, startMonth] = parseMonth(start)
  const [endYear, endMonth] = end ? parseMonth(end) : [now.getFullYear(), now.getMonth() + 1]
  const total = Math.max(1, (endYear - startYear) * 12 + (endMonth - startMonth) + 1)
  const years = Math.floor(total / 12)
  const months = total % 12

  return [years && `${years} yr${years > 1 ? 's' : ''}`, months && `${months} mo${months > 1 ? 's' : ''}`]
    .filter(Boolean)
    .join(' ')
}

/** Earliest start → latest end across a company's roles (null end = still there) */
export function companyPeriod({ roles }) {
  const start = roles.map((role) => role.start).sort()[0]
  const end = roles.some((role) => !role.end) ? null : roles.map((role) => role.end).sort().at(-1)
  return { start, end }
}

/** '13 min', '0.879', '−92%' */
export const formatMetric = (metric) =>
  `${metric.prefix ?? ''}${metric.value.toFixed(metric.decimals ?? 0)}${metric.unit ?? ''}`

/** One plain sentence per metric, for screen readers and crawlers */
export const describeMetric = (metric) => `${metric.label}: ${formatMetric(metric)} (${metric.note})`
