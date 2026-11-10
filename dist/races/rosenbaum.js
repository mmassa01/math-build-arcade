const $ = (s, r = document) => r.querySelector(s)
const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  )
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function hash(str) {
  let h = 2166136261
  for (const c of String(str)) {
    h ^= c.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1))
const pick = (r, arr) => arr[Math.floor(r() * arr.length)]
const shuffle = (r, arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i)
const median = (a) => {
  if (!a.length) return null
  const s = [...a].sort((x, y) => x - y),
    m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const pct = (v) => (v == null ? '–' : Math.round(v * 100) + '%')
const r1 = (v) => (v == null ? '–' : (Math.round(v * 10) / 10).toString())
function ols(pts) {
  if (pts.length < 2) return null
  const mx = mean(pts.map((p) => p.x)),
    my = mean(pts.map((p) => p.y))
  let n = 0,
    d = 0
  for (const p of pts) {
    n += (p.x - mx) * (p.y - my)
    d += (p.x - mx) ** 2
  }
  return d ? n / d : 0
}

const D = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const todayIso = () => iso(new Date())
function fridayOf(s) {
  const d = D(s)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 4)
  return iso(d)
}
function fridaysBetween(a, b) {
  const out = []
  const d = D(fridayOf(a)),
    e = D(b)
  while (d <= e) {
    out.push(iso(d))
    d.setDate(d.getDate() + 7)
  }
  return out
}
const fmtD = (s) =>
  D(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const monthKey = (s) => s.slice(0, 7)
const monthName = (k) =>
  D(k + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
const weeksBetween = (a, b) => Math.round((D(b) - D(a)) / (7 * 864e5))

const ICONS = ['🍎', '🐞', '⭐', '🐟', '🍪', '🦆']
function famAdd(a, b) {
  if (Math.min(a, b) === 0) return '+0'
  if (Math.min(a, b) <= 2) return 'Count on 1-2'
  if (a === b) return 'Doubles'
  if (Math.abs(a - b) === 1) return 'Near doubles'
  if (a + b === 10) return 'Make 10'
  if (a + b > 10) return 'Bridge 10'
  return 'Other within 10'
}
function famSub(a, b) {
  if (b === 0 || a === b) return '−0 / −all'
  if (b <= 2) return 'Count back 1-2'
  if (a === 10) return 'From 10'
  if (a > 10) return a - b < 10 ? 'Bridge 10' : 'Teens, no bridge'
  return 'Think addition'
}
function regroupAdd(a, b) {
  let c = 0
  while (a || b) {
    if ((a % 10) + (b % 10) + c > 9) return true
    a = Math.floor(a / 10)
    b = Math.floor(b / 10)
  }
  return false
}
function regroupSub(a, b) {
  while (b) {
    if (a % 10 < b % 10) return true
    a = Math.floor(a / 10)
    b = Math.floor(b / 10)
  }
  return false
}

const OBJ = {
  star: 'stars',
  cube: 'cubes',
  rocket: 'rocket ships',
  apple: 'apples',
  dot: 'dots',
}
function win(r, ans, lo, hi, k = 3) {
  const s = clamp(ans - ri(r, 0, k - 1), lo, Math.max(lo, hi - k + 1))
  return range(s, s + k - 1)
}
function genKCount(r, p) {
  const out = []
  let last = -1
  for (let i = 0; i < p.items; i++) {
    let n
    do {
      n = ri(r, 1, 10)
    } while (n === last)
    last = n
    const kinds =
      n <= 5
        ? ['frame5', 'star', 'cube', 'rocket', 'scatter']
        : ['frame', 'star', 'cube', 'scatter']
    const k = pick(r, kinds)
    const vis =
      k === 'frame5'
        ? { t: 'frame5', n }
        : k === 'frame'
          ? { t: 'frame', n }
          : k === 'scatter'
            ? { t: 'scatter', n, s: ri(r, 1, 1e6) }
            : { t: 'objs', n, o: k }
    const say =
      k === 'frame5' || k === 'frame'
        ? 'How many dots are on the frame?'
        : k === 'scatter'
          ? 'How many dots are there?'
          : `How many ${OBJ[k]} are there?`
    out.push({
      prompt: say,
      say,
      answer: n,
      skill: n <= 5 ? 'Quantities 1-5' : 'Quantities 6-10',
      vis,
      choices: win(r, n, 1, 10, n <= 3 ? 3 : 4),
    })
  }
  return out
}
function genKTeen(r, p) {
  const out = []
  for (let i = 0; i < p.items; i++) {
    const n = ri(r, 10, 19)
    out.push({
      prompt: 'How many dots?',
      say: 'How many dots are there in all?',
      answer: n,
      skill: n < 15 ? 'Ten and 0-4' : 'Ten and 5-9',
      vis: { t: 'frame', n },
      choices: win(r, n, 10, 20, 4),
    })
  }
  return out
}
function genKAdd5(r, p) {
  const out = []
  for (let i = 0; i < p.items; i++) {
    const icon = pick(r, ICONS)
    if (r() < 0.55) {
      const a = ri(r, 0, 5),
        b = ri(r, 0, 5 - a)
      out.push({
        prompt: `${a} + ${b}`,
        say: `${a} and ${b} more. How many in all?`,
        answer: a + b,
        skill: 'Put together',
        vis: { t: 'pics', a, b, op: '+', icon },
        choices: win(r, a + b, 0, 5, 4),
      })
    } else {
      const a = ri(r, 1, 5),
        b = ri(r, 0, a)
      out.push({
        prompt: `${a} − ${b}`,
        say: `${a}, take away ${b}. How many are left?`,
        answer: a - b,
        skill: 'Take apart',
        vis: { t: 'pics', a, b, op: '−', icon },
        choices: win(r, a - b, 0, 5, 4),
      })
    }
  }
  return out
}
function genKSeq(r, p) {
  const out = []
  for (let i = 0; i < p.items; i++) {
    if (r() < 0.65) {
      const s = ri(r, 1, 16)
      out.push({
        prompt: 'What comes next?',
        say: `${s}, ${s + 1}, ${s + 2}. What number comes next?`,
        answer: s + 3,
        skill: 'Count forward',
        vis: { t: 'seq', nums: [s, s + 1, s + 2, null] },
        choices: win(r, s + 3, 1, 20, 3),
      })
    } else {
      const s = ri(r, 4, 20)
      out.push({
        prompt: 'What comes next?',
        say: `${s}, ${s - 1}, ${s - 2}. Count back. What number comes next?`,
        answer: s - 3,
        skill: 'Count back',
        vis: { t: 'seq', nums: [s, s - 1, s - 2, null] },
        choices: win(r, s - 3, 1, 20, 3),
      })
    }
  }
  return out
}
const PLACE = [
  ['🐔', 'hen', 'hens', 'barn'],
  ['🐑', 'sheep', 'sheep', 'barn'],
  ['🦆', 'duck', 'ducks', 'pond'],
  ['🐄', 'cow', 'cows', 'barn'],
]
function genKPlace(r, p) {
  const out = []
  for (let i = 0; i < p.items; i++) {
    const n = ri(r, 1, 10),
      [icon, one, many, scene] = pick(r, PLACE)
    const say = `Put ${n} ${n === 1 ? one : many} in the picture.`
    out.push({
      prompt: say,
      say,
      answer: n,
      skill: n <= 5 ? 'Count out 1-5' : 'Count out 6-10',
      vis: {
        t: 'place',
        icon,
        tray: Math.min(12, Math.max(5, n + ri(r, 1, 3))),
        scene,
      },
    })
  }
  return out
}
function eqItem(a, b, op, skill) {
  const ans =
    op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b
  return {
    prompt: `${a} ${op} ${b}`,
    answer: ans,
    skill,
    vis: { t: 'eq', text: `${a} ${op} ${b} =` },
  }
}
function vertItem(a, b, op, skill) {
  const ans =
    op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b
  return {
    prompt: `${a} ${op} ${b}`,
    answer: ans,
    skill,
    vis:
      op === '÷'
        ? { t: 'eq', text: `${a.toLocaleString()} ÷ ${b} =` }
        : { t: 'vert', a, b, op },
  }
}
function genAddSub(max, r, p) {
  const out = []
  for (let i = 0; i < p.items; i++) {
    if (r() < 0.5) {
      let a, b
      do {
        a = ri(r, 0, Math.min(max, 10))
        b = ri(r, 0, Math.min(max, 10))
      } while (a + b > max)
      out.push(eqItem(a, b, '+', famAdd(a, b)))
    } else {
      const a = ri(r, max > 10 ? 5 : 1, max),
        b = ri(r, 0, Math.min(a, 10))
      out.push(eqItem(a, b, '−', famSub(a, b)))
    }
  }
  return out
}
function genTenMoreLess(r, p) {
  const out = []
  for (let i = 0; i < p.items; i++) {
    if (r() < 0.5) {
      const a = ri(r, 10, 89)
      out.push(eqItem(a, 10, '+', '10 more'))
    } else {
      const a = ri(r, 20, 99)
      out.push(eqItem(a, 10, '−', '10 less'))
    }
  }
  return out
}
function genTens(r, p) {
  const out = []
  for (let i = 0; i < p.items; i++) {
    if (r() < 0.5) {
      const a = ri(r, 1, 8) * 10,
        b = ri(r, 1, 9 - a / 10) * 10
      out.push(eqItem(a, b, '+', 'Add tens'))
    } else {
      const a = ri(r, 2, 9) * 10,
        b = ri(r, 1, a / 10 - 1) * 10
      out.push(eqItem(a, b, '−', 'Subtract tens'))
    }
  }
  return out
}
function genMult(r, p) {
  const max = SETTINGS.multMax || 10
  const out = []
  const zeros = new Set(shuffle(r, range(0, p.items - 1)).slice(0, 2))
  for (let i = 0; i < p.items; i++) {
    let a, b
    if (zeros.has(i)) {
      a = 0
      b = ri(r, 1, max)
      if (r() < 0.5) [a, b] = [b, a]
    } else {
      a = ri(r, 1, max)
      b = ri(r, 1, max)
    }
    out.push(
      eqItem(
        a,
        b,
        '×',
        Math.max(a, b) === 0 || Math.min(a, b) === 0
          ? '0s'
          : Math.max(a, b) + 's',
      ),
    )
  }
  return out
}
function genDiv(r, p) {
  const max = SETTINGS.multMax || 10
  const out = []
  for (let i = 0; i < p.items; i++) {
    const d = ri(r, 1, max),
      q = ri(r, 0, max)
    out.push(eqItem(d * q, d, '÷', '÷' + d))
  }
  return out
}
function genMixedFacts(r, p) {
  const a = genMult(r, p),
    b = genDiv(r, p)
  return a.map((x, i) => (i % 2 ? b[i] : x))
}
function genTimesTens(r, p) {
  const out = []
  for (let i = 0; i < p.items; i++) {
    const a = ri(r, 1, 9),
      b = ri(r, 1, 9) * 10
    out.push(
      r() < 0.5 ? eqItem(a, b, '×', '× tens') : eqItem(b, a, '×', '× tens'),
    )
  }
  return out
}
function genMulti(digits, r, p) {
  const lo = 10 ** (digits - 1),
    hi = 10 ** digits - 1
  const out = []
  for (let i = 0; i < p.items; i++) {
    if (r() < 0.5) {
      let a, b
      do {
        a = ri(r, lo, hi)
        b = ri(r, lo, hi)
      } while (digits <= 2 && a + b > 100)
      out.push(
        vertItem(
          a,
          b,
          '+',
          regroupAdd(a, b) ? 'Add with regrouping' : 'Add, no regrouping',
        ),
      )
    } else {
      const a = ri(r, lo + Math.floor(lo / 2), hi),
        b = ri(r, lo, a)
      out.push(
        vertItem(
          a,
          b,
          '−',
          regroupSub(a, b)
            ? 'Subtract with regrouping'
            : 'Subtract, no regrouping',
        ),
      )
    }
  }
  return out
}
function genMult3x2(r, p) {
  const out = []
  for (let i = 0; i < p.items; i++) {
    const tw = r() < 0.4
    const a = tw ? ri(r, 12, 99) : ri(r, 102, 999),
      b = ri(r, 11, 99)
    out.push(
      vertItem(a, b, '×', tw ? '2-digit × 2-digit' : '3-digit × 2-digit'),
    )
  }
  return out
}
function genDiv4(r, p) {
  const out = []
  for (let i = 0; i < p.items; i++) {
    const d = ri(r, 2, 25)
    let q
    do {
      q = ri(r, Math.ceil(100 / d), Math.floor(9999 / d))
    } while (d * q < 100)
    out.push(
      vertItem(d * q, d, '÷', d < 10 ? '1-digit divisor' : '2-digit divisor'),
    )
  }
  return out
}

const PR = {}
const PROBES = [
  {
    id: 'K.NR.1',
    grade: 'K',
    label: 'How many? Quantities to 10',
    std: 'K.NR.1.1, K.NR.4.1',
    desc: 'Stars, cubes, rockets, five- and ten-frames, scattered dots. Read aloud, 3-4 answer buttons. Unit 1 and 3 focus.',
    items: 20,
    secs: 10,
    input: 'choices',
    kind: 'fact',
    gen: genKCount,
  },
  {
    id: 'K.NR.1p',
    grade: 'K',
    label: 'Put them in the picture (count out)',
    std: 'K.NR.1.1, K.NR.1.2',
    desc: 'Child hears "Put 4 hens in the picture" and taps animals into the scene. Measures counting out a set and cardinality.',
    items: 12,
    secs: 15,
    input: 'place',
    kind: 'fact',
    gen: genKPlace,
  },
  {
    id: 'K.NR.2',
    grade: 'K',
    label: 'What comes next? Counting',
    std: 'K.NR.2.1, K.NR.2.2',
    desc: 'Count forward within 20 and back from 20.',
    items: 20,
    secs: 10,
    input: 'choices',
    kind: 'fact',
    gen: genKSeq,
  },
  {
    id: 'K.NR.3',
    grade: 'K',
    label: 'Ten and some more (11-19)',
    std: 'K.NR.3.1',
    desc: 'Two ten-frames, first one full. Unit 5 focus.',
    items: 20,
    secs: 10,
    input: 'choices',
    kind: 'fact',
    gen: genKTeen,
  },
  {
    id: 'K.NR.5',
    grade: 'K',
    label: 'Put together, take apart within 5',
    std: 'K.NR.5.4',
    desc: 'Picture addition and subtraction within 5. Unit 4 focus.',
    items: 20,
    secs: 10,
    input: 'choices',
    kind: 'fact',
    gen: genKAdd5,
  },
  {
    id: '1.NR.2',
    grade: '1',
    label: 'Add and subtract within 10',
    std: '1.NR.2.4',
    desc: 'Fluently add and subtract within 10.',
    items: 30,
    secs: 5,
    kind: 'fact',
    gen: (r, p) => genAddSub(10, r, p),
  },
  {
    id: '1.NR.5a',
    grade: '1',
    label: '10 more, 10 less',
    std: '1.NR.5.2',
    desc: 'Mentally find 10 more or 10 less than a two-digit number.',
    items: 30,
    secs: 5,
    kind: 'fact',
    gen: genTenMoreLess,
  },
  {
    id: '1.NR.5b',
    grade: '1',
    label: 'Add and subtract tens',
    std: '1.NR.5.3',
    desc: 'Add and subtract multiples of 10 within 100.',
    items: 30,
    secs: 5,
    kind: 'fact',
    gen: genTens,
  },
  {
    id: '2.NR.2a',
    grade: '2',
    label: 'Add and subtract within 20',
    std: '2.NR.2.1',
    desc: 'Fluently add and subtract within 20 using mental, part-whole strategies.',
    items: 30,
    secs: 4,
    kind: 'fact',
    gen: (r, p) => genAddSub(20, r, p),
  },
  {
    id: '2.NR.2b',
    grade: '2',
    label: 'Add and subtract within 100',
    std: '2.NR.2.4',
    desc: 'Two-digit addition and subtraction within 100.',
    items: 15,
    secs: 15,
    kind: 'multi',
    gen: (r, p) => genMulti(2, r, p),
  },
  {
    id: '3.PAR.3m',
    grade: '3',
    label: 'Multiplication facts',
    std: '3.PAR.3.2, 3.PAR.3.3',
    desc: 'Single-digit multiplication within 100. Exactly two zero facts per race.',
    items: 30,
    secs: 4,
    kind: 'fact',
    gen: genMult,
  },
  {
    id: '3.PAR.3d',
    grade: '3',
    label: 'Division facts',
    std: '3.PAR.3.2, 3.PAR.3.3',
    desc: 'Related division facts within 100.',
    items: 30,
    secs: 4,
    kind: 'fact',
    gen: genDiv,
  },
  {
    id: '3.PAR.3t',
    grade: '3',
    label: 'Multiply by multiples of 10',
    std: '3.PAR.3.5',
    desc: 'One-digit numbers times 10-90.',
    items: 30,
    secs: 5,
    kind: 'fact',
    gen: genTimesTens,
  },
  {
    id: '3.PAR.2',
    grade: '3',
    label: 'Add and subtract within 1,000',
    std: '3.PAR.2.1',
    desc: 'Three-digit addition and subtraction.',
    items: 12,
    secs: 25,
    kind: 'multi',
    gen: (r, p) => genMulti(3, r, p),
  },
  {
    id: '4.FACT',
    grade: '4',
    label: 'Facts maintenance × and ÷',
    std: '3.PAR.3 (prerequisite)',
    desc: 'Mixed multiplication and division facts. Keeps grade 3 fluency warm.',
    items: 30,
    secs: 4,
    kind: 'fact',
    gen: genMixedFacts,
  },
  {
    id: '4.NR.2',
    grade: '4',
    label: 'Multi-digit add and subtract',
    std: '4.NR.2.1',
    desc: 'Four-digit addition and subtraction.',
    items: 10,
    secs: 45,
    kind: 'multi',
    gen: (r, p) => genMulti(4, r, p),
  },
  {
    id: '5.FACT',
    grade: '5',
    label: 'Facts maintenance × and ÷',
    std: '3.PAR.3 (prerequisite)',
    desc: 'Mixed multiplication and division facts.',
    items: 30,
    secs: 4,
    kind: 'fact',
    gen: genMixedFacts,
  },
  {
    id: '5.NR.2a',
    grade: '5',
    label: 'Multiply multi-digit',
    std: '5.NR.2.1',
    desc: 'Up to 3-digit by 2-digit multiplication.',
    items: 8,
    secs: 90,
    kind: 'multi',
    gen: genMult3x2,
  },
  {
    id: '5.NR.2b',
    grade: '5',
    label: 'Divide multi-digit',
    std: '5.NR.2.2',
    desc: 'Up to 4-digit dividends, divisors 2-25, whole-number quotients.',
    items: 8,
    secs: 90,
    kind: 'multi',
    gen: genDiv4,
  },
]
PROBES.forEach((p) => {
  p.input = p.input || 'pad'
  PR[p.id] = p
})
const GRADES = ['K', '1', '2', '3', '4', '5']
const gradeName = (g) => (g === 'K' ? 'Kindergarten' : 'Grade ' + g)

const DEFAULT_SETTINGS = {
  district: 'McIntosh County Schools',
  school: 'Todd Grant Elementary',
  startDate: '2026-08-10',
  goalDate: '2027-05-14',
  goalFact: 0.9,
  goalMulti: 0.8,
  watchBand: 0.2,
  multMax: 10,
  timing: {},
  comms: { friday: true, digest: true, family: false, mode: 'preview' },
  ecName: 'Tiger Downs Math Fluency',
  ecCols: [
    ['sisId', 'Student ID', 1],
    ['name', 'Student Name', 1],
    ['school', 'School', 1],
    ['grade', 'Grade', 1],
    ['teacher', 'Teacher', 1],
    ['assessment', 'Assessment', 1],
    ['measure', 'Measure', 1],
    ['date', 'Administration Date', 1],
    ['score', 'Score', 1],
    ['total', 'Possible', 1],
    ['goal', 'Goal', 1],
    ['accom', 'Accommodation', 1],
  ],
}
let SETTINGS = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
function applyTiming() {
  PROBES.forEach((p) => {
    const o = SETTINGS.timing?.[p.id]
    if (!p._base) p._base = { items: p.items, secs: p.secs }
    p.items = o?.items || p._base.items
    p.secs = o?.secs || p._base.secs
  })
}
const goalPct = (p) =>
  p.kind === 'multi' ? SETTINGS.goalMulti : SETTINGS.goalFact
const goalOf = (p) => Math.ceil(p.items * goalPct(p))

function allocate(mix, n) {
  const keys = Object.keys(mix).filter((k) => mix[k] > 0),
    tot = keys.reduce((a, k) => a + mix[k], 0)
  const raw = keys.map((k) => (mix[k] * n) / tot),
    base = raw.map(Math.floor)
  let rem = n - base.reduce((a, b) => a + b, 0)
  raw
    .map((v, i) => [v - base[i], i])
    .sort((a, b) => b[0] - a[0])
    .slice(0, rem)
    .forEach(([, i]) => base[i]++)
  return Object.fromEntries(keys.map((k, i) => [k, base[i]]))
}
function drawFrom(pool, n, r) {
  const out = []
  let bag = []
  while (out.length < n) {
    if (!bag.length) bag = shuffle(r, [...pool])
    out.push(bag.pop())
  }
  return out
}
const sig = (it) =>
  it.k + '|' + it.prompt + '|' + it.answer + '|' + ((it.vis && it.vis.t) || '')
function arrange(items, r) {
  shuffle(r, items)
  const fams = new Set(items.map((i) => i.k)).size,
    maxRun = fams <= 2 ? 3 : 2
  const bad = (i) =>
    (i > 0 && sig(items[i]) === sig(items[i - 1])) ||
    (i >= maxRun &&
      items.slice(i - maxRun, i).every((x) => x.k === items[i].k)) ||
    (i === 0 && ['0s', '+0', '−0 / −all', '0 ÷ n'].includes(items[i].skill))
  for (let pass = 0; pass < 60; pass++) {
    let fixed = true
    for (let i = 0; i < items.length; i++)
      if (bad(i)) {
        fixed = false
        const j = ri(r, 0, items.length - 1)
        ;[items[i], items[j]] = [items[j], items[i]]
      }
    if (fixed) break
  }
  return items
}
function strataFrom(list, keyFn, make) {
  const st = {}
  list.forEach((x) => {
    const k = keyFn(x)
    ;(st[k] = st[k] || { pool: [], make }).pool.push(x)
  })
  return st
}
function prefixed(prefix, st) {
  return Object.fromEntries(Object.entries(st).map(([k, v]) => [prefix + k, v]))
}
function prefixMix(prefix, mix) {
  return Object.fromEntries(
    Object.entries(mix).map(([k, v]) => [prefix + k, v]),
  )
}

const pairs = (a0, a1, b0, b1, ok = () => true) => {
  const o = []
  for (let a = a0; a <= a1; a++)
    for (let b = b0; b <= b1; b++) if (ok(a, b)) o.push([a, b])
  return o
}
const addSubStrata = (addPairs, subPairs) => ({
  ...prefixed(
    '+:',
    strataFrom(
      addPairs,
      ([a, b]) => famAdd(a, b),
      ([a, b]) => eqItem(a, b, '+', famAdd(a, b)),
    ),
  ),
  ...prefixed(
    '−:',
    strataFrom(
      subPairs,
      ([a, b]) => famSub(a, b),
      ([a, b]) => eqItem(a, b, '−', famSub(a, b)),
    ),
  ),
})
function multStrata() {
  const m = SETTINGS.multMax || 10
  return strataFrom(
    pairs(0, m, 0, m, (a, b) => a || b),
    ([a, b]) => (Math.min(a, b) === 0 ? '0s' : Math.max(a, b) + 's'),
    ([a, b]) =>
      eqItem(a, b, '×', Math.min(a, b) === 0 ? '0s' : Math.max(a, b) + 's'),
  )
}
function divStrata() {
  const m = SETTINGS.multMax || 10
  return {
    ...strataFrom(
      pairs(1, m, 1, m),
      ([d]) => '÷' + d,
      ([d, q]) => eqItem(d * q, d, '÷', '÷' + d),
    ),
    '0 ÷ n': { pool: range(1, m), make: (d) => eqItem(0, d, '÷', '0 ÷ n') },
  }
}
const MULT_MIX = {
  10: {
    '0s': 2,
    '1s': 1,
    '2s': 2,
    '3s': 3,
    '4s': 3,
    '5s': 2,
    '6s': 4,
    '7s': 4,
    '8s': 4,
    '9s': 3,
    '10s': 2,
  },
  12: {
    '0s': 2,
    '1s': 1,
    '2s': 2,
    '3s': 2,
    '4s': 2,
    '5s': 2,
    '6s': 3,
    '7s': 3,
    '8s': 3,
    '9s': 3,
    '10s': 1,
    '11s': 2,
    '12s': 4,
  },
}
const DIV_MIX = {
  10: {
    '0 ÷ n': 1,
    '÷1': 1,
    '÷2': 2,
    '÷3': 3,
    '÷4': 3,
    '÷5': 3,
    '÷6': 4,
    '÷7': 4,
    '÷8': 4,
    '÷9': 3,
    '÷10': 2,
  },
  12: {
    '0 ÷ n': 1,
    '÷1': 1,
    '÷2': 2,
    '÷3': 2,
    '÷4': 2,
    '÷5': 2,
    '÷6': 3,
    '÷7': 4,
    '÷8': 4,
    '÷9': 3,
    '÷10': 1,
    '÷11': 2,
    '÷12': 3,
  },
}
const mm = () => MULT_MIX[SETTINGS.multMax == 12 ? 12 : 10],
  dm = () => DIV_MIX[SETTINGS.multMax == 12 ? 12 : 10]

function multiFamily(digits, op, regroup) {
  const lo = 10 ** (digits - 1),
    hi = 10 ** digits - 1
  return {
    gen: (r) => {
      for (let t = 0; t < 500; t++) {
        if (op === '+') {
          const a = ri(r, lo, hi),
            b = ri(r, lo, hi)
          if (digits === 2 && a + b > 100) continue
          if (regroupAdd(a, b) === regroup)
            return vertItem(
              a,
              b,
              '+',
              regroup ? 'Add with regrouping' : 'Add, no regrouping',
            )
        } else {
          const a = ri(r, lo + Math.floor(lo / 2), hi),
            b = ri(r, lo, a)
          if (regroupSub(a, b) === regroup)
            return vertItem(
              a,
              b,
              '−',
              regroup ? 'Subtract with regrouping' : 'Subtract, no regrouping',
            )
        }
      }
      return vertItem(lo * 2, lo, op, 'Add, no regrouping')
    },
  }
}
function multiDigitStrata(d) {
  return {
    'Add with regrouping': multiFamily(d, '+', true),
    'Add, no regrouping': multiFamily(d, '+', false),
    'Subtract with regrouping': multiFamily(d, '−', true),
    'Subtract, no regrouping': multiFamily(d, '−', false),
  }
}

const kKinds = (n) =>
  n <= 5
    ? ['frame5', 'star', 'cube', 'rocket', 'scatter']
    : ['frame', 'star', 'cube', 'scatter']
function kCountItem(n, r, k) {
  k = k || pick(r, kKinds(n))
  const vis =
    k === 'frame5'
      ? { t: 'frame5', n }
      : k === 'frame'
        ? { t: 'frame', n }
        : k === 'scatter'
          ? { t: 'scatter', n, s: ri(r, 1, 1e6) }
          : { t: 'objs', n, o: k }
  const say =
    k === 'frame5' || k === 'frame'
      ? 'How many dots are on the frame?'
      : k === 'scatter'
        ? 'How many dots are there?'
        : `How many ${OBJ[k]} are there?`
  return {
    prompt: say,
    say,
    answer: n,
    skill: n <= 5 ? 'Quantities 1-5' : 'Quantities 6-10',
    vis,
    choices: win(r, n, 1, 10, n <= 3 ? 3 : 4),
  }
}
function kPlaceItem(n, r) {
  const [icon, one, many, scene] = pick(r, PLACE),
    say = `Put ${n} ${n === 1 ? one : many} in the picture.`
  return {
    prompt: say,
    say,
    answer: n,
    skill: n <= 5 ? 'Count out 1-5' : 'Count out 6-10',
    vis: {
      t: 'place',
      icon,
      tray: Math.min(12, Math.max(5, n + ri(r, 1, 3))),
      scene,
    },
  }
}

const BLUEPRINTS = {
  'K.NR.1': () => ({
    strata: Object.fromEntries(
      range(1, 10).map((n) => [
        'n' + n,
        {
          pool: kKinds(n).map((k) => [n, k]),
          make: ([n, k], r) => kCountItem(n, r, k),
        },
      ]),
    ),
    mix: Object.fromEntries(range(1, 10).map((n) => ['n' + n, 2])),
  }),
  'K.NR.1p': () => ({
    strata: {
      'Count out 1-5': { pool: range(1, 5), make: kPlaceItem },
      'Count out 6-10': { pool: range(6, 10), make: kPlaceItem },
    },
    mix: { 'Count out 1-5': 6, 'Count out 6-10': 6 },
  }),
  'K.NR.2': () => ({
    strata: {
      'Count forward': {
        pool: range(1, 16),
        make: (s, r) => ({
          prompt: 'What comes next?',
          say: `${s}, ${s + 1}, ${s + 2}. What number comes next?`,
          answer: s + 3,
          skill: 'Count forward',
          vis: { t: 'seq', nums: [s, s + 1, s + 2, null] },
          choices: win(r, s + 3, 1, 20, 3),
        }),
      },
      'Count back': {
        pool: range(4, 20),
        make: (s, r) => ({
          prompt: 'What comes next?',
          say: `${s}, ${s - 1}, ${s - 2}. Count back. What number comes next?`,
          answer: s - 3,
          skill: 'Count back',
          vis: { t: 'seq', nums: [s, s - 1, s - 2, null] },
          choices: win(r, s - 3, 1, 20, 3),
        }),
      },
    },
    mix: { 'Count forward': 13, 'Count back': 7 },
  }),
  'K.NR.3': () => ({
    strata: strataFrom(
      range(10, 19),
      (n) => 'n' + n,
      (n, r) => ({
        prompt: 'How many dots?',
        say: 'How many dots are there in all?',
        answer: n,
        skill: n < 15 ? 'Ten and 0-4' : 'Ten and 5-9',
        vis: { t: 'frame', n },
        choices: win(r, n, 10, 20, 4),
      }),
    ),
    mix: Object.fromEntries(range(10, 19).map((n) => ['n' + n, 2])),
  }),
  'K.NR.5': () => ({
    strata: {
      'Put together': {
        pool: pairs(0, 5, 0, 5, (a, b) => a + b <= 5),
        make: ([a, b], r) => ({
          prompt: `${a} + ${b}`,
          say: `${a} and ${b} more. How many in all?`,
          answer: a + b,
          skill: 'Put together',
          vis: { t: 'pics', a, b, op: '+', icon: pick(r, ICONS) },
          choices: win(r, a + b, 0, 5, 4),
        }),
      },
      'Take apart': {
        pool: pairs(1, 5, 0, 5, (a, b) => b <= a),
        make: ([a, b], r) => ({
          prompt: `${a} − ${b}`,
          say: `${a}, take away ${b}. How many are left?`,
          answer: a - b,
          skill: 'Take apart',
          vis: { t: 'pics', a, b, op: '−', icon: pick(r, ICONS) },
          choices: win(r, a - b, 0, 5, 4),
        }),
      },
    },
    mix: { 'Put together': 11, 'Take apart': 9 },
  }),
  '1.NR.2': () => ({
    strata: addSubStrata(
      pairs(0, 10, 0, 10, (a, b) => a + b <= 10),
      pairs(1, 10, 0, 10, (a, b) => b <= a),
    ),
    mix: {
      '+:+0': 1,
      '+:Count on 1-2': 4,
      '+:Doubles': 3,
      '+:Near doubles': 3,
      '+:Make 10': 2,
      '+:Other within 10': 2,
      '−:−0 / −all': 1,
      '−:Count back 1-2': 5,
      '−:From 10': 3,
      '−:Think addition': 6,
    },
  }),
  '1.NR.5a': () => ({
    strata: {
      '10 more': {
        pool: range(10, 89),
        make: (a) => eqItem(a, 10, '+', '10 more'),
      },
      '10 less': {
        pool: range(20, 99),
        make: (a) => eqItem(a, 10, '−', '10 less'),
      },
    },
    mix: { '10 more': 15, '10 less': 15 },
  }),
  '1.NR.5b': () => ({
    strata: {
      'Add tens': {
        pool: pairs(1, 8, 1, 8, (a, b) => a + b <= 9),
        make: ([a, b]) => eqItem(a * 10, b * 10, '+', 'Add tens'),
      },
      'Subtract tens': {
        pool: pairs(2, 9, 1, 8, (a, b) => b < a),
        make: ([a, b]) => eqItem(a * 10, b * 10, '−', 'Subtract tens'),
      },
    },
    mix: { 'Add tens': 15, 'Subtract tens': 15 },
  }),
  '2.NR.2a': () => ({
    strata: addSubStrata(
      pairs(0, 10, 0, 10),
      pairs(5, 20, 0, 10, (a, b) => b <= a),
    ),
    mix: {
      '+:+0': 1,
      '+:Count on 1-2': 2,
      '+:Doubles': 2,
      '+:Near doubles': 2,
      '+:Make 10': 2,
      '+:Bridge 10': 5,
      '+:Other within 10': 1,
      '−:−0 / −all': 1,
      '−:Count back 1-2': 2,
      '−:From 10': 1,
      '−:Bridge 10': 6,
      '−:Teens, no bridge': 2,
      '−:Think addition': 3,
    },
  }),
  '2.NR.2b': () => ({
    strata: multiDigitStrata(2),
    mix: {
      'Add with regrouping': 4,
      'Add, no regrouping': 3,
      'Subtract with regrouping': 5,
      'Subtract, no regrouping': 3,
    },
  }),
  '3.PAR.3m': () => ({ strata: multStrata(), mix: mm() }),
  '3.PAR.3d': () => ({ strata: divStrata(), mix: dm() }),
  '3.PAR.3t': () => ({
    strata: strataFrom(
      pairs(1, 9, 1, 9),
      ([a]) => '×' + a,
      ([a, b], r) =>
        r() < 0.5
          ? eqItem(a, b * 10, '×', '× tens')
          : eqItem(b * 10, a, '×', '× tens'),
    ),
    mix: {
      '×1': 2,
      '×2': 3,
      '×3': 3,
      '×4': 3,
      '×5': 3,
      '×6': 4,
      '×7': 4,
      '×8': 4,
      '×9': 4,
    },
  }),
  '3.PAR.2': () => ({
    strata: multiDigitStrata(3),
    mix: {
      'Add with regrouping': 3,
      'Add, no regrouping': 2,
      'Subtract with regrouping': 5,
      'Subtract, no regrouping': 2,
    },
  }),
  '4.FACT': () => ({
    strata: { ...prefixed('×:', multStrata()), ...prefixed('÷:', divStrata()) },
    mix: {
      ...prefixMix('×:', allocate(mm(), 15)),
      ...prefixMix('÷:', allocate(dm(), 15)),
    },
  }),
  '4.NR.2': () => ({
    strata: multiDigitStrata(4),
    mix: {
      'Add with regrouping': 3,
      'Add, no regrouping': 1,
      'Subtract with regrouping': 5,
      'Subtract, no regrouping': 1,
    },
  }),
  '5.NR.2a': () => ({
    strata: {
      '2-digit × 2-digit': {
        gen: (r) =>
          vertItem(ri(r, 12, 99), ri(r, 11, 99), '×', '2-digit × 2-digit'),
      },
      '3-digit × 2-digit': {
        gen: (r) =>
          vertItem(ri(r, 102, 999), ri(r, 11, 99), '×', '3-digit × 2-digit'),
      },
    },
    mix: { '2-digit × 2-digit': 3, '3-digit × 2-digit': 5 },
  }),
  '5.NR.2b': () => {
    const g = (d0, d1, sk) => ({
      gen: (r) => {
        const d = ri(r, d0, d1)
        const q = ri(r, Math.ceil(100 / d), Math.floor(9999 / d))
        return vertItem(d * q, d, '÷', sk)
      },
    })
    return {
      strata: {
        '1-digit divisor': g(2, 9, '1-digit divisor'),
        '2-digit divisor': g(10, 25, '2-digit divisor'),
      },
      mix: { '1-digit divisor': 4, '2-digit divisor': 4 },
    }
  },
}
BLUEPRINTS['5.FACT'] = BLUEPRINTS['4.FACT']

function balancedForm(p, r) {
  const bp = BLUEPRINTS[p.id](),
    counts = allocate(bp.mix, p.items),
    out = []
  Object.entries(counts).forEach(([k, c]) => {
    const s = bp.strata[k]
    if (!c || !s) return
    if (s.pool)
      drawFrom(s.pool, c, r).forEach((x) => {
        const it = s.make(x, r)
        it.k = k
        out.push(it)
      })
    else {
      const seen = new Set()
      for (let i = 0; i < c; i++) {
        let it,
          t = 0
        do {
          it = s.gen(r)
          t++
        } while (seen.has(it.prompt) && t < 60)
        seen.add(it.prompt)
        it.k = k
        out.push(it)
      }
    }
  })
  return arrange(out, r)
}

function blueprintRows(p) {
  const bp = BLUEPRINTS[p.id](),
    c = allocate(bp.mix, p.items)
  return Object.entries(c)
    .filter(([, n]) => n)
    .map(([k, n]) => [
      k
        .replace(
          /^[+−×÷]:/,
          (m) =>
            ({
              '+:': 'Add: ',
              '−:': 'Subtract: ',
              '×:': 'Multiply: ',
              '÷:': 'Divide: ',
            })[m],
        )
        .replace(/^n(\d+)$/, '$1')
        .replace(/^×(\d)$/, '$1 × tens'),
      n,
      bp.strata[k].pool ? bp.strata[k].pool.length : null,
    ])
}
PROBES.forEach((p) => {
  p.gen = (r, pp) => balancedForm(pp || p, r)
})

const CMP = (a, b) => (a < b ? '<' : a > b ? '>' : '=')
const CMP_SAY = {
  '<': 'is less than',
  '>': 'is greater than',
  '=': 'is equal to',
}
function cmpItem(a, b, as, bs, skill) {
  return {
    prompt: `${as} ? ${bs}`,
    say: `Compare ${as} and ${bs}.`,
    answer: CMP(a, b),
    skill,
    vis: { t: 'cmp', a: as, b: bs },
    choices: ['<', '=', '>'],
  }
}
const fmtN = (n) => n.toLocaleString('en-US')
const gens = (o) =>
  Object.fromEntries(Object.entries(o).map(([k, g]) => [k, { gen: g }]))
const isPrime = (n) => {
  if (n < 2) return false
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false
  return true
}
const GROUP_LABELS = {
  red: '<span class="gsw" style="background:#C8102E"></span>',
  blue: '<span class="gsw" style="background:#1F6FB2"></span>',
}

const NEW_PROBES = [
  {
    id: 'K.NR.1.3',
    grade: 'K',
    type: 'check',
    label: 'One more, one less (to 20)',
    std: 'K.NR.1.3',
    desc: 'Hear a number and find one more or one less. Read aloud, 3 answer buttons.',
    items: 20,
    secs: 10,
    input: 'choices',
    kind: 'fact',
  },
  {
    id: 'K.NR.4.1',
    grade: 'K',
    type: 'check',
    label: 'Hear it, tap the numeral (0-20)',
    std: 'K.NR.4.1',
    desc: 'The app says a number; the child taps the matching numeral. Listening task, so speaking answers is turned off.',
    items: 20,
    secs: 10,
    input: 'choices',
    kind: 'fact',
    noSpeak: true,
  },
  {
    id: 'K.NR.4.2',
    grade: 'K',
    type: 'check',
    label: 'Which group has more? Fewer?',
    std: 'K.NR.4.2',
    desc: 'Two groups of up to 10 pictures; tap the red or blue group.',
    items: 20,
    secs: 10,
    input: 'choices',
    kind: 'fact',
    noSpeak: true,
  },
  {
    id: 'K.NR.5.1',
    grade: 'K',
    type: 'check',
    label: 'Make 10 (how many more?)',
    std: 'K.NR.5.1',
    desc: 'Ten-frame with some dots; how many more make 10? The runway to 1.NR.2.4.',
    items: 20,
    secs: 10,
    input: 'choices',
    kind: 'fact',
  },

  {
    id: '1.NR.1',
    grade: '1',
    type: 'check',
    label: 'What comes next? (to 120)',
    std: '1.NR.1.1, 1.NR.1.2',
    desc: 'Count forward and back, across decades and past 100.',
    items: 20,
    secs: 6,
    kind: 'fact',
  },
  {
    id: '1.NR.1.3',
    grade: '1',
    type: 'check',
    label: 'Compare numbers to 100',
    std: '1.NR.1.3',
    desc: 'Tap <, =, or >.',
    items: 20,
    secs: 6,
    input: 'choices',
    kind: 'fact',
  },
  {
    id: '1.NR.2.3',
    grade: '1',
    type: 'check',
    label: 'Missing number within 20',
    std: '1.NR.2.3',
    desc: '8 + ? = 13 and 15 − ? = 9, using the inverse relationship.',
    items: 30,
    secs: 6,
    kind: 'fact',
  },
  {
    id: '1.NR.2.5',
    grade: '1',
    type: 'check',
    label: 'True or false? (equal sign)',
    std: '1.NR.2.5',
    desc: 'Decide whether equations like 7 + 2 = 10 − 1 are true.',
    items: 20,
    secs: 8,
    input: 'choices',
    kind: 'fact',
  },

  {
    id: '2.NR.1.2',
    grade: '2',
    type: 'check',
    label: 'Count across tens and hundreds (to 1,000)',
    std: '2.NR.1.2',
    desc: '398, 399, ? and 402, 401, ? style sequences.',
    items: 20,
    secs: 6,
    kind: 'fact',
  },
  {
    id: '2.NR.1.3',
    grade: '2',
    type: 'check',
    label: 'Compare numbers to 1,000',
    std: '2.NR.1.3',
    desc: 'Tap <, =, or >, including reversed digits like 489 and 498.',
    items: 20,
    secs: 6,
    input: 'choices',
    kind: 'fact',
  },
  {
    id: '2.NR.3.1',
    grade: '2',
    type: 'check',
    label: 'Odd or even? (to 20)',
    std: '2.NR.3.1',
    desc: 'A loose group of up to 20 objects; decide odd or even.',
    items: 20,
    secs: 10,
    input: 'choices',
    kind: 'fact',
  },
  {
    id: '2.NR.3.2',
    grade: '2',
    type: 'check',
    label: 'Arrays: how many in all? (to 5 × 5)',
    std: '2.NR.3.2',
    desc: 'Rectangular arrays up to 5 rows and 5 columns. Builds toward multiplication.',
    items: 20,
    secs: 10,
    kind: 'fact',
  },

  {
    id: '3.NR.1.3',
    grade: '3',
    type: 'check',
    label: 'Round to the nearest 10 or 100',
    std: '3.NR.1.3',
    desc: 'Numbers to 1,000, including 5s and rounding up into the next hundred.',
    items: 20,
    secs: 8,
    kind: 'fact',
  },
  {
    id: '3.NR.1.2',
    grade: '3',
    type: 'check',
    label: 'Compare numbers to 10,000',
    std: '3.NR.1.2',
    desc: 'Tap <, =, or >.',
    items: 20,
    secs: 6,
    input: 'choices',
    kind: 'fact',
  },

  {
    id: '4.PAR.3.3',
    grade: '4',
    type: 'check',
    label: 'Missing factor (factor pairs)',
    std: '4.PAR.3.3',
    desc: '6 × ? = 48 and 48 = ? × 8, products to 100.',
    items: 20,
    secs: 6,
    kind: 'fact',
  },
  {
    id: '4.PAR.3.4',
    grade: '4',
    type: 'check',
    label: 'Prime or composite?',
    std: '4.PAR.3.4',
    desc: 'Numbers 2-100, including odd composites like 51 and 91.',
    items: 20,
    secs: 8,
    input: 'choices',
    kind: 'fact',
  },
  {
    id: '4.NR.1.4',
    grade: '4',
    type: 'check',
    label: 'Round multi-digit numbers',
    std: '4.NR.1.4',
    desc: 'To the nearest 100 through 100,000, including rounding across a place.',
    items: 20,
    secs: 12,
    kind: 'fact',
  },
  {
    id: '4.NR.5.3',
    grade: '4',
    type: 'check',
    label: 'Compare decimals to hundredths',
    std: '4.NR.5.3',
    desc: 'Tap <, =, or >, including 0.5 vs 0.45 and 0.5 = 0.50.',
    items: 20,
    secs: 8,
    input: 'choices',
    kind: 'fact',
  },
]

Object.assign(BLUEPRINTS, {
  'K.NR.1.3': () => ({
    strata: {
      'One more': {
        pool: range(1, 19),
        make: (n, r) => ({
          prompt: `One more than ${n}`,
          say: `What number is one more than ${n}?`,
          answer: n + 1,
          skill: 'One more',
          vis: { t: 'onemore', n, dir: 'more' },
          choices: win(r, n + 1, 0, 20, 3),
        }),
      },
      'One less': {
        pool: range(1, 20),
        make: (n, r) => ({
          prompt: `One less than ${n}`,
          say: `What number is one less than ${n}?`,
          answer: n - 1,
          skill: 'One less',
          vis: { t: 'onemore', n, dir: 'less' },
          choices: win(r, n - 1, 0, 20, 3),
        }),
      },
    },
    mix: { 'One more': 10, 'One less': 10 },
  }),
  'K.NR.4.1': () => {
    const mk = (n, r) => ({
      prompt: `Tap ${n}`,
      say: `Tap ${n}.`,
      answer: n,
      quiet: true,
      skill: n <= 10 ? 'Numerals 0-10' : 'Numerals 11-20',
      vis: { t: 'listen' },
      choices: shuffle(r, win(r, n, 0, 20, 4)),
    })
    return {
      strata: {
        'Numerals 0-10': { pool: range(0, 10), make: mk },
        'Numerals 11-20': { pool: range(11, 20), make: mk },
      },
      mix: { 'Numerals 0-10': 10, 'Numerals 11-20': 10 },
    }
  },
  'K.NR.4.2': () => {
    const mk =
      (q) =>
      ([a, b], r) => ({
        prompt: `Which has ${q}? red ${a}, blue ${b}`,
        say: `Which group has ${q}?`,
        answer: (q === 'more') === a > b ? 'red' : 'blue',
        skill: q === 'more' ? 'Which has more' : 'Which has fewer',
        vis: { t: 'groups', a, b, icon: pick(r, ICONS), q },
        choices: ['red', 'blue'],
        labels: GROUP_LABELS,
      })
    const far = (a, b) => Math.abs(a - b) >= 3,
      close = (a, b) => a !== b && Math.abs(a - b) <= 2
    return {
      strata: {
        'More, far apart': { pool: pairs(1, 10, 1, 10, far), make: mk('more') },
        'More, close': { pool: pairs(1, 10, 1, 10, close), make: mk('more') },
        'Fewer, far apart': {
          pool: pairs(1, 10, 1, 10, far),
          make: mk('fewer'),
        },
        'Fewer, close': { pool: pairs(1, 10, 1, 10, close), make: mk('fewer') },
      },
      mix: {
        'More, far apart': 5,
        'More, close': 6,
        'Fewer, far apart': 4,
        'Fewer, close': 5,
      },
    }
  },
  'K.NR.5.1': () => ({
    strata: Object.fromEntries(
      range(1, 9).map((n) => [
        'n' + n,
        {
          pool: [n],
          make: (n, r) => ({
            prompt: `${n} + ? = 10`,
            say: 'How many more make 10?',
            answer: 10 - n,
            skill: `${Math.min(n, 10 - n)} and ${Math.max(n, 10 - n)}`,
            vis: { t: 'frame', n },
            choices: win(r, 10 - n, 0, 10, 4),
          }),
        },
      ]),
    ),
    mix: { n1: 2, n2: 2, n3: 2, n4: 3, n5: 2, n6: 3, n7: 2, n8: 2, n9: 2 },
  }),
  '1.NR.1': () => {
    const fw = (s, skill) => ({
        prompt: `${s}, ${s + 1}, ${s + 2}, ?`,
        say: `${s}, ${s + 1}, ${s + 2}. What comes next?`,
        answer: s + 3,
        skill,
        vis: { t: 'seq', nums: [s, s + 1, s + 2, null] },
      }),
      bk = (s) => ({
        prompt: `${s}, ${s - 1}, ${s - 2}, ?`,
        say: `${s}, ${s - 1}, ${s - 2}. Count back. What comes next?`,
        answer: s - 3,
        skill: 'Count back',
        vis: { t: 'seq', nums: [s, s - 1, s - 2, null] },
      })
    return {
      strata: {
        'Count forward': {
          pool: range(1, 96).filter((s) => (s + 3) % 10 !== 0),
          make: (s) => fw(s, 'Count forward'),
        },
        'Cross a decade': {
          pool: range(1, 9).map((t) => t * 10 - 3),
          make: (s) => fw(s, 'Cross a decade'),
        },
        'Past 100': { pool: range(97, 117), make: (s) => fw(s, 'Past 100') },
        'Count back': { pool: range(23, 120), make: bk },
      },
      mix: {
        'Count forward': 7,
        'Cross a decade': 5,
        'Past 100': 3,
        'Count back': 5,
      },
    }
  },
  '1.NR.1.3': () => ({
    strata: gens({
      'Different tens': (r) => {
        let a, b
        do {
          a = ri(r, 1, 99)
          b = ri(r, 1, 99)
        } while (Math.floor(a / 10) === Math.floor(b / 10))
        return cmpItem(a, b, a, b, 'Different tens')
      },
      'Same tens': (r) => {
        const t = ri(r, 1, 9) * 10
        let a, b
        do {
          a = t + ri(r, 0, 9)
          b = t + ri(r, 0, 9)
        } while (a === b)
        return cmpItem(a, b, a, b, 'Same tens')
      },
      Equal: (r) => {
        const a = ri(r, 1, 99)
        return cmpItem(a, a, a, a, 'Equal')
      },
    }),
    mix: { 'Different tens': 9, 'Same tens': 8, Equal: 3 },
  }),
  '1.NR.2.3': () => {
    const it = (text, ans, skill) => ({
      prompt: text,
      say: text.replace('?', 'what').replace('−', 'minus').replace('+', 'plus'),
      answer: ans,
      skill,
      vis: { t: 'eq', text },
    })
    return {
      strata: gens({
        'Missing addend within 10': (r) => {
          const c = ri(r, 3, 10),
            a = ri(r, 1, c - 1)
          return it(`${a} + ? = ${c}`, c - a, 'Missing addend within 10')
        },
        'Missing addend, teens': (r) => {
          const c = ri(r, 11, 18),
            a = ri(r, c - 10, 9)
          return it(`${a} + ? = ${c}`, c - a, 'Missing addend, teens')
        },
        'Missing first addend': (r) => {
          const c = ri(r, 11, 18),
            b = ri(r, c - 10, 9)
          return it(`? + ${b} = ${c}`, c - b, 'Missing first addend')
        },
        'Missing part in subtraction': (r) => {
          const c = ri(r, 11, 18),
            d = ri(r, c - 10, 9)
          return it(`${c} − ? = ${d}`, c - d, 'Missing part in subtraction')
        },
      }),
      mix: {
        'Missing addend within 10': 6,
        'Missing addend, teens': 8,
        'Missing first addend': 8,
        'Missing part in subtraction': 8,
      },
    }
  },
  '1.NR.2.5': () => {
    const tf = (text, ok, skill) => ({
      prompt: text,
      say:
        text
          .replace(/−/g, 'minus')
          .replace(/\+/g, 'plus')
          .replace(/=/g, 'equals') + '. True or false?',
      ask: 'True or false?',
      answer: ok ? 'True' : 'False',
      skill,
      vis: { t: 'eq', text },
      choices: ['True', 'False'],
    })
    const off = (r, v) => v + (r() < 0.5 || v === 0 ? 1 : -1)
    const nf = (t) => (r) => {
      const a = ri(r, 1, 9),
        b = ri(r, 1, 9)
      return tf(`${t ? a + b : off(r, a + b)} = ${a} + ${b}`, t, 'Number first')
    }
    const bs = (t) => (r) => {
      const a = ri(r, 1, 9),
        b = ri(r, 1, 9),
        s = a + b,
        c = ri(r, Math.max(1, s - 9), Math.min(9, s - 1)),
        d = s - c
      const useSub = r() < 0.5
      if (useSub) {
        const e = ri(r, 1, 9),
          x = s + e
        return tf(`${a} + ${b} = ${t ? x : off(r, x)} − ${e}`, t, 'Both sides')
      }
      return tf(`${a} + ${b} = ${c} + ${t ? d : off(r, d)}`, t, 'Both sides')
    }
    const sf = (t) => (r) => {
      const a = ri(r, 2, 18),
        b = ri(r, 1, Math.min(9, a))
      const sub = r() < 0.5
      const v = sub ? a - b : a + b
      if (!sub && v > 20) return sf(t)(r)
      return tf(
        `${a} ${sub ? '−' : '+'} ${b} = ${t ? v : off(r, v)}`,
        t,
        'Standard form',
      )
    }
    return {
      strata: gens({
        'Number first|T': nf(true),
        'Number first|F': nf(false),
        'Both sides|T': bs(true),
        'Both sides|F': bs(false),
        'Standard form|T': sf(true),
        'Standard form|F': sf(false),
      }),
      mix: {
        'Number first|T': 3,
        'Number first|F': 3,
        'Both sides|T': 4,
        'Both sides|F': 4,
        'Standard form|T': 3,
        'Standard form|F': 3,
      },
    }
  },
  '2.NR.1.2': () => {
    const fw = (s, skill) => ({
        prompt: `${s}, ${s + 1}, ${s + 2}, ?`,
        say: `${s}, ${s + 1}, ${s + 2}. What comes next?`,
        answer: s + 3,
        skill,
        vis: { t: 'seq', nums: [s, s + 1, s + 2, null] },
      }),
      bk = (s, skill) => ({
        prompt: `${s}, ${s - 1}, ${s - 2}, ?`,
        say: `${s}, ${s - 1}, ${s - 2}. What comes next?`,
        answer: s - 3,
        skill,
        vis: { t: 'seq', nums: [s, s - 1, s - 2, null] },
      })
    return {
      strata: gens({
        'Forward across a hundred': (r) =>
          fw(ri(r, 1, 9) * 100 - 3, 'Forward across a hundred'),
        'Forward across a ten': (r) => {
          let t
          do {
            t = ri(r, 11, 99)
          } while (t % 10 === 0)
          return fw(t * 10 - 3, 'Forward across a ten')
        },
        'Backward across a hundred': (r) =>
          bk(ri(r, 1, 9) * 100 + 2, 'Backward across a hundred'),
        'Backward across a ten': (r) => {
          let t
          do {
            t = ri(r, 11, 99)
          } while (t % 10 === 0)
          return bk(t * 10 + 2, 'Backward across a ten')
        },
      }),
      mix: {
        'Forward across a hundred': 5,
        'Forward across a ten': 5,
        'Backward across a hundred': 5,
        'Backward across a ten': 5,
      },
    }
  },
  '2.NR.1.3': () => ({
    strata: gens({
      'Different hundreds': (r) => {
        let a, b
        do {
          a = ri(r, 100, 999)
          b = ri(r, 100, 999)
        } while (Math.floor(a / 100) === Math.floor(b / 100))
        return cmpItem(a, b, a, b, 'Different hundreds')
      },
      'Same hundreds': (r) => {
        const h = ri(r, 1, 9) * 100
        let a, b
        do {
          a = h + ri(r, 0, 99)
          b = h + ri(r, 0, 99)
        } while (Math.floor(a / 10) === Math.floor(b / 10))
        return cmpItem(a, b, a, b, 'Same hundreds')
      },
      'Reversed or close digits': (r) => {
        let a, b
        do {
          const h = ri(r, 1, 9),
            x = ri(r, 0, 9),
            y = ri(r, 0, 9)
          a = h * 100 + x * 10 + y
          b = h * 100 + y * 10 + x
        } while (a === b)
        return cmpItem(a, b, a, b, 'Reversed or close digits')
      },
      Equal: (r) => {
        const a = ri(r, 100, 999)
        return cmpItem(a, a, a, a, 'Equal')
      },
    }),
    mix: {
      'Different hundreds': 6,
      'Same hundreds': 6,
      'Reversed or close digits': 6,
      Equal: 2,
    },
  }),
  '2.NR.3.1': () => {
    const mk = (n, r) => ({
      prompt: `${n} objects: odd or even?`,
      say: 'Is this group odd or even?',
      ask: 'Odd or even?',
      answer: n % 2 ? 'Odd' : 'Even',
      skill: (n % 2 ? 'Odd' : 'Even') + (n <= 10 ? ' to 10' : ' 11-20'),
      vis: { t: 'loose', n, s: ri(r, 1, 1e6), icon: pick(r, ICONS) },
      choices: ['Odd', 'Even'],
    })
    return {
      strata: {
        'Even to 10': { pool: [2, 4, 6, 8, 10], make: mk },
        'Odd to 10': { pool: [1, 3, 5, 7, 9], make: mk },
        'Even 11-20': { pool: [12, 14, 16, 18, 20], make: mk },
        'Odd 11-20': { pool: [11, 13, 15, 17, 19], make: mk },
      },
      mix: { 'Even to 10': 5, 'Odd to 10': 5, 'Even 11-20': 5, 'Odd 11-20': 5 },
    }
  },
  '2.NR.3.2': () => {
    const mk = ([rows, cols]) => ({
      prompt: `${rows} rows of ${cols}`,
      say: 'How many in all?',
      ask: 'How many in all?',
      answer: rows * cols,
      skill:
        rows * cols <= 10
          ? 'Arrays to 10'
          : rows * cols <= 16
            ? 'Arrays 12-16'
            : 'Arrays 18-25',
      vis: { t: 'array', rows, cols },
    })
    return {
      strata: strataFrom(
        pairs(2, 5, 2, 5),
        ([a, b]) =>
          a * b <= 10
            ? 'Arrays to 10'
            : a * b <= 16
              ? 'Arrays 12-16'
              : 'Arrays 18-25',
        mk,
      ),
      mix: { 'Arrays to 10': 6, 'Arrays 12-16': 7, 'Arrays 18-25': 7 },
    }
  },
  '3.NR.1.3': () => {
    const rnd = (n, p) => Math.round(n / p) * p,
      it = (n, p, skill) => ({
        prompt: `Round ${fmtN(n)} to the nearest ${p}`,
        say: `Round ${n} to the nearest ${p}.`,
        answer: rnd(n, p),
        skill,
        vis: { t: 'round', n: fmtN(n), p: fmtN(p) },
      })
    return {
      strata: gens({
        'Nearest 10': (r) => {
          let n
          do {
            n = ri(r, 11, 989)
          } while ([0, 5].includes(n % 10) || n % 100 >= 95)
          return it(n, 10, 'Nearest 10')
        },
        'Nearest 10, ones digit 5': (r) => {
          let n
          do {
            n = ri(r, 1, 98) * 10 + 5
          } while (n % 100 === 95)
          return it(n, 10, 'Nearest 10, ones digit 5')
        },
        'Nearest 100': (r) => {
          let n
          do {
            n = ri(r, 101, 949)
          } while (n % 100 === 0 || Math.floor(n / 10) % 10 === 5)
          return it(n, 100, 'Nearest 100')
        },
        'Nearest 100, tens digit 5': (r) => {
          const n = ri(r, 1, 8) * 100 + 50 + ri(r, 0, 9)
          return it(n, 100, 'Nearest 100, tens digit 5')
        },
        'Up into the next hundred': (r) =>
          r() < 0.5
            ? it(
                ri(r, 1, 9) * 100 - ri(r, 1, 4),
                10,
                'Up into the next hundred',
              )
            : it(ri(r, 950, 999), 100, 'Up into the next hundred'),
      }),
      mix: {
        'Nearest 10': 6,
        'Nearest 10, ones digit 5': 2,
        'Nearest 100': 6,
        'Nearest 100, tens digit 5': 2,
        'Up into the next hundred': 4,
      },
    }
  },
  '3.NR.1.2': () => ({
    strata: gens({
      'Different number of digits': (r) => {
        const a = ri(r, 100, 999),
          b = ri(r, 1000, 9999)
        return r() < 0.5
          ? cmpItem(a, b, fmtN(a), fmtN(b), 'Different number of digits')
          : cmpItem(b, a, fmtN(b), fmtN(a), 'Different number of digits')
      },
      'Different thousands': (r) => {
        let a, b
        do {
          a = ri(r, 1000, 9999)
          b = ri(r, 1000, 9999)
        } while (Math.floor(a / 1000) === Math.floor(b / 1000))
        return cmpItem(a, b, fmtN(a), fmtN(b), 'Different thousands')
      },
      'Different hundreds': (r) => {
        const th = ri(r, 1, 9) * 1000
        let a, b
        do {
          a = th + ri(r, 0, 999)
          b = th + ri(r, 0, 999)
        } while (Math.floor(a / 100) === Math.floor(b / 100))
        return cmpItem(a, b, fmtN(a), fmtN(b), 'Different hundreds')
      },
      'Different tens or ones': (r) => {
        const base = ri(r, 10, 99) * 100
        let a, b
        do {
          a = base + ri(r, 0, 99)
          b = base + ri(r, 0, 99)
        } while (a === b)
        return cmpItem(a, b, fmtN(a), fmtN(b), 'Different tens or ones')
      },
      Equal: (r) => {
        const a = ri(r, 1000, 9999)
        return cmpItem(a, a, fmtN(a), fmtN(a), 'Equal')
      },
    }),
    mix: {
      'Different number of digits': 4,
      'Different thousands': 4,
      'Different hundreds': 5,
      'Different tens or ones': 5,
      Equal: 2,
    },
  }),
  '4.PAR.3.3': () => {
    const mk = (lo, hi, skillOf) => (r) => {
      const a = ri(r, lo, hi),
        b = ri(r, 2, Math.floor(100 / a)),
        p = a * b,
        f = ri(r, 0, 2)
      const text =
        f === 0
          ? `${a} × ? = ${p}`
          : f === 1
            ? `? × ${a} = ${p}`
            : `${p} = ${a} × ?`
      return {
        prompt: text,
        say: text.replace('×', 'times').replace('?', 'what'),
        answer: b,
        skill: a + 's',
        vis: { t: 'eq', text },
      }
    }
    return {
      strata: gens({
        'Known factor 2-5': mk(2, 5),
        'Known factor 6-9': mk(6, 9),
      }),
      mix: { 'Known factor 2-5': 8, 'Known factor 6-9': 12 },
    }
  },
  '4.PAR.3.4': () => {
    const mk = (n) => ({
      prompt: `${n}: prime or composite?`,
      say: `Is ${n} prime or composite?`,
      ask: 'Prime or composite?',
      answer: isPrime(n) ? 'Prime' : 'Composite',
      skill: '',
      vis: { t: 'bignum', n },
      choices: ['Prime', 'Composite'],
    })
    const st = (pool, skill) => ({
      pool,
      make: (n) => Object.assign(mk(n), { skill }),
    })
    return {
      strata: {
        'Prime under 20': st(range(2, 19).filter(isPrime), 'Prime under 20'),
        'Prime 20-100': st(range(20, 100).filter(isPrime), 'Prime 20-100'),
        'Composite, even': st(
          range(4, 100).filter((n) => n % 2 === 0),
          'Composite, even',
        ),
        'Composite, odd': st(
          range(9, 99).filter((n) => n % 2 && !isPrime(n)),
          'Composite, odd',
        ),
      },
      mix: {
        'Prime under 20': 5,
        'Prime 20-100': 5,
        'Composite, even': 4,
        'Composite, odd': 6,
      },
    }
  },
  '4.NR.1.4': () => {
    const rnd = (n, p) => Math.round(n / p) * p,
      it = (n, p, skill) => ({
        prompt: `Round ${fmtN(n)} to the nearest ${fmtN(p)}`,
        say: `Round ${fmtN(n)} to the nearest ${fmtN(p)}.`,
        answer: rnd(n, p),
        skill,
        vis: { t: 'round', n: fmtN(n), p: fmtN(p) },
      })
    const plain = (p, lo, hi) => (r) => {
      let n
      do {
        n = ri(r, lo, hi)
      } while (n % p === 0 || Math.floor(n / (p / 10)) % 10 === 9)
      return it(n, p, 'Nearest ' + fmtN(p))
    }
    return {
      strata: {
        'Nearest 100': { gen: plain(100, 1000, 99999) },
        'Nearest 1,000': { gen: plain(1000, 10000, 99999) },
        'Nearest 10,000': { gen: plain(10000, 10000, 999999) },
        'Nearest 100,000': { gen: plain(100000, 100000, 999999) },
        'Across a place': {
          gen: (r) => {
            const p = pick(r, [100, 1000, 10000])
            const top = ri(r, 1, 9) * p * 10
            return it(top - ri(r, 1, p / 2 - 1), p, 'Across a place')
          },
        },
      },
      mix: {
        'Nearest 100': 4,
        'Nearest 1,000': 4,
        'Nearest 10,000': 4,
        'Nearest 100,000': 4,
        'Across a place': 4,
      },
    }
  },
  '4.NR.5.3': () => {
    const d = (h) => (h / 100).toFixed(2),
      t = (x) => (x / 10).toFixed(1)
    return {
      strata: gens({
        'Tenths vs hundredths': (r) => {
          const T = ri(r, 2, 9),
            H = (T - 1) * 10 + ri(r, 1, 19)
          if (H === T * 10)
            return cmpItem(
              T * 10,
              H + 1,
              t(T),
              d(H + 1),
              'Tenths vs hundredths',
            )
          return r() < 0.5
            ? cmpItem(T * 10, H, t(T), d(H), 'Tenths vs hundredths')
            : cmpItem(H, T * 10, d(H), t(T), 'Tenths vs hundredths')
        },
        'Same tenths': (r) => {
          const T = ri(r, 0, 9)
          let a, b
          do {
            a = T * 10 + ri(r, 1, 9)
            b = T * 10 + ri(r, 1, 9)
          } while (a === b)
          return cmpItem(a, b, d(a), d(b), 'Same tenths')
        },
        'Different tenths': (r) => {
          let a, b
          do {
            a = ri(r, 1, 99)
            b = ri(r, 1, 99)
          } while (Math.floor(a / 10) === Math.floor(b / 10))
          return cmpItem(a, b, d(a), d(b), 'Different tenths')
        },
        'Equal (0.5 and 0.50)': (r) => {
          const T = ri(r, 1, 9)
          return r() < 0.5
            ? cmpItem(T * 10, T * 10, t(T), d(T * 10), 'Equal (0.5 and 0.50)')
            : cmpItem(T * 10, T * 10, d(T * 10), t(T), 'Equal (0.5 and 0.50)')
        },
        'Different ones': (r) => {
          const a = 100 + ri(r, 0, 99),
            b = ri(r, 50, 99)
          return r() < 0.5
            ? cmpItem(a, b, d(a), d(b), 'Different ones')
            : cmpItem(b, a, d(b), d(a), 'Different ones')
        },
      }),
      mix: {
        'Tenths vs hundredths': 5,
        'Same tenths': 4,
        'Different tenths': 4,
        'Equal (0.5 and 0.50)': 3,
        'Different ones': 4,
      },
    }
  },
})

NEW_PROBES.forEach((p) => {
  p.gen = (r, pp) => balancedForm(pp || p, r)
  PR[p.id] = p
  const last = PROBES.map((x) => x.grade).lastIndexOf(p.grade)
  PROBES.splice(last + 1, 0, p)
})

const FLUENCY_IDS = [
  'K.NR.5',
  '1.NR.2',
  '2.NR.2a',
  '2.NR.2b',
  '3.PAR.2',
  '4.NR.2',
  '5.NR.2a',
]
PROBES.forEach((p) => {
  if (!p.type)
    p.type = FLUENCY_IDS.includes(p.id)
      ? 'fluency'
      : ['3.PAR.3m', '3.PAR.3d'].includes(p.id)
        ? 'local'
        : 'check'
})
const TYPE_LABEL = {
  fluency: 'Fluency standard',
  check: 'Skill check',
  local: 'Local expectation',
}

const SERVER = false
const call = (fn, ...args) =>
  new Promise((res, rej) =>
    google.script.run
      .withSuccessHandler(res)
      .withFailureHandler(rej)
      [fn](...args),
  )
const PILOT = !SERVER && !!window.TD_PILOT
const LS_KEY = PILOT ? 'tigerdowns_pilot_v1' : 'pathway_rosenbaum_preview_v2'
const legacyStorage = Fluency.isTour() ? RaceStorage : RaceStorage
const local = {
  get() {
    try {
      return JSON.parse(legacyStorage.getItem(LS_KEY)) || {}
    } catch (e) {
      return {}
    }
  },
  set(v) {
    try {
      legacyStorage.setItem(LS_KEY, JSON.stringify(v))
    } catch (e) {}
  },
}
let DB = {
  role: 'demo',
  teachers: [],
  students: [],
  attempts: [],
  notes: {},
  bench: null,
}
let FRIDAYS = []

const SEED_END = '2026-10-02'
const FIRST = [
  'Amari',
  'Bella',
  'Caden',
  'Dariana',
  'Elijah',
  'Faith',
  'Gavin',
  'Harmony',
  'Isaiah',
  'Jada',
  'Kingston',
  'Laila',
  'Malik',
  'Nevaeh',
  'Omar',
  'Paisley',
  'Quinton',
  'Riley',
  'Samir',
  'Taniyah',
  'Uriel',
  'Violet',
  'Wesley',
  'Ximena',
  'Yusuf',
  'Zoey',
  'Aaliyah',
  'Brantley',
  'Camila',
  'Deshawn',
  'Emery',
  'Finn',
  'Genesis',
  'Hudson',
  'Imani',
  'Jaxon',
  'Kehlani',
  'Levi',
  'Maya',
  'Nolan',
  'Olivia',
  'Parker',
  'Royalty',
  'Silas',
  'Trinity',
  'Uma',
  'Wyatt',
  'Zion',
  'Aubrey',
  'Bryson',
  'Carter',
  'Destiny',
  'Easton',
  'Gracie',
  'Hayden',
  'Josiah',
  'Kinsley',
  'Legend',
  'Mila',
  'Noah',
]
const LASTI = 'ABCDEFGHJKLMNPRSTW'
const CLASS_SEED = [
  ['K', 'Ms. Avery', 'K.NR.1', 0.42, [0.035]],
  ['K', 'Ms. Brooks', 'K.NR.1', 0.4, [0.05]],
  ['K', 'Mr. Coleman', 'K.NR.1', 0.4, [0.004]],
  ['1', 'Ms. Dawson', '1.NR.2', 0.38, [0.03]],
  ['1', 'Ms. Ellis', '1.NR.2', 0.4, [0.045]],
  ['1', 'Mrs. Flores', '1.NR.2', 0.32, [0.02]],
  ['2', 'Mr. Grant', '2.NR.2a', 0.4, [0.03]],
  [
    '2',
    'Ms. Hayes',
    '2.NR.2a',
    0.38,
    [0.004, 0.004, 0.004, 0.004, 0.004, 0.055],
  ],
  ['2', 'Mrs. Irwin', '2.NR.2a', 0.42, [0.04]],
  ['3', 'Ms. Jordan', '3.PAR.3m', 0.3, [0.035]],
  ['3', 'Mr. Knox', '3.PAR.3m', 0.3, [0.055]],
  ['3', 'Ms. Lane', '3.PAR.3m', 0.28, [0.02]],
  ['4', 'Mrs. Moss', '4.FACT', 0.5, [0.03]],
  ['4', 'Mr. Nash', '4.NR.2', 0.4, [0.025]],
  ['4', 'Ms. Owens', '4.FACT', 0.48, [-0.004]],
  ['5', 'Ms. Pierce', '5.FACT', 0.55, [0.025]],
  ['5', 'Mr. Quinn', '5.NR.2a', 0.35, [0.03]],
  ['5', 'Mrs. Reed', '5.FACT', 0.52, [0.04]],
]
const NOTE_BANK = {
  K: [
    'Number talks with dot cards, quick looks',
    'Ten-frame flash, 5 and some more',
    'Counting collections in small groups',
    'Rekenrek: how many, how do you know?',
  ],
  1: [
    'Doubles and near doubles number strings',
    'Make 10 with ten-frames',
    'Count on from the larger addend',
    'Fact families and think-addition',
  ],
  2: [
    'Make 10 / bridge through 10 strings',
    'Number line jumps for subtraction',
    'Doubles plus one, small group',
    'Think-addition for subtraction',
  ],
  3: [
    'Arrays for 2s, 5s, 10s',
    'Doubling strategy: 4s from 2s, 8s from 4s',
    'Break apart (distributive) for 6s, 7s',
    '9s pattern and use 10s minus one',
  ],
  4: [
    'Fact warm-ups plus partial products',
    'Place value strategies before algorithm',
    'Spiral review of 6s, 7s, 8s',
    'Small group on regrouping across zeros',
  ],
  5: [
    'Area model to standard algorithm',
    'Estimate first, then multiply',
    'Partial quotients with friendly multiples',
    'Fact gaps: targeted 7s and 8s',
  ],
}

function buildSeed() {
  const teachers = [],
    students = [],
    attempts = [],
    notes = {},
    flex = [],
    practice = []
  const OVERRIDE = {
    11: ['2.NR.2a', 3, 0.4],
    14: ['3.PAR.3m', 2, 0.3],
    16: ['5.FACT', 2, 0.45],
    2: ['K.NR.2', 1, 0.35],
  }
  const weeks = fridaysBetween(SETTINGS.startDate, SEED_END)
  CLASS_SEED.forEach(([g, name, pid, base, gains], ci) => {
    const tid = 't' + (ci + 1),
      code = 'TG-' + g + String.fromCharCode(65 + (ci % 3))
    teachers.push({
      id: tid,
      name,
      grade: g,
      school: SETTINGS.school,
      classCode: code,
      probeId: pid,
      email: name.toLowerCase().replace(/[^a-z]/g, '') + '@demo.mcss',
    })
    const r = rng(hash(tid)),
      n = ri(r, 14, 17),
      p = PR[pid]
    notes[tid] = {}
    weeks.forEach((w, wi) => {
      if (wi % 2 === 0 || (name === 'Ms. Hayes' && wi === 5))
        notes[tid][w] =
          name === 'Ms. Hayes' && wi === 5
            ? 'Changed plan: daily make-10 small groups with ten-frames, plus 5-minute number strings'
            : NOTE_BANK[g][((wi / 2 + ci) % 4) | 0]
    })
    for (let k = 0; k < n; k++) {
      const sid = tid + 's' + (k + 1),
        nm =
          FIRST[(ci * 7 + k * 3) % FIRST.length] +
          ' ' +
          LASTI[(ci * 5 + k) % LASTI.length] +
          '.'
      const ov = OVERRIDE[ci] && k < OVERRIDE[ci][1] ? OVERRIDE[ci] : null,
        spid = ov ? ov[0] : pid,
        sp = PR[spid]
      const accom = r() < 0.09 ? { x: 1.5, read: g !== 'K' && r() < 0.5 } : null
      students.push({
        id: sid,
        name: nm,
        teacherId: tid,
        grade: g,
        probeId: ov ? spid : '',
        accom,
        sisId: String(1000000000 + (hash(sid) % 899999999)),
        familyEmail: 'family.' + sid + '@example.org',
        familyLang: r() < 0.14 ? 'es' : 'en',
      })
      let ab = clamp((ov ? ov[2] : base) + (r() - 0.5) * 0.42, 0.05, 0.92)
      const mult = 0.4 + r() * 1.2
      weeks.forEach((w, wi) => {
        const gain = gains[Math.min(wi, gains.length - 1)]
        if (wi > 0)
          ab = clamp(ab + gain * mult + (r() - 0.5) * 0.012, 0.03, 0.98)
        if (r() < 0.07) return
        const pw = clamp(ab + (r() - 0.5) * 0.05, 0.02, 0.99),
          ir = rng(hash(sid + w)),
          items = sp.gen(ir, sp)
        let c = 0,
          inc = 0,
          nr = 0
        const sk = {}
        items.forEach((it) => {
          const d = 0.86 + (hash(it.skill) % 25) / 100
          const ok = ir() < clamp(pw * d, 0, 0.995)
          sk[it.skill] = sk[it.skill] || [0, 0]
          sk[it.skill][1]++
          if (ok) {
            c++
            sk[it.skill][0]++
          } else if (ir() < 0.55) inc++
          else nr++
        })
        const date = ir() < 0.12 ? iso(new Date(D(w).getTime() - 864e5)) : w
        attempts.push({
          id: sid + '_' + w,
          sid,
          pid: spid,
          date,
          correct: c,
          incorrect: inc,
          noResp: nr,
          notRec: 0,
          total: items.length,
          secs: Math.round(items.length * sp.secs * (0.55 + ir() * 0.35)),
          mode: 'type',
          exits: ir() < 0.03 ? 1 : 0,
          medianRt: r1(sp.secs * (0.35 + (1 - pw) * 0.5)),
          skills: sk,
          accom: accom ? accom.x : 0,
          seed: true,
        })
        if (wi >= weeks.length - 2 && r() < 0.45)
          practice.push({
            id: 'p' + sid + w,
            sid,
            pid: spid,
            date: iso(new Date(D(w).getTime() - 2 * 864e5)),
            items: 15,
            correct: Math.round(15 * clamp(pw + 0.1, 0, 1)),
            secs: ri(r, 180, 420),
            seed: true,
          })
        if (
          monthKey(w) === '2026-09' &&
          D(w).getDate() >= 14 &&
          D(w).getDate() < 21 &&
          r() < 0.75
        ) {
          const it = sp.gen(rng(hash(sid + 'flex')), sp)[0]
          flex.push({
            id: 'f' + sid,
            sid,
            pid: spid,
            date: iso(new Date(D(w).getTime() - 864e5)),
            prompt: it.prompt,
            level: clamp(1 + Math.floor(pw * 3.6 + (r() - 0.5)), 1, 4),
            note: '',
            seed: true,
          })
        }
      })
    }
  })
  const stables = {}
  students.forEach((s) => {
    const h = hash(s.id)
    if (h % 10 < 8) {
      const st = defaultStable(s.id)
      st.ride = ['horse', 'horse', 'horse', 'zebra', 'tiger', 'moto'][h % 6]
      st.name =
        s.grade === 'K'
          ? K_NAMES[h % K_NAMES.length][1]
          : NAME_A[h % NAME_A.length] + ' ' + NAME_B[(h >>> 5) % NAME_B.length]
      stables[s.id] = st
    }
  })
  ;[
    ['t8s2', 'Sir Gallops-a-Lot'],
    ['t8s7', 'Turbo Tater'],
    ['t12s5', 'Pecan Pie'],
  ].forEach(([sid, n]) => {
    if (stables[sid]) {
      stables[sid].custom = n
      stables[sid].nameStatus = 'pending'
    }
  })
  return { teachers, students, attempts, notes, flex, practice, stables }
}

const API = {
  async boot(params) {
    if (SERVER) {
      const b = await call('bootstrap', params)
      Object.assign(SETTINGS, b.settings || {})
      applyTiming()
      DB = Object.assign(
        { notes: {}, bench: null, flex: [], practice: [], stables: {} },
        b,
      )
    } else {
      const L = local.get()
      Object.assign(SETTINGS, L.settings || {})
      applyTiming()
      const seed = PILOT
        ? {
            teachers: L.teachers || [],
            students: [],
            attempts: [],
            notes: {},
            flex: [],
            practice: [],
            stables: {},
          }
        : buildSeed()
      seed.students.push(...(L.students || []))
      seed.attempts.push(...(L.attempts || []))
      Object.entries(L.classProbe || {}).forEach(([tid, pid]) => {
        const t = seed.teachers.find((x) => x.id === tid)
        if (t) t.probeId = pid
      })
      seed.flex.push(...(L.flex || []))
      seed.practice.push(...(L.practice || []))
      Object.assign(seed.stables, L.stables || {})
      Object.entries(L.studentPatch || {}).forEach(([sid, pt]) => {
        const s = seed.students.find((x) => x.id === sid)
        if (s) Object.assign(s, pt)
      })
      Object.entries(L.notes || {}).forEach(([tid, m]) => {
        seed.notes[tid] = Object.assign(seed.notes[tid] || {}, m)
      })
      DB = Object.assign({ role: PILOT ? 'pilot' : 'demo' }, seed)
    }
    const last = [todayIso(), ...DB.attempts.map((a) => a.date)].sort().pop()
    FRIDAYS = fridaysBetween(
      SETTINGS.startDate,
      fridayOf(last) > todayIso() ? fridayOf(last) : last,
    )
    if (
      D(FRIDAYS[FRIDAYS.length - 1]) > new Date() &&
      !DB.attempts.some((a) => fridayOf(a.date) === FRIDAYS[FRIDAYS.length - 1])
    )
      FRIDAYS.pop()
  },
  async studentState(code, sid) {
    if (SERVER) {
      const s = await call('studentState', code, sid)
      DB.attempts = DB.attempts.filter((a) => a.sid !== sid).concat(s.attempts)
      DB.practice = (DB.practice || [])
        .filter((p) => p.sid !== sid)
        .concat(s.practice || [])
      DB.flex = (DB.flex || [])
        .filter((f) => f.sid !== sid)
        .concat(s.flex || [])
      if (s.stable) DB.stables[sid] = s.stable
      return s
    }
    return { attempts: DB.attempts.filter((a) => a.sid === sid) }
  },
  async saveAttempt(a, items) {
    DB.attempts.push(a)
    bumpCache()
    if (SERVER) return call('saveAttempt', a, items)
    const L = local.get()
    ;(L.attempts = L.attempts || []).push(a)
    ;(L.items = L.items || {})[a.id] = items
    if (PILOT) pilotPrune(L)
    local.set(L)
  },
  async getItems(aid) {
    if (SERVER) return call('getItems', aid)
    return (local.get().items || {})[aid] || null
  },
  async saveNote(tid, week, text) {
    ;(DB.notes[tid] = DB.notes[tid] || {})[week] = text
    if (SERVER) return call('saveNote', tid, week, text)
    const L = local.get()
    ;((L.notes = L.notes || {})[tid] = L.notes[tid] || {})[week] = text
    local.set(L)
  },
  async setProbe(tid, pid) {
    DB.teachers.find((t) => t.id === tid).probeId = pid
    if (SERVER) return call('setClassProbe', tid, pid)
    const L = local.get()
    ;(L.classProbe = L.classProbe || {})[tid] = pid
    local.set(L)
  },
  async addStudents(tid, names) {
    const t = DB.teachers.find((x) => x.id === tid)
    if (SERVER) {
      const added = await call('addStudents', tid, names)
      DB.students.push(...added)
      return added
    }
    const added = names.map((nm, i) => ({
      id: tid + 'n' + Date.now().toString(36) + i,
      name: nm,
      teacherId: tid,
      grade: t.grade,
    }))
    DB.students.push(...added)
    const L = local.get()
    ;(L.students = L.students || []).push(...added)
    local.set(L)
    return added
  },
  async saveSettings(s) {
    Object.assign(SETTINGS, s)
    applyTiming()
    if (SERVER) return call('saveSettings', SETTINGS)
    const L = local.get()
    L.settings = SETTINGS
    local.set(L)
  },
  async updateStudent(sid, patch) {
    Object.assign(studentOf(sid), patch)
    bumpCache()
    if (SERVER) return call('updateStudent', sid, patch)
    const L = local.get()
    ;(L.studentPatch = L.studentPatch || {})[sid] = Object.assign(
      (L.studentPatch || {})[sid] || {},
      patch,
    )
    local.set(L)
  },
  async saveFlex(rec) {
    DB.flex = DB.flex.filter((f) => f.id !== rec.id)
    DB.flex.push(rec)
    if (SERVER) return call('saveFlex', rec)
    const L = local.get()
    L.flex = (L.flex || []).filter((f) => f.id !== rec.id)
    L.flex.push(rec)
    local.set(L)
  },
  async logPractice(rec) {
    DB.practice.push(rec)
    if (SERVER) return call('logPractice', rec)
    const L = local.get()
    ;(L.practice = L.practice || []).push(rec)
    local.set(L)
  },
  async saveStable(sid, st) {
    st.updatedAt = Date.now()
    DB.stables[sid] = st
    if (SERVER)
      return call('saveStable', sid, st).catch(() =>
        toast('Could not save your stable. Check the connection.'),
      )
    const L = local.get()
    ;(L.stables = L.stables || {})[sid] = st
    local.set(L)
  },
  async approveName(sid, ok) {
    const st = stableOf(sid)
    st.nameStatus = ok ? 'ok' : 'denied'
    if (SERVER) return call('approveName', sid, ok)
    const L = local.get()
    ;(L.stables = L.stables || {})[sid] = st
    local.set(L)
  },
  async markDelivered(sid, key) {
    const st = stableOf(sid)
    ;(st.delivered = st.delivered || {})[key] = todayIso()
    if (SERVER) return call('markDelivered', sid, key)
    const L = local.get()
    ;(L.stables = L.stables || {})[sid] = st
    local.set(L)
  },
  async commsPreview(kind) {
    if (SERVER) return call('commsPreview', kind)
    return null
  },
  resetDemo() {
    RaceStorage.removeItem(LS_KEY)
    location.reload()
  },
}

const teacherOf = (id) => DB.teachers.find((t) => t.id === id)
const studentOf = (id) => DB.students.find((s) => s.id === id)
const rosterOf = (tid) =>
  DB.students
    .filter((s) => s.teacherId === tid)
    .sort((a, b) => a.name.localeCompare(b.name))
const wIndex = (w) => FRIDAYS.indexOf(w)
const goalWeekIndex = () =>
  FRIDAYS.length
    ? wIndex(FRIDAYS[0]) + weeksBetween(FRIDAYS[0], fridayOf(SETTINGS.goalDate))
    : 36

const effPid = (s) => (s && s.probeId) || teacherOf(s.teacherId)?.probeId
let CACHE = { v: -1, wp: {}, bySid: null, pidSids: null }
function bumpCache() {
  CACHE.v = -1
}
function cache() {
  const v = DB.attempts.length * 1000 + FRIDAYS.length
  if (CACHE.v !== v) {
    CACHE = { v, wp: {}, bySid: {}, pidSids: {} }
    DB.attempts.forEach((a) => {
      ;(CACHE.bySid[a.sid] = CACHE.bySid[a.sid] || []).push(a)
      ;(CACHE.pidSids[a.pid] = CACHE.pidSids[a.pid] || new Set()).add(a.sid)
    })
  }
  return CACHE
}

function rosterFor(tid, pid) {
  const c = cache()
  return rosterOf(tid).filter(
    (s) => effPid(s) === pid || (c.pidSids[pid] && c.pidSids[pid].has(s.id)),
  )
}

function weeklyPoints(sid, pid) {
  const c = cache(),
    key = sid + '|' + pid
  if (c.wp[key]) return c.wp[key]
  const by = {}
  ;(c.bySid[sid] || [])
    .filter((a) => a.pid === pid && !a.retake)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        String(a.id).localeCompare(String(b.id)),
    )
    .forEach((a) => {
      const w = fridayOf(a.date)
      if (!by[w]) by[w] = a
    })
  return (c.wp[key] = Object.keys(by)
    .sort()
    .map((w) => ({ w, x: wIndex(w), y: by[w].correct, a: by[w] }))
    .filter((p) => p.x >= 0))
}
function tierOf(score, p) {
  if (score == null) return { k: 'none', label: 'No data', cls: 'p-none' }
  const g = goalOf(p)
  if (score >= g) return { k: 'ok', label: 'At goal', cls: 'p-ok' }
  if (score >= Math.ceil(p.items * (goalPct(p) - SETTINGS.watchBand)))
    return { k: 'warn', label: 'Approaching', cls: 'p-warn' }
  return { k: 'bad', label: 'Needs support', cls: 'p-bad' }
}
function summarize(sid, pid) {
  const p = PR[pid],
    pts = weeklyPoints(sid, pid),
    goal = goalOf(p)
  const base = pts.length ? median(pts.slice(0, 3).map((q) => q.y)) : null
  const x0 = pts.length ? pts[0].x : 0,
    xg = goalWeekIndex()
  const aim = (x) =>
    base == null
      ? null
      : base >= goal
        ? goal
        : base + (goal - base) * clamp((x - x0) / Math.max(1, xg - x0), 0, 1)
  const last = pts.length ? pts[pts.length - 1] : null,
    prev = pts.length > 1 ? pts[pts.length - 2] : null
  const slope = ols(pts.slice(-6).map((q) => ({ x: q.x, y: q.y })))
  const need = pts.length ? Math.max(0, goal - last.y) : null
  let decision
  const l4 = pts.slice(-4)
  if (pts.length < 3)
    decision = {
      k: 'none',
      label: 'Building baseline',
      cls: 'p-none',
      why: 'Needs 3 Fridays before a trend decision.',
    }
  else if (last.y >= goal)
    decision = {
      k: 'raise',
      label: 'At goal: raise the bar',
      cls: 'p-sky',
      why: 'Met the goal. Move to the next skill set or raise the goal.',
    }
  else if (l4.length === 4 && l4.every((q) => q.y < aim(q.x)))
    decision = {
      k: 'change',
      label: 'Change instruction',
      cls: 'p-bad',
      why: 'Last 4 Fridays all fell below the aimline. Current instruction is not closing the gap.',
    }
  else if (l4.length === 4 && l4.every((q) => q.y >= aim(q.x)))
    decision = {
      k: 'on',
      label: 'On track',
      cls: 'p-ok',
      why: 'Last 4 Fridays at or above the aimline. Keep the current plan.',
    }
  else
    decision = {
      k: 'keep',
      label: 'Keep going, watch',
      cls: 'p-warn',
      why: 'Mixed points around the aimline. Hold the plan and check again next Friday.',
    }
  return {
    p,
    pts,
    goal,
    base,
    aim,
    last,
    prev,
    slope,
    need,
    decision,
    tier: tierOf(last?.y, p),
    cpm: last ? last.a.correct / Math.max(0.5, last.a.secs / 60) : null,
    acc: last
      ? last.a.correct / Math.max(1, last.a.correct + last.a.incorrect)
      : null,
  }
}
function progressFrac(sum, uptoWeek) {
  const pts = sum.pts.filter((q) => q.w <= uptoWeek)
  if (!pts.length || sum.base == null) return null
  const v = mean(pts.slice(-2).map((q) => q.y))
  if (sum.base >= sum.goal) return 1
  return clamp((v - sum.base) / (sum.goal - sum.base), 0, 1)
}
function classWeek(tid, pid, w) {
  const ros = rosterFor(tid, pid),
    p = PR[pid],
    g = goalOf(p)
  const scores = [],
    changes = []
  ros.forEach((s) => {
    const pts = weeklyPoints(s.id, pid)
    const i = pts.findIndex((q) => q.w === w)
    if (i >= 0) {
      scores.push(pts[i].y)
      if (i > 0) changes.push(pts[i].y - pts[i - 1].y)
    }
  })
  return {
    n: ros.length,
    tested: scores.length,
    median: median(scores),
    atGoal: scores.length
      ? scores.filter((v) => v >= g).length / scores.length
      : null,
    improved: changes.filter((c) => c > 0).length,
    dropped: changes.filter((c) => c < 0).length,
    meanChange: mean(changes),
  }
}
function classSummary(tid, pid) {
  const sums = rosterFor(tid, pid).map((s) => ({ s, ...summarize(s.id, pid) }))
  const slopes = sums.map((x) => x.slope).filter((v) => v != null)
  return {
    sums,
    slope: median(slopes),
    change: sums.filter((x) => x.decision.k === 'change').length,
  }
}
function benchMedian(grade, pid, w) {
  if (DB.bench && DB.bench[grade + '|' + pid])
    return DB.bench[grade + '|' + pid][w] ?? null
  const vals = []
  DB.students
    .filter((s) => s.grade === grade)
    .forEach((s) => {
      const q = weeklyPoints(s.id, pid).find((q) => q.w === w)
      if (q && !q.a.accom) vals.push(q.y)
    })
  return vals.length >= 5 ? median(vals) : null
}
function months() {
  return [...new Set(FRIDAYS.map(monthKey))]
}
const monthEnd = (m) => FRIDAYS.filter((w) => monthKey(w) === m).pop()
function classMonth(tid, m) {
  const t = teacherOf(tid),
    cs = classSummary(tid, t.probeId),
    end = monthEnd(m)
  const prevM = months()[months().indexOf(m) - 1],
    pend = prevM ? monthEnd(prevM) : null
  const fr = cs.sums.map((x) => progressFrac(x, end)).filter((v) => v != null)
  const fp = pend
    ? cs.sums.map((x) => progressFrac(x, pend)).filter((v) => v != null)
    : []
  const g = goalOf(PR[t.probeId])
  const atGoal = cs.sums
    .map((x) => x.pts.filter((q) => q.w <= end).pop())
    .filter(Boolean)
  const monthWeeks = FRIDAYS.filter((w) => monthKey(w) === m)
  const tests = DB.attempts.filter(
    (a) =>
      !a.retake &&
      monthWeeks.includes(fridayOf(a.date)) &&
      studentOf(a.sid)?.teacherId === tid,
  ).length
  return {
    t,
    distance: mean(fr),
    prevDistance: fp.length ? mean(fp) : 0,
    gain: fr.length ? mean(fr) - (fp.length ? mean(fp) : 0) : null,
    atGoal: atGoal.length
      ? atGoal.filter((q) => q.y >= g).length / atGoal.length
      : null,
    participation: Math.min(
      1,
      tests / Math.max(1, rosterOf(tid).length * monthWeeks.length),
    ),
    slope: cs.slope,
    change: cs.change,
  }
}
function studentRibbons(sid, pid) {
  const pts = weeklyPoints(sid, pid),
    g = goalOf(PR[pid])
  const out = []
  if (!pts.length) return out
  const last = pts[pts.length - 1],
    before = pts.slice(0, -1)
  out.push({ r: '🎗️', t: 'Raced this Friday' })
  if (before.length && last.y > Math.max(...before.map((q) => q.y)))
    out.push({ r: '🏆', t: 'Personal best' })
  else if (before.length && last.y > before[before.length - 1].y)
    out.push({ r: '⬆️', t: 'Beat last Friday' })
  if (last.y >= g) out.push({ r: '🥇', t: 'Crossed the goal line' })
  let streak = 1
  for (let i = pts.length - 1; i > 0 && pts[i].x - pts[i - 1].x === 1; i--)
    streak++
  if (streak >= 3) out.push({ r: '🔥', t: streak + ' Fridays in a row' })
  return out
}
function csvOf(rows) {
  return rows
    .map((r) =>
      r
        .map((v) => {
          v = String(v ?? '')
          return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v
        })
        .join(','),
    )
    .join('\n')
}

const FLEX = [
  {
    l: 1,
    name: 'Counts or models all',
    short: 'Counts all',
    d: 'Counts every object, draws, or uses fingers for each one.',
  },
  {
    l: 2,
    name: 'Counts on or skip counts',
    short: 'Counts on',
    d: 'Starts from a known number and counts on, back, or by groups.',
  },
  {
    l: 3,
    name: 'Uses a strategy',
    short: 'Strategy',
    d: 'Derives it from a fact they know: make 10, doubles, break apart.',
  },
  {
    l: 4,
    name: 'Knows it and explains',
    short: 'Knows it',
    d: 'Recalls it quickly and can explain or prove it another way.',
  },
]
const FLEXES = [
  { l: 1, name: 'Cuenta todo' },
  { l: 2, name: 'Cuenta a partir de un número' },
  { l: 3, name: 'Usa una estrategia' },
  { l: 4, name: 'Lo sabe y lo explica' },
]
const weekOf = (d) => fridayOf(d)
function practiceFor(sid, fromIso) {
  return DB.practice.filter(
    (p) => p.sid === sid && (!fromIso || p.date >= fromIso),
  )
}
function flexFor(sid) {
  return DB.flex
    .filter((f) => f.sid === sid)
    .sort((a, b) => a.date.localeCompare(b.date))
}
function flexMonth(sid, m) {
  return (
    flexFor(sid)
      .filter((f) => monthKey(f.date) === m)
      .pop() || null
  )
}
const accomLabel = (a) =>
  !a || (!a.x && !a.read)
    ? ''
    : [a.x && a.x !== 1 ? '×' + a.x + ' time' : '', a.read ? 'read aloud' : '']
        .filter(Boolean)
        .join(', ')
function raceSecs(s, p) {
  return Math.round(p.secs * ((s.accom && s.accom.x) || 1))
}
function weakSkills(sid, pid, n = 4) {
  const sk = {}
  weeklyPoints(sid, pid)
    .slice(-3)
    .forEach((q) =>
      Object.entries(q.a.skills || {}).forEach(([k, [c, t]]) => {
        sk[k] = sk[k] || [0, 0]
        sk[k][0] += c
        sk[k][1] += t
      }),
    )
  return Object.entries(sk)
    .filter(([k, [c, t]]) => t >= 2 && c / t < 0.85)
    .sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1])
    .slice(0, n)
    .map((x) => x[0])
}

const TIERS = [
  { n: 'Foal', at: 0 },
  { n: 'Colt', at: 12 },
  { n: 'Racer', at: 30 },
  { n: 'Champion', at: 60 },
  { n: 'Legend', at: 100 },
]
const tierOf_ = (earned) => {
  let t = 0
  TIERS.forEach((x, i) => {
    if (earned >= x.at) t = i
  })
  return t
}

const GEAR = [
  {
    id: 'blanket:solid',
    slot: 'blanket',
    v: 'solid',
    name: 'Solid',
    cost: 0,
    tier: 0,
  },
  {
    id: 'blanket:stripes',
    slot: 'blanket',
    v: 'stripes',
    name: 'Racing stripes',
    cost: 4,
    tier: 0,
  },
  {
    id: 'blanket:stars',
    slot: 'blanket',
    v: 'stars',
    name: 'Stars',
    cost: 6,
    tier: 1,
  },
  {
    id: 'blanket:check',
    slot: 'blanket',
    v: 'check',
    name: 'Checkered flag',
    cost: 8,
    tier: 1,
  },
  {
    id: 'blanket:tiger',
    slot: 'blanket',
    v: 'tiger',
    name: 'TGES tiger stripes',
    cost: 10,
    tier: 2,
  },
  {
    id: 'blanket:gold',
    slot: 'blanket',
    v: 'gold',
    name: 'Gold trim',
    cost: 16,
    tier: 3,
  },
  {
    id: 'helmet:plain',
    slot: 'helmet',
    v: 'plain',
    name: 'Plain',
    cost: 0,
    tier: 0,
  },
  {
    id: 'helmet:stripe',
    slot: 'helmet',
    v: 'stripe',
    name: 'Center stripe',
    cost: 4,
    tier: 0,
  },
  {
    id: 'helmet:stars',
    slot: 'helmet',
    v: 'stars',
    name: 'Star helmet',
    cost: 6,
    tier: 1,
  },
  {
    id: 'helmet:gold',
    slot: 'helmet',
    v: 'gold',
    name: 'Gold helmet',
    cost: 14,
    tier: 3,
  },
  {
    id: 'mane:plain',
    slot: 'mane',
    v: 'plain',
    name: 'Flowing',
    cost: 0,
    tier: 0,
    only: ['horse', 'zebra'],
  },
  {
    id: 'mane:braids',
    slot: 'mane',
    v: 'braids',
    name: 'Braids',
    cost: 6,
    tier: 1,
    only: ['horse', 'zebra'],
  },
  {
    id: 'mane:beads',
    slot: 'mane',
    v: 'beads',
    name: 'Braids with beads',
    cost: 10,
    tier: 2,
    only: ['horse', 'zebra'],
  },
  {
    id: 'tail:none',
    slot: 'tail',
    v: 'none',
    name: 'No ribbon',
    cost: 0,
    tier: 0,
    only: ['horse', 'zebra'],
  },
  {
    id: 'tail:ribbon',
    slot: 'tail',
    v: 'ribbon',
    name: 'Tail ribbon',
    cost: 3,
    tier: 0,
    only: ['horse', 'zebra'],
  },
  {
    id: 'tail:bow',
    slot: 'tail',
    v: 'bow',
    name: 'Big bow',
    cost: 6,
    tier: 1,
    only: ['horse', 'zebra'],
  },
  {
    id: 'wraps:none',
    slot: 'wraps',
    v: 'none',
    name: 'No wraps',
    cost: 0,
    tier: 0,
    only: ['horse', 'zebra'],
  },
  {
    id: 'wraps:white',
    slot: 'wraps',
    v: 'white',
    name: 'White leg wraps',
    cost: 3,
    tier: 0,
    only: ['horse', 'zebra'],
  },
  {
    id: 'wraps:silk',
    slot: 'wraps',
    v: 'silk',
    name: 'Matching wraps',
    cost: 5,
    tier: 1,
    only: ['horse', 'zebra'],
  },
  {
    id: 'trail:dust',
    slot: 'trail',
    v: 'dust',
    name: 'Dust cloud',
    cost: 0,
    tier: 0,
  },
  {
    id: 'trail:sparkle',
    slot: 'trail',
    v: 'sparkle',
    name: 'Sparkles',
    cost: 8,
    tier: 1,
  },
  {
    id: 'trail:rainbow',
    slot: 'trail',
    v: 'rainbow',
    name: 'Rainbow',
    cost: 12,
    tier: 2,
  },
  {
    id: 'trail:flame',
    slot: 'trail',
    v: 'flame',
    name: 'Flames',
    cost: 15,
    tier: 3,
  },
  {
    id: 'trail:gold',
    slot: 'trail',
    v: 'gold',
    name: 'Gold dust',
    cost: 20,
    tier: 4,
  },
  {
    id: 'victory:hop',
    slot: 'victory',
    v: 'hop',
    name: 'Happy hop',
    cost: 0,
    tier: 0,
  },
  {
    id: 'victory:spin',
    slot: 'victory',
    v: 'spin',
    name: 'Spin',
    cost: 6,
    tier: 1,
  },
  {
    id: 'victory:rear',
    slot: 'victory',
    v: 'rear',
    name: 'Rear up',
    cost: 10,
    tier: 2,
  },
]
const SLOTS = [
  ['ride', 'Racer'],
  ['colors', 'Colors'],
  ['blanket', 'Saddle blanket'],
  ['helmet', 'Helmet'],
  ['mane', 'Mane'],
  ['tail', 'Tail'],
  ['wraps', 'Leg wraps'],
  ['trail', 'Trail'],
  ['victory', 'Victory move'],
]
const NAME_A = [
  'Midnight',
  'Thunder',
  'Golden',
  'Lightning',
  'Cosmic',
  'Lucky',
  'Rocket',
  'Silver',
  'Turbo',
  'Marsh',
  'Coastal',
  'Sunny',
  'Starry',
  'Brave',
  'Speedy',
  'Tiger',
]
const NAME_B = [
  'Comet',
  'Biscuit',
  'Blaze',
  'Dash',
  'Star',
  'Storm',
  'Flash',
  'Spirit',
  'Sprinkles',
  'Pepper',
  'Wave',
  'Spark',
  'Pecan',
  'Breeze',
  'Rocket',
  'Shadow',
]
const K_NAMES = [
  ['⚡', 'Thunder'],
  ['🍪', 'Biscuit'],
  ['🚀', 'Rocket'],
  ['🌟', 'Star'],
  ['🍒', 'Cherry'],
  ['🌙', 'Moonbeam'],
  ['🌈', 'Rainbow'],
  ['🐝', 'Buzz'],
  ['🍦', 'Sprinkles'],
  ['🔥', 'Blaze'],
  ['🌊', 'Wave'],
  ['🍀', 'Lucky'],
]

function defaultStable(sid) {
  const h = hash(sid)
  return {
    name: '',
    custom: '',
    nameStatus: '',
    ride: 'horse',
    silk: SILKS[h % SILKS.length],
    coat: COATS[(h >>> 3) % COATS.length],
    owned: [],
    equip: {},
  }
}
function stableOf(sid) {
  DB.stables = DB.stables || {}
  return DB.stables[sid] || (DB.stables[sid] = defaultStable(sid))
}
const displayName = (st) =>
  st.nameStatus === 'ok' && st.custom ? st.custom : st.name

function earnings(sid) {
  const ev = [],
    add = (d, n, why, big) => ev.push({ d, n, why, big })
  ;[
    ...new Set(DB.attempts.filter((a) => a.sid === sid).map((a) => a.pid)),
  ].forEach((pid) => {
    const sm = summarize(sid, pid),
      pts = sm.pts
    let best = -1,
      goalHit = false,
      onRun = 0
    pts.forEach((q, i) => {
      const d = q.a.date
      add(d, 1, 'Raced on Friday')
      if (i > 0 && q.y > pts[i - 1].y) add(d, 2, 'Beat last Friday')
      if (i > 0 && q.y > best) add(d, 3, 'Personal best')
      if (i >= 3 && q.y >= sm.aim(q.x)) {
        add(d, 2, 'On your growth line')
        onRun++
      } else onRun = 0
      if (onRun === 4) add(d, 0, '4 Fridays on track: gold nameplate', 'plate')
      if (i >= 2 && pts[i - 1].y < pts[i - 2].y && q.y > pts[i - 2].y)
        add(d, 2, 'Comeback after a drop', 'grit')
      if (!goalHit && q.y >= sm.goal) {
        goalHit = true
        add(d, 5, 'Reached goal: ' + PR[pid].label, 'goal:' + pid)
      }
      best = Math.max(best, q.y)
    })
  })
  const byWeek = {}
  DB.practice
    .filter((p) => p.sid === sid && p.items >= 5)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((p) => {
      const w = fridayOf(p.date)
      byWeek[w] = (byWeek[w] || 0) + 1
      if (byWeek[w] <= 3) add(p.date, 1, 'Practice session')
    })
  DB.flex
    .filter((f) => f.sid === sid && f.level >= 3)
    .forEach((f) => add(f.date, 3, 'Explained your thinking'))
  return ev.sort((a, b) => a.d.localeCompare(b.d))
}
function wallet(sid) {
  const st = stableOf(sid),
    ev = earnings(sid),
    earned = ev.reduce((a, e) => a + e.n, 0)
  const spent =
    st.owned.reduce(
      (a, id) => a + ((GEAR.find((g) => g.id === id) || {}).cost || 0),
      0,
    ) +
    (st.renames || 0) * 3
  const practice = DB.practice.filter(
    (p) => p.sid === sid && p.items >= 5,
  ).length
  return {
    ev,
    earned,
    spent,
    balance: earned - spent,
    tier: tierOf_(earned),
    practice,
    marks: {
      ribbons: Math.floor(practice / 5),
      grit: ev.some((e) => e.big === 'grit'),
      plate: ev.some((e) => e.big === 'plate'),
    },
  }
}

function milestones(sid) {
  const w = wallet(sid),
    out = []
  w.ev
    .filter((e) => String(e.big || '').startsWith('goal:'))
    .forEach((e) =>
      out.push({ key: e.big, label: e.why, d: e.d, kind: 'goal' }),
    )
  TIERS.forEach((t, i) => {
    if (i >= 2) {
      let run = 0
      const hit = w.ev.find((e) => (run += e.n) >= t.at)
      if (hit)
        out.push({
          key: 'tier:' + t.n,
          label: 'Reached ' + t.n + ' tier',
          d: hit.d,
          kind: 'tier' + i,
        })
    }
  })
  const pr = DB.practice
    .filter((p) => p.sid === sid && p.items >= 5)
    .sort((a, b) => a.date.localeCompare(b.date))
  if (pr.length >= 10)
    out.push({
      key: 'practice10',
      label: '10 practice sessions',
      d: pr[9].date,
      kind: 'practice10',
    })
  return out
}
const PHYS_DEFAULT = {
  goal: true,
  tier3: true,
  tier4: true,
  tier2: false,
  practice10: true,
}
const physOn = (m) => (SETTINGS.physical || PHYS_DEFAULT)[m.kind] ?? false

const gearFor = (st) =>
  ({bikeStyle:st.bikeStyle, ...Object.fromEntries(
    ['blanket', 'helmet', 'mane', 'tail', 'wraps'].map((s) => [
      s,
      (GEAR.find((g) => g.id === st.equip[s]) || {}).v,
    ]),
  )})
const owns = (st, g) => g.cost === 0 || st.owned.includes(g.id)
function racerOf(sid, o = {}) {
  const st = stableOf(sid),
    w = wallet(sid)
  return mascot(st.ride || 'horse', {
    silk: st.silk,
    coat: st.coat,
    gear: gearFor(st),
    marks: w.marks,
    ...o,
  })
}
const trailOf = (sid) =>
  (GEAR.find((g) => g.id === stableOf(sid).equip.trail) || { v: 'dust' }).v
const victoryOf = (sid) =>
  (GEAR.find((g) => g.id === stableOf(sid).equip.victory) || { v: 'hop' }).v

function saveStable() {
  API.saveStable(K.sid, stableOf(K.sid))
}

async function stableAct(a, el) {
  const st = stableOf(K.sid)
  switch (a) {
    case 'k-kname':
    case 'k-name-ok': {
      const n = a === 'k-kname' ? el.dataset.n : K.nd.a + ' ' + K.nd.b
      if (st.name) {
        const w = wallet(K.sid)
        if (w.balance < 3) {
          toast('Renaming costs 3 horseshoes.')
          return
        }
        st.renames = (st.renames || 0) + 1
      }
      st.name = n
      if (st.nameStatus === 'denied') {
        st.nameStatus = ''
        st.custom = ''
      }
      if (a === 'k-kname') say(n)
      saveStable()
      K.stage = 'stable'
      renderStudent()
      break
    }
    case 'k-na':
      K.nd.a = el.dataset.w
      renderNaming()
      break
    case 'k-nb':
      K.nd.b = el.dataset.w
      renderNaming()
      break
    case 'k-name-custom': {
      const v = ($('#customname').value || '')
        .trim()
        .replace(/[^A-Za-z' -]/g, '')
        .slice(0, 20)
      if (v.length < 2) {
        toast('Type a name with letters.')
        return
      }
      if (!st.name) st.name = K.nd.a + ' ' + K.nd.b
      st.custom = v
      st.nameStatus = 'pending'
      saveStable()
      toast('Sent to your teacher')
      K.stage = 'stable'
      renderStudent()
      break
    }
    case 'k-rename':
      K.stage = 'name'
      renderStudent()
      break
    case 'k-stable':
      K.stage = 'stable'
      renderStudent()
      break
    case 'k-stab':
      K.stab = el.dataset.t
      renderStable()
      break
    case 'k-slot':
      K.slot = el.dataset.s
      renderStable()
      break
    case 'k-ride':
      st.ride = el.dataset.r
      st.rideChosen = true
      saveStable()
      renderStable()
      break
    case 'k-silk':
      st.silk = el.dataset.c
      saveStable()
      renderStable()
      break
    case 'k-coat':
      st.coat = el.dataset.c
      saveStable()
      renderStable()
      break
    case 'k-gear': {
      const g = GEAR.find((x) => x.id === el.dataset.g),
        w = wallet(K.sid)
      if (!g || w.tier < g.tier) return
      if (!owns(st, g)) {
        if (w.balance < g.cost) {
          toast(`You need ${g.cost - w.balance} more horseshoes.`)
          return
        }
        st.owned.push(g.id)
        toast('Bought: ' + g.name)
      }
      st.equip[g.slot] = g.id
      saveStable()
      renderStable()
      break
    }
  }
}

function frameSvg(n) {
  const frames = n > 10 ? 2 : 1,
    cell = 46,
    pad = 6,
    w = 5 * cell,
    h = 2 * cell,
    gap = 26
  let s = `<svg viewBox="0 0 ${w * frames + gap * (frames - 1) + pad * 2} ${h + pad * 2}" width="${Math.min(440, (w * frames + gap * (frames - 1) + pad * 2) * 1.05)}" role="img" aria-label="ten frame">`
  for (let f = 0; f < frames; f++) {
    const ox = pad + f * (w + gap),
      cnt = f === 0 ? Math.min(n, 10) : n - 10
    s += `<rect x="${ox}" y="${pad}" width="${w}" height="${h}" fill="#EEF7FD" stroke="#9DD6F0" stroke-width="5"/>`
    for (let c = 1; c < 5; c++)
      s += `<line x1="${ox + c * cell}" y1="${pad}" x2="${ox + c * cell}" y2="${pad + h}" stroke="#9DD6F0" stroke-width="4"/>`
    s += `<line x1="${ox}" y1="${pad + cell}" x2="${ox + w}" y2="${pad + cell}" stroke="#9DD6F0" stroke-width="4"/>`
    for (let k = 0; k < cnt; k++) {
      const cx = ox + (k % 5) * cell + cell / 2,
        cy = pad + Math.floor(k / 5) * cell + cell / 2
      s += `<circle cx="${cx}" cy="${cy}" r="${cell * 0.36}" fill="${f === 0 ? '#A79BEA' : '#F08C3A'}"/>`
    }
  }
  return s + '</svg>'
}
function scatterSvg(n, seed) {
  const r = rng(seed),
    W = 320,
    H = 210,
    pts = []
  for (let k = 0; k < n; k++) {
    let x,
      y,
      t = 0
    do {
      x = ri(r, 26, W - 26)
      y = ri(r, 26, H - 26)
      t++
    } while (
      t < 400 &&
      pts.some((p) => (p.x - x) ** 2 + (p.y - y) ** 2 < 48 * 48)
    )
    pts.push({ x, y })
  }
  return `<svg viewBox="0 0 ${W} ${H}" width="300" role="img" aria-label="dots"><rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="18" fill="#F3F9EE" stroke="#9BD07A" stroke-width="3" stroke-dasharray="8 6"/>${pts.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="17" fill="#F2B705" stroke="#1C1F1D" stroke-width="2.5"/>`).join('')}</svg>`
}
function starSvg(c) {
  return `<svg viewBox="0 0 100 96" width="70"><polygon points="50,4 62,36 96,37 69,58 79,92 50,72 21,92 31,58 4,37 38,36" fill="${c}"/></svg>`
}
function rocketSvg() {
  return `<svg viewBox="0 0 60 120" width="42"><path d="M30 4 C44 22 46 50 44 86 L16 86 C14 50 16 22 30 4Z" fill="#1F6FB2"/><path d="M30 4 C36 12 39 20 40 28 L20 28 C21 20 24 12 30 4Z" fill="#C8102E"/><circle cx="30" cy="48" r="7" fill="#9DE0F5" stroke="#F2B705" stroke-width="3"/><path d="M16 66 L2 100 L16 92Z M44 66 L58 100 L44 92Z" fill="#C8102E"/><rect x="27" y="56" width="6" height="58" fill="#C8102E"/></svg>`
}
function objsHtml(v) {
  if (v.o === 'cube') {
    let s = ''
    const w = 60
    for (let i = 0; i < v.n; i++)
      s += `<rect x="${i * w}" y="0" width="${w - 2}" height="58" rx="6" fill="#29A8E0" stroke="#1278B0" stroke-width="2"/><circle cx="${i * w + 29}" cy="29" r="15" fill="#5CC4EE" stroke="#1278B0" stroke-width="1.5"/>`
    return `<svg viewBox="0 0 ${v.n * 60 + 10} 60" width="${Math.min(480, (v.n * 60 + 10) * 0.75)}" role="img" aria-label="linked cubes">${s}<rect x="${v.n * 60 - 2}" y="14" width="10" height="30" rx="2" fill="#1278B0"/></svg>`
  }
  // one color for every count: a color chosen from the count would hint at the answer
  const dot = `<svg viewBox="0 0 100 100" width="58"><circle cx="50" cy="50" r="40" fill="#E0A21B"/></svg>`
  return `<div style="display:flex;flex-wrap:wrap;gap:14px;max-width:560px;justify-content:center">${Array.from({ length: v.n }, () => (v.o === 'rocket' ? rocketSvg() : v.o === 'dot' ? dot : starSvg('#F2B705'))).join('')}</div>`
}
function renderVis(v) {
  switch (v.t) {
    case 'objs':
      return objsHtml(v)
    case 'frame5': {
      const cell = 64
      let s = `<svg viewBox="0 0 ${5 * cell + 8} ${cell + 8}" width="${5 * cell * 0.9}" role="img" aria-label="five frame"><rect x="4" y="4" width="${5 * cell}" height="${cell}" fill="#EEF7FD" stroke="#9DD6F0" stroke-width="5"/>`
      for (let c = 1; c < 5; c++)
        s += `<line x1="${4 + c * cell}" y1="4" x2="${4 + c * cell}" y2="${4 + cell}" stroke="#9DD6F0" stroke-width="5"/>`
      for (let k = 0; k < v.n; k++)
        s += `<circle cx="${4 + k * cell + cell / 2}" cy="${4 + cell / 2}" r="${cell * 0.34}" fill="#A79BEA"/>`
      return s + '</svg>'
    }
    case 'place':
      return `<div class="scene" data-scene="${v.scene}"><div class="scene-art">${v.scene === 'pond' ? '<span class="pond"></span>' : '<span class="barn">🏚️</span>'}<span class="tree">🌳</span><span class="hay">🌾</span></div><div class="placed" id="placed"></div></div><div class="tray" id="tray">${Array.from({ length: v.tray }, (_, i) => `<button class="critter" data-act="k-place" data-i="${i}" aria-label="Add one">${v.icon}</button>`).join('')}</div>`
    case 'frame':
      return frameSvg(v.n)
    case 'scatter':
      return scatterSvg(v.n, v.s)
    case 'pics': {
      const g = (n, cls = '') =>
        Array.from(
          { length: n },
          () => `<span class="${cls}">${v.icon}</span>`,
        ).join('')
      if (v.op === '+')
        return `<div class="pics"><div class="grp">${g(v.a) || '&nbsp;'}</div><span class="op">+</span><div class="grp">${g(v.b) || '&nbsp;'}</div><span class="op">=</span><span class="op">?</span></div><div class="note" style="text-align:center;margin-top:4px;font-size:18px">${v.a} + ${v.b}</div>`
      return `<div class="pics"><div class="grp">${g(v.a - v.b)}${g(v.b, 'gone')}</div><span class="op">=</span><span class="op">?</span></div><div class="note" style="text-align:center;margin-top:4px;font-size:18px">${v.a} − ${v.b}</div>`
    }
    case 'seq':
      return `<div class="seq">${v.nums.map((n) => (n == null ? '<span class="q">?</span>' : `<span>${n}</span>`)).join('')}</div>`
    case 'vert':
      return `<div class="vert"><div>${v.a.toLocaleString()}</div><div>${v.op} ${v.b.toLocaleString()}</div><div class="ln"></div></div>`
    case 'onemore':
      return `<div class="onemore"><span class="nbox">${v.n}</span><span class="omtag ${v.dir}">${v.dir === 'more' ? '+1 one more' : '−1 one less'}</span><span class="nbox q">?</span></div>`
    case 'listen':
      return `<button class="listen" data-act="k-say-item" aria-label="Hear the number again">🔊</button>`
    case 'groups': {
      const g = (n, c) =>
        `<div class="grp2" style="border-color:${c}">${Array.from({ length: n }, () => `<span>${v.icon}</span>`).join('')}</div>`
      return `<div class="pics">${g(v.a, '#C8102E')}${g(v.b, '#1F6FB2')}</div><div style="font:600 24px var(--kid);margin-top:8px">Which has ${v.q === 'more' ? 'MORE' : 'FEWER'}?</div>`
    }
    case 'cmp':
      return `<div class="eq cmp">${esc(v.a)} <span class="cmpq">?</span> ${esc(v.b)}</div>`
    case 'loose': {
      const r = rng(v.s),
        cells = shuffle(r, range(0, 19)).slice(0, v.n)
      return `<div class="loose">${range(0, 19)
        .map((i) => `<span>${cells.includes(i) ? v.icon : ''}</span>`)
        .join('')}</div>`
    }
    case 'array': {
      const cs = 46,
        w = v.cols * cs,
        h = v.rows * cs
      let s = `<svg viewBox="0 0 ${w} ${h}" width="${Math.min(300, w)}" role="img" aria-label="array">`
      for (let y = 0; y < v.rows; y++)
        for (let x = 0; x < v.cols; x++)
          s += `<circle cx="${x * cs + cs / 2}" cy="${y * cs + cs / 2}" r="${cs * 0.36}" fill="#1F6FB2"/>`
      return s + '</svg>'
    }
    case 'round':
      return `<div class="eq">${esc(v.n)}</div><span class="partpill" style="font-size:20px;margin-top:10px">round to the nearest ${esc(v.p)}</span>`
    case 'bignum':
      return `<div class="eq" style="font-size:clamp(50px,7vw,80px)">${v.n}</div>`
    default:
      return `<div class="eq">${esc(v.text)}</div>`
  }
}

/* ---- skin/art_mascots.js ---- */
/* SKIN FILE. Owned by the skin (Codex). Change freely, but keep every contract in AGENTS.md. */
/* Textured racing-game artwork: shared body and jockey atlases with independent
   SVG equipment, coat/silk colors, anatomy masks, and a four-phase gallop rig.
   Refresh asset data URIs with python3 skin/assets/embed.py before building. */
const COATS = [
  '#8B4A2B',
  '#B5651D',
  '#3A2A22',
  '#9AA3A8',
  '#E0B45C',
  '#6E3B1E',
  '#C9A36B',
  '#F1EEE6',
]
const COAT_NAMES = {
  '#8B4A2B': 'Bay',
  '#B5651D': 'Chestnut',
  '#3A2A22': 'Black',
  '#9AA3A8': 'Gray',
  '#E0B45C': 'Palomino',
  '#6E3B1E': 'Liver',
  '#C9A36B': 'Dun',
  '#F1EEE6': 'White',
}
const SILKS = [
  '#C8102E',
  '#F2B705',
  '#1F6FB2',
  '#2E9E5B',
  '#6B3FA0',
  '#F08C3A',
  '#E04F9A',
  '#12A4A4',
]
const SILK_NAMES = {
  '#C8102E': 'Red',
  '#F2B705': 'Gold',
  '#1F6FB2': 'Blue',
  '#2E9E5B': 'Green',
  '#6B3FA0': 'Purple',
  '#F08C3A': 'Orange',
  '#E04F9A': 'Pink',
  '#12A4A4': 'Teal',
}
let MASCOT_ID = 0
const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16)
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + amt * 255)))
  return (
    '#' +
    [f(n >> 16), f((n >> 8) & 255), f(n & 255)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  )
}

/* saddle blanket / bib / fairing decal patterns */
function patternDef(id, kind, base) {
  const p = (w, h, inner) =>
    `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${base}"/>${inner}</pattern>`
  switch (kind) {
    case 'stripes':
      return p(6, 6, `<path d="M-1 7 L7 -1" stroke="#fff" stroke-width="1.6"/>`)
    case 'stars':
      return p(
        8,
        8,
        `<path d="M4 1 L4.9 3.2 L7.2 3.3 L5.4 4.8 L6 7 L4 5.8 L2 7 L2.6 4.8 L0.8 3.3 L3.1 3.2Z" fill="#fff"/>`,
      )
    case 'check':
      return p(
        6,
        6,
        `<rect width="3" height="3" fill="#fff"/><rect x="3" y="3" width="3" height="3" fill="#fff"/>`,
      )
    case 'tiger':
      return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="8" height="18"><rect width="8" height="18" fill="#F2B705"/><path d="M1 0 C3 5 0 9 2 18 M5 0 C7 6 4 11 6 18" stroke="#1C1F1D" stroke-width="1.7" fill="none"/></pattern>`
    case 'gold':
      return p(
        6,
        6,
        `<circle cx="3" cy="3" r=".7" fill="#FFE8A0" opacity=".8"/>`,
      )
    default:
      return ''
  }
}
const blanketFill = (id, kind, silk) =>
  kind && kind !== 'solid' ? `url(#${id})` : silk

/* Textured racer atlas is shared by every SVG; it has no equipment baked in. */
const RACER_ATLAS_URI = 'racer-atlas.webp'

const JOCKEY_ATLAS_URI = 'jockey-atlas.webp'
function ensureRacerAtlas() {}
/* Pixel-coordinate anatomy masks keep the fur and musculature on moving limbs. */
const RACER_CROPS = {
  horse: {
    x: 0,
    y: 0,
    w: 835,
    h: 510,
    tail: 'M0 145 H220 L265 215 L217 307 H0Z',
    legs: [
      ['rear-far', 245, 321, 'M218 307 L296 329 L372 466 L308 482 L240 401Z'],
      [
        'rear-near',
        230,
        327,
        'M191 301 L257 322 L202 396 L72 481 L22 479 L109 377Z',
      ],
      [
        'front-far',
        633,
        289,
        'M611 270 L668 273 L814 366 L832 446 L777 461 L714 355 L612 321Z',
      ],
      [
        'front-near',
        575,
        324,
        'M541 297 L603 301 L656 383 L808 469 L813 510 L753 505 L608 426 L551 364Z',
      ],
    ],
  },
  zebra: {
    x: 830,
    y: 0,
    w: 706,
    h: 510,
    tail: 'M0 157 H176 L205 228 L173 293 H0Z',
    legs: [
      [
        'rear-far',
        226,
        318,
        'M192 289 L263 301 L299 399 L266 448 L213 449 L208 374Z',
      ],
      [
        'rear-near',
        182,
        324,
        'M160 296 L209 315 L164 402 L66 477 L12 482 L47 421 L133 348Z',
      ],
      [
        'front-far',
        513,
        312,
        'M499 285 L548 303 L650 383 L689 460 L695 490 L644 479 L604 404 L508 349Z',
      ],
      [
        'front-near',
        471,
        321,
        'M443 303 L499 309 L542 371 L572 411 L548 433 L495 402 L452 354Z',
      ],
    ],
  },
  tiger: {
    x: 0,
    y: 530,
    w: 835,
    h: 450,
    tail: 'M0 34 H135 L178 113 L145 187 H0Z',
    legs: [
      [
        'rear-far',
        250,
        261,
        'M217 236 L294 251 L249 336 L234 406 L194 410 L169 386 L193 295Z',
      ],
      [
        'rear-near',
        231,
        268,
        'M191 239 L258 253 L193 342 L72 387 L23 388 L17 365 L64 318 L167 272Z',
      ],
      [
        'front-far',
        649,
        257,
        'M616 232 L685 244 L765 311 L822 331 L835 365 L795 393 L749 364 L638 302Z',
      ],
      [
        'front-near',
        608,
        270,
        'M561 245 L632 253 L699 319 L781 350 L831 389 L835 420 L790 426 L745 397 L658 365 L581 304Z',
      ],
    ],
  },
  moto: { x: 830, y: 520, w: 706, h: 470 },
}
function texturedBody(kind, coat, gear, silk, id) {
  const c = RACER_CROPS[kind],
    legs = c.legs || [],
    color = kind === 'horse' && COATS.includes(coat) ? coat : '#B5651D'
  const piece = (p) =>
    '<image href="horse-pieces/' +
    kind +
    '-' +
    color.slice(1) +
    '-' +
    p +
    '.png" x="0" y="12" width="180" height="98"/>'
  const legHtml = legs
    .map(
      ([cls, x, y, d], i) =>
        '<g class="textured-leg ' +
        cls +
        '" style="transform-origin:' +
        (x / c.w) * 180 +
        'px ' +
        (12 + (y / c.h) * 98) +
        'px">' +
        piece(cls) +
        (gear.wraps && gear.wraps !== 'none'
          ? '<svg x="0" y="12" width="180" height="98" viewBox="0 0 ' +
            c.w +
            ' ' +
            c.h +
            '"><defs><clipPath id="' +
            id +
            'wrap' +
            i +
            '"><path d="' +
            d +
            '"/></clipPath></defs><path d="M0 ' +
            c.h * 0.79 +
            ' H' +
            c.w +
            '" stroke="' +
            (gear.wraps === 'white' ? '#eee8d9' : silk) +
            '" stroke-width="21" clip-path="url(#' +
            id +
            'wrap' +
            i +
            ')"/></svg>'
          : '') +
        '</g>',
    )
    .join('')
  const tail = c.tail
    ? '<g class="textured-tail" style="transform-origin:48.6px 57.08px">' +
      piece('textured-tail') +
      '</g>'
    : ''
  const wraps =
    (kind === 'horse' || kind === 'zebra') &&
    gear.wraps &&
    gear.wraps !== 'none'
      ? '<path d="M25 89 H158" stroke="' +
        (gear.wraps === 'white' ? '#eee8d9' : silk) +
        '" stroke-width="3" opacity=".6"/>'
      : ''
  return tail + piece('body-torso') + legHtml
}
function racerHelmet(id, silk, kind) {
  const color = kind === 'gold' ? '#F2B705' : silk
  return `<g class="gear-helmet"><defs><linearGradient id="${id}helmet" x2=".25" y2="1"><stop stop-color="${shade(color, 0.35)}"/><stop offset=".4" stop-color="${color}"/><stop offset="1" stop-color="${shade(color, -0.32)}"/></linearGradient></defs><path d="M117 17 C117 6 124 2 132 3 C142 4 147 10 147 18 L132 20Z" fill="url(#${id}helmet)" stroke="#29262a" stroke-width=".6"/><path d="M119 11 Q128 3 138 8" fill="none" stroke="#fff" stroke-width="1.4" opacity=".45"/>${kind === 'stripe' ? '<path d="M130 4 Q135 10 135 19" stroke="#f6f0e7" stroke-width="3" fill="none"/>' : ''}${kind === 'stars' ? '<path d="M128 8 l1 2 2 .2 -1.5 1.4 .5 2 -2 -1 -2 1 .5 -2 -1.5 -1.4 2 -.2Z M138 9 l1 2 2 .2 -1.5 1.4 .5 2 -2 -1 -2 1 .5 -2 -1.5 -1.4 2 -.2Z" fill="#fff"/>' : ''}<path d="M134 16 L151 18 L145 22 L134 21Z" fill="${shade(color, -0.28)}"/><path d="M132 18 L144 19 L142 24 L133 23Z" fill="#86a6b0" stroke="#342e2d" stroke-width=".7"/><path d="M131 19 L127 27" stroke="#3c302c" stroke-width=".6"/></g>`
}

function raceJockey(id, silk, gear) {
  const color = [
    '#C8102E',
    '#F2B705',
    '#1F6FB2',
    '#2E9E5B',
    '#6B3FA0',
    '#F08C3A',
    '#E04F9A',
    '#12A4A4',
    '#9AA3A8',
  ].includes(silk)
    ? silk
    : '#C8102E'
  return (
    '<g class="race-jockey"><image href="horse-pieces/jockey-' +
    color.slice(1) +
    '.png" x="80" y="0" width="75" height="70"/>' +
    racerHelmet(id, silk, gear.helmet) +
    '</g>'
  )
}
function racerMarks(marks, x, y) {
  return `<g class="effort-marks">${Array.from({ length: Math.min(5, marks.ribbons || 0) }, (_, i) => `<path d="M${x + i * 4} ${y} v7 l2 -2 2 2 v-7Z" fill="#288ae0"/><circle cx="${x + i * 4 + 2}" cy="${y}" r="2" fill="#FFD43B" stroke="#3c3530" stroke-width=".4"/>`).join('')}${marks.grit ? '<path d="M101 0 l2 4 4 .5 -3 3 .5 4 -3.5 -2 -3.5 2 .5 -4 -3 -3 4 -.5Z" fill="#FFD43B" stroke="#53402a" stroke-width=".7"/>' : ''}</g>`
}
function equipment(id, kind, silk, num, gear, marks) {
  const g = gear,
    cloth = blanketFill(id + 'p', g.blanket, silk),
    motor = kind === 'moto',
    tiger = kind === 'tiger'
  const blanket = motor
    ? 'M94 57 L129 48 L136 58 L115 69 L96 65Z'
    : tiger
      ? 'M80 35 L105 36 L102 58 Q88 61 78 56Z'
      : 'M65 38 L98 39 L97 61 Q80 65 64 58Z'
  const numX = motor ? 116 : tiger ? 91 : 81,
    numY = motor ? 62 : tiger ? 52 : 56
  const mane =
    !motor && !tiger && g.mane && g.mane !== 'plain'
      ? `<g class="gear-mane">${[0, 1, 2, 3, 4].map((i) => `<ellipse cx="${120 - i * 3.4}" cy="${25 + i * 4}" rx="2.8" ry="3.5" fill="#302820" stroke="#6e5944" stroke-width=".7"/>${g.mane === 'beads' ? `<circle cx="${122 - i * 3.4}" cy="${27 + i * 4}" r="1.6" fill="${silk}" stroke="#f5dcad" stroke-width=".4"/>` : ''}`).join('')}</g>`
      : ''
  const tail =
    !motor && !tiger && g.tail && g.tail !== 'none'
      ? `<g class="gear-tail"><path d="M45 54 L51 60 L42 64" stroke="${silk}" stroke-width="2.5" fill="none"/>${g.tail === 'bow' ? `<path d="M46 58 Q37 49 39 60 Q42 63 46 58 Q54 48 54 58 Q51 64 46 58Z" fill="${silk}" stroke="#44382d" stroke-width=".5"/>` : ''}</g>`
      : ''
  return `<defs>${patternDef(id + 'p', g.blanket, silk)}<linearGradient id="${id}cloth" x2="0" y2="1"><stop stop-color="#fff" stop-opacity=".15"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></linearGradient></defs><g class="gear-blanket"><path d="${blanket}" fill="${cloth}" stroke="${g.blanket === 'gold' ? '#f2cb4b' : '#e9dfc9'}" stroke-width="1.2"/><path d="${blanket}" fill="url(#${id}cloth)"/><text x="${numX}" y="${numY}" font-family="Arial" font-size="12" font-weight="700" text-anchor="middle" fill="#fff" stroke="#3b2c1f" stroke-width=".5" paint-order="stroke">${num ?? ''}</text></g>${mane}${tail}${racerMarks(marks, motor ? 99 : 70, motor ? 69 : 63)}`
}
function quad({ kind, coat, silk, num, gear = {}, marks = {} }) {
  const id = 'r' + ++MASCOT_ID
  return (
    texturedBody(kind, coat, gear, silk, id) +
    equipment(id, kind, silk, num, gear, marks) +
    (kind === 'tiger'
      ? `<g transform="translate(34 24) scale(.9)">${racerHelmet(id + 't', silk, gear.helmet)}</g>`
      : raceJockey(id, silk, gear))
  )
}
function motoSvg({ silk, num, gear = {}, marks = {} }) {
  const id = 'r' + ++MASCOT_ID
  return (
    texturedBody('moto', '#333333', gear, silk, id) +
    equipment(id, 'moto', silk, num, gear, marks) +
    `<g transform="translate(-5 7) scale(.98)">${raceJockey(id, silk, gear)}</g><g class="spin" style="transform-origin:145px 88px"><circle cx="145" cy="88" r="12" fill="none" stroke="#bbc1c3" stroke-width=".6" stroke-dasharray="4 5"/></g>`
  )
}
function mascot(kind, o = {}) {
  ensureRacerAtlas()
  const silk = o.silk || SILKS[0],
    gear = o.gear || {},
    marks = o.marks || {}
  const coat =
    kind === 'tiger'
      ? '#FCA526'
      : kind === 'zebra'
        ? '#FAF6E8'
        : o.coat || COATS[0]
  const inner =
    kind === 'moto'
      ? motoSvg({ silk, num: o.num, gear, marks })
      : quad({ kind, coat, silk, num: o.num, gear, marks })
  return `<svg class="mascot textured-racer ${kind} ${o.ghost ? 'ghostrider' : ''} ${o.still ? 'still' : ''} ${o.victory ? 'v-' + o.victory : ''}" viewBox="-10 -12 200 130" width="${o.size || 90}" role="img" aria-label="${o.ghost ? 'Last Friday: ' : ''}${kind === 'moto' ? 'motorbike' : kind} racer"><ellipse cx="87" cy="105" rx="69" ry="4" fill="#17232D" opacity=".2"/><g class="body">${inner}</g></svg>`
}
const RIDE_KIND = {
  horse: 'horse',
  moto: 'moto',
  zebra: 'zebra',
  tiger: 'tiger',
  '🐎': 'horse',
  '🏍️': 'moto',
}

/* ---- skin/art_scenes.js ---- */
/* SKIN FILE. Owned by the skin (Codex). Change freely, but keep every contract in AGENTS.md. */
/* Shared art: the horseshoe icon, the stadium behind student screens, and the scenic race track. */
const HS = (s = 20) =>
  `<svg class="hs" viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true"><path d="M5 3 C2 10 3 17 7 21 L10 21 C7 17 6.5 11 8.5 5 C10 3 14 3 15.5 5 C17.5 11 17 17 14 21 L17 21 C21 17 22 10 19 3 Z" fill="#F2B705" stroke="#8A6D00" stroke-width="1.2" stroke-linejoin="round"/><circle cx="5.6" cy="8" r=".9" fill="#8A6D00"/><circle cx="5.4" cy="13" r=".9" fill="#8A6D00"/><circle cx="18.4" cy="8" r=".9" fill="#8A6D00"/><circle cx="18.6" cy="13" r=".9" fill="#8A6D00"/></svg>`

/* ---- scenic racetrack (inspired by the Math Derby look) ---- */
let SCENE = ''
function sceneSvg() {
  if (SCENE) return SCENE
  const r = rng(7)
  const tree = (x, y, scale) =>
    `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 0 L-3 -52 L5 -54 L8 0" fill="#526148"/><ellipse cx="0" cy="-59" rx="25" ry="24" fill="#386950"/><ellipse cx="-18" cy="-53" rx="22" ry="18" fill="#477d56"/><ellipse cx="14" cy="-64" rx="23" ry="20" fill="#639165"/><path d="M-25 -53 Q-14 -66 0 -63" stroke="#86ac72" stroke-width="4" fill="none"/></g>`
  const cloud = (x, y) =>
    `<g transform="translate(${x} ${y})" fill="#fff" opacity=".8"><ellipse rx="62" ry="13"/><ellipse cx="-18" cy="-10" rx="28" ry="18"/><ellipse cx="17" cy="-6" rx="32" ry="18"/></g>`
  const fence = (y, h) =>
    `<g fill="#faf4dd">${Array.from({ length: 25 }, (_, i) => `<path d="M${i * 50} ${y} l3 -${h} h5 l3 ${h}Z"/>`).join('')}<rect y="${y - h + 5}" width="1200" height="5"/><rect y="${y - 8}" width="1200" height="4"/></g>`
  SCENE = `<svg class="scene-bg" viewBox="0 0 1200 380" preserveAspectRatio="none" aria-hidden="true">
   <defs><linearGradient id="td-sky" x2="0" y2="1"><stop stop-color="#4BABE0"/><stop offset="1" stop-color="#D6F4FF"/></linearGradient><linearGradient id="td-turf" x2="0" y2="1"><stop stop-color="#8DCE4A"/><stop offset="1" stop-color="#398844"/></linearGradient><linearGradient id="td-track" x2="0" y2="1"><stop stop-color="#E6B970"/><stop offset="1" stop-color="#BE7F40"/></linearGradient></defs>
   <rect width="1200" height="240" fill="url(#td-sky)"/><circle cx="1010" cy="65" r="35" fill="#fff1be" opacity=".85"/>
   ${cloud(170, 56)}${cloud(640, 42)}${cloud(860, 98)}
   <path d="M0 106 Q140 40 335 94 T720 80 T1200 88 V160 H0Z" fill="#94CB80"/>
   <path d="M0 120 Q230 76 450 113 T890 99 T1200 117 V160 H0Z" fill="#63AF65"/>
   <path d="M0 127 Q430 107 1200 121 V180 H0Z" fill="url(#td-turf)"/>
   ${[30, 88, 160, 240, 800, 850, 915, 1080, 1170].map((x, i) => tree(x, 132, (i % 3) * 0.15 + 0.6)).join('')}
   <g transform="translate(0 -58)"><path d="M350 133 L670 133 L650 113 H370Z" fill="#233e39"/><path d="M364 134 H657 V181 H364Z" fill="#e8dfbf"/><path d="M365 147 H656 M365 161 H656 M365 173 H656" stroke="#9f9279" stroke-width="2"/>${Array.from({ length: 105 }, () => `<circle cx="${ri(r, 372, 649)}" cy="${ri(r, 143, 177)}" r="2" fill="${pick(r, ['#dcab40', '#446a66', '#faf3df', '#bd6950'])}"/>`).join('')}${[365, 423, 481, 539, 597, 655].map((x) => `<path d="M${x} 133 V181" stroke="#faf4dd" stroke-width="4"/>`).join('')}</g>
   <path d="M0 135 Q600 118 1200 135 V380 H0Z" fill="url(#td-track)"/>
   ${fence(143, 25)}
   <path d="M0 249 H1200" stroke="#FFE7AB" stroke-width="2" stroke-dasharray="28 17" opacity=".8"/>
   ${Array.from({ length: 65 }, () => `<path d="M${ri(r, 0, 1200)} ${ri(r, 153, 365)} h${ri(r, 4, 20)}" stroke="#916b49" opacity=".2"/>`).join('')}
   <path d="M0 365 H1200 V380 H0Z" fill="#547851"/>${fence(377, 17)}
  </svg>`
  return SCENE
}

let STADIUM = ''
function stadium() {
  if (STADIUM) return STADIUM
  const r = rng(42),
    crowd = (x0, x1, y0, y1, slope) => {
      let s = ''
      for (let i = 0; i < 170; i++) {
        const x = x0 + r() * (x1 - x0),
          y = y0 + r() * (y1 - y0) + slope * (x - x0)
        s += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="7" ry="9" fill="${pick(r, ['#F2B705', '#1C1F1D', '#C8102E', '#2E9E5B', '#1F6FB2', '#F2B705'])}"/>`
      }
      return s
    }
  STADIUM = `<svg class="stadium" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
   <defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B9E2F5"/><stop offset="1" stop-color="#DDF1FA"/></linearGradient></defs>
   <rect width="1200" height="640" fill="url(#sk)"/>
   <g fill="#fff" opacity=".9"><ellipse cx="180" cy="190" rx="70" ry="26"/><ellipse cx="225" cy="172" rx="48" ry="30"/><ellipse cx="1010" cy="210" rx="76" ry="24"/><ellipse cx="1050" cy="192" rx="44" ry="28"/></g>
   <path d="M0 400 Q300 330 600 380 T1200 360 L1200 640 L0 640Z" fill="#8FD49A"/>
   <path d="M0 330 L420 420 L420 520 L0 520Z" fill="#CFEAF5"/><path d="M0 300 L430 400 L430 418 L0 330Z" fill="#1C1F1D"/>
   <path d="M1200 330 L780 420 L780 520 L1200 520Z" fill="#CFEAF5"/><path d="M1200 300 L770 400 L770 418 L1200 330Z" fill="#1C1F1D"/>
   <g>${crowd(10, 400, 345, 380, 0.2)}</g><g transform="translate(1200,0) scale(-1,1)">${crowd(10, 400, 345, 380, 0.2)}</g>
   <rect x="0" y="505" width="1200" height="20" fill="#F2B705"/>
   <path d="M470 470 L730 470 L1040 640 L160 640Z" fill="#C48A52"/>
   <path d="M470 470 L160 640 L130 640 L462 470Z" fill="#fff"/><path d="M730 470 L1040 640 L1070 640 L738 470Z" fill="#fff"/>
   <g stroke="#E3B887" stroke-width="5" stroke-dasharray="26 22" fill="none" opacity=".8"><path d="M600 474 L600 640"/></g>
   <rect x="0" y="520" width="1200" height="120" fill="#5DBB72" opacity=".0"/>
   <rect x="300" y="0" width="12" height="150" fill="#1C1F1D"/><rect x="888" y="0" width="12" height="150" fill="#1C1F1D"/>
  </svg>`
  return STADIUM
}

/* ---- engine/07_race.js ---- */
/* ENGINE FILE. Owned by the engine (Claude). Codex: do not edit. Request changes in REQUESTS.md. */
/* ================= student race engine =================
   State, timing, scoring, speech, keyboard, practice logic. Draws nothing directly:
   every screen change goes through a skin hook (see AGENTS.md). */
const K = {
  practice: null,
  stage: 'join',
  code: '',
  tid: null,
  sid: null,
  mode: 'tap',
  ride: null,
  R: null,
  missedOnly: false,
  hideKey: false,
}
const RIDES = [
  { k: 'horse', name: 'Horse' },
  { k: 'zebra', name: 'Zebra' },
  { k: 'tiger', name: 'Tiger' },
  { k: 'moto', name: 'Motorbike' },
]
/* read aloud: every Kindergarten prompt is spoken so no reading is required */
function say(text) {
  try {
    if (!window.speechSynthesis || !text) return
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.9
    u.pitch = 1.05
    speechSynthesis.speak(u)
  } catch (e) {}
}
const autoRead = (p) =>
  p.grade === 'K' || p.grade === '1' || !!studentOf(K.sid)?.accom?.read
function racedThisWeek(sid, pid) {
  const w = fridayOf(todayIso())
  return DB.attempts.some(
    (a) =>
      a.sid === sid && a.pid === pid && !a.retake && fridayOf(a.date) === w,
  )
}
async function joinClass() {
  K.code = ($('#code')?.value || K.code || '').trim().toUpperCase()
  const t = DB.teachers.find((x) => x.classCode.toUpperCase() === K.code)
  if (SERVER && !t) {
    try {
      const b = await call('studentBoot', K.code)
      if (b) {
        DB.teachers = [b.teacher]
        DB.students = b.students
        DB.attempts = b.attempts || []
        K.tid = b.teacher.id
        DB.stables = Object.assign(DB.stables || {}, b.stables || {})
        if (b.me) {
          K.sid = b.me
          K.stage = stableOf(K.sid).name ? 'stable' : 'name'
        } else K.stage = 'who'
        return renderStudent()
      }
    } catch (e) {}
  }
  if (!t) {
    toast('That class code was not found. Check with your teacher.')
    return
  }
  K.tid = t.id
  K.stage = 'who'
  renderStudent()
}

/* --- speech answers --- */
const NUMW = {
  zero: 0,
  oh: 0,
  one: 1,
  won: 1,
  two: 2,
  to: 2,
  too: 2,
  three: 3,
  tree: 3,
  four: 4,
  for: 4,
  fore: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  ate: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
}
function parseSpoken(t) {
  t = t.toLowerCase().replace(/,/g, '')
  const d = t.match(/-?\d+/g)
  if (d) return +d[d.length - 1]
  let total = 0,
    cur = 0,
    hit = false
  for (const w of t.split(/[\s-]+/)) {
    if (w in NUMW) {
      cur += NUMW[w]
      hit = true
    } else if (w === 'hundred') {
      cur = (cur || 1) * 100
      hit = true
    } else if (w === 'thousand') {
      total += (cur || 1) * 1000
      cur = 0
      hit = true
    }
  }
  return hit ? total + cur : null
}
let REC = null
function startSpeech() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return false
  try {
    REC = new SR()
    REC.lang = 'en-US'
    REC.continuous = true
    REC.interimResults = false
    REC.onresult = (e) => {
      const tx = e.results[e.results.length - 1][0].transcript
      const cur = K.R && K.R.items && K.R.items[K.R.i]
      const wc = cur ? choiceFromSpeech(cur, tx) : null
      if (wc != null) {
        K.R.heard = tx
        answer(wc)
        return
      }
      const n = parseSpoken(tx)
      K.R.heard = tx
      showHeard(tx)
      if (n != null) answer(n)
    }
    REC.onend = () => {
      if (K.stage === 'race' && K.mode === 'speak') {
        try {
          REC.start()
        } catch (e) {}
      }
    }
    REC.start()
    return true
  } catch (e) {
    return false
  }
}

/* --- race engine: fixed item count, fixed seconds per item, auto-advance on timeout --- */
function startLights() {
  K.stage = 'lights'
  renderStudent()
  playStartLights(startRace)
}
function startRace() {
  const st = studentOf(K.sid),
    p = PR[effPid(st)],
    pts = weeklyPoints(K.sid, p.id)
  K.R = {
    earned0: wallet(K.sid).earned,
    streak: 0,
    p,
    secs: raceSecs(st, p),
    retake: !!K.allowRetake && racedThisWeek(K.sid, p.id),
    items: p.gen(rng(Date.now()), p),
    i: 0,
    res: [],
    exits: 0,
    buf: '',
    sel: null,
    placed: [],
    heard: '',
    ghost: pts.length ? pts[pts.length - 1].y : null,
    t0: performance.now(),
  }
  K.stage = 'race'
  if (p.noSpeak || p.input === 'place') K.mode = 'tap'
  if (K.mode === 'speak' && !startSpeech()) {
    K.mode = 'tap'
    toast('Speaking is not available on this device. Use the buttons.')
  }
  K.R.mounted = false
  nextItem()
}
function nextItem() {
  const R = K.R,
    p = R.p
  R.waiting = false
  if (R.i >= R.items.length) return finishRace()
  const it = R.items[R.i]
  R.buf = ''
  R.sel = null
  R.placed = []
  R.heard = ''
  R.start = performance.now()
  if (!R.mounted) {
    renderRace()
    R.mounted = true
  }
  updateRaceBar()
  showItem(it, p, R.secs)
  if (autoRead(p) && K.mode !== 'speak' && it.say) say(it.say)
  clearTimeout(R.timer)
  if (!R.p.arcade) R.timer = setTimeout(() => answer(null), R.secs * 1000)
}
function pending() {
  const R = K.R
  if (R.p.input === 'place') return R.placed.length || null
  if (R.p.input === 'choices') return R.sel
  return R.buf === '' ? null : +R.buf
}
function answer(val) {
  // R.waiting: an answer was just recorded and the next problem is not on screen yet. A second tap
  // (double-tap, or a timeout firing at the same moment) must not answer a problem the child has not seen.
  const R = K.R
  if (
    !R ||
    K.stage !== 'race' ||
    R.locked ||
    R.waiting ||
    R.i >= R.items.length
  )
    return
  R.locked = true
  clearTimeout(R.timer)
  const it = R.items[R.i],
    rt = (performance.now() - R.start) / 1000
  // at timeout, a chosen-but-not-submitted answer still counts as the child's response
  if (val == null && K.mode !== 'speak') val = pending()
  const status =
    val == null
      ? R.heard
        ? 'notRecognized'
        : 'noResponse'
      : same(val, it.answer)
        ? 'correct'
        : 'incorrect'
  R.res.push({
    i: R.i + 1,
    prompt: it.prompt,
    answer: it.answer,
    response: val != null ? val : R.heard || '',
    status,
    rt: Math.round(rt * 100) / 100,
    skill: it.skill,
  })
  R.i++
  R.locked = false
  R.waiting = true
  setTimeout(nextItem, R.p.arcade ? 240 : 150)
}
async function finishRace() {
  const R = K.R,
    p = R.p
  if (R.finished) return
  R.finished = true // save each race exactly once
  try {
    REC && REC.stop()
  } catch (e) {}
  try {
    speechSynthesis.cancel()
  } catch (e) {}
  K.stage = 'saving'
  const cnt = (s) => R.res.filter((x) => x.status === s).length,
    sk = {}
  R.res.forEach((x) => {
    sk[x.skill] = sk[x.skill] || [0, 0]
    sk[x.skill][1]++
    if (x.status === 'correct') sk[x.skill][0]++
  })
  const answered = R.res
    .filter((x) => x.status === 'correct' || x.status === 'incorrect')
    .map((x) => x.rt)
  const date = todayIso()
  const a = {
    id: K.sid + '_' + Date.now(),
    sid: K.sid,
    pid: p.id,
    date,
    correct: cnt('correct'),
    incorrect: cnt('incorrect'),
    noResp: cnt('noResponse'),
    notRec: cnt('notRecognized'),
    total: R.items.length,
    secs: Math.round((performance.now() - R.t0) / 1000),
    mode: K.mode === 'speak' ? 'speak' : 'type',
    exits: R.exits,
    medianRt: r1(median(answered)),
    skills: sk,
    accom:
      studentOf(K.sid).accom && studentOf(K.sid).accom.x > 1
        ? studentOf(K.sid).accom.x
        : 0,
    read: studentOf(K.sid).accom?.read ? 1 : 0,
    retake: R.retake || undefined,
  }
  K.allowRetake = false
  R.attempt = a
  if (!FRIDAYS.includes(fridayOf(date))) FRIDAYS.push(fridayOf(date))
  try {
    await API.saveAttempt(a, R.res)
  } catch (e) {
    toast('Saving failed. Tell your teacher before closing this page.')
  }
  K.stage = 'done'
  renderStudent()
}
const same = (a, b) => String(a) === String(b)
const cval = (v) => (v !== '' && !isNaN(+v) ? +v : v)
function selectChoice(v) {
  K.R.sel = v
  markChoice(v)
}
/* keyboard and speech for word/symbol answers: T/F, O/E, P/C, < = > and spoken words */
const SPOKEN = {
  greater: '>',
  more: '>',
  bigger: '>',
  less: '<',
  fewer: '<',
  smaller: '<',
  equal: '=',
  same: '=',
  red: 'red',
  blue: 'blue',
}
function choiceFromKey(it, key) {
  const cs = it.choices || []
  if (cs.every((c) => typeof c === 'number')) return null
  const k = key.toLowerCase()
  return (
    cs.find((c) => String(c) === key || String(c)[0].toLowerCase() === k) ??
    null
  )
}
function choiceFromSpeech(it, tx) {
  const cs = it.choices || []
  if (!cs.length || cs.every((c) => typeof c === 'number')) return null
  const t = tx.toLowerCase()
  const hit = cs.find((c) => t.includes(String(c).toLowerCase()))
  if (hit != null) return hit
  const w = Object.keys(SPOKEN).find((k) => t.includes(k))
  return w && cs.includes(SPOKEN[w]) ? SPOKEN[w] : null
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden && K.stage === 'race' && K.R) K.R.exits++
})
document.addEventListener('keydown', (e) => {
  if (window.ArcadeNumberEntry && K.R?.p?.arcade) return
  if (S.view === 'student' && K.stage === 'practice') {
    const p = K.P.p,
      it = K.P.queue[0]
    if (!it) return
    if (p.input === 'choices') {
      const wc = choiceFromKey(it, e.key)
      if (wc != null) selectChoice(wc)
      else if (/^[0-9]$/.test(e.key) && (it.choices || []).includes(+e.key))
        selectChoice(+e.key)
      else if (e.key === 'Enter') practiceCheck()
    } else if (p.input === 'pad') {
      if (/^[0-9]$/.test(e.key)) padInput(e.key)
      else if (e.key === 'Backspace') padInput('del')
      else if (e.key === 'Enter') practiceCheck()
    } else if (e.key === 'Enter') practiceCheck()
    return
  }
  if (S.view !== 'student' || K.stage !== 'race') return
  const R = K.R,
    p = R.p,
    it = R.items[R.i]
  if (p.input === 'choices') {
    const wc = choiceFromKey(it, e.key)
    if (wc != null) {
      selectChoice(wc)
      return
    }
    if (/^[0-9]$/.test(e.key)) {
      R.buf = (R.buf + e.key).slice(-2)
      const v = (it.choices || []).includes(+R.buf)
        ? +R.buf
        : (it.choices || []).includes(+e.key)
          ? +e.key
          : null
      if (v != null) selectChoice(v)
    } else if (e.key === 'Enter' && R.sel != null) answer(R.sel)
    return
  }
  if (p.input === 'place') {
    if (e.key === 'Enter') answer(R.placed.length)
    return
  }
  if (/^[0-9]$/.test(e.key)) padInput(e.key)
  else if (e.key === 'Backspace') padInput('del')
  else if (e.key === 'Enter') padInput('enter')
})
function padInput(k) {
  const R = K.R
  if (!R) return
  if (k === 'del') R.buf = R.buf.slice(0, -1)
  else if (k === 'enter') {
    if (K.stage === 'practice') {
      practiceCheck()
      return
    }
    if (R.buf !== '') answer(+R.buf)
    return
  } else if (R.buf.length < 6) R.buf += k
  showBuffer(R.buf)
}

/* ================= practice mode =================
   Untimed, shows the right answer after a miss, retries a missed problem once,
   leans on the student's weakest fact sets, and never touches Friday scores. */
function startPractice() {
  const st = studentOf(K.sid),
    p = PR[effPid(st)],
    weak = weakSkills(K.sid, p.id),
    r = rng(Date.now())
  const pool = p.gen(r, { ...p, items: Math.max(60, p.items * 3) }),
    N = Math.min(15, p.items)
  const fromWeak = pool
    .filter((it) => weak.includes(it.skill))
    .slice(0, Math.round(N * 0.7))
  const rest = pool
    .filter((it) => !fromWeak.includes(it))
    .slice(0, N - fromWeak.length)
  K.P = {
    p,
    weak,
    queue: shuffle(r, [...fromWeak, ...rest]),
    done: 0,
    first: 0,
    total: N,
    retried: new Set(),
    t0: performance.now(),
    buf: '',
    sel: null,
    placed: [],
  }
  K.stage = 'practice'
  renderStudent()
}
function practiceCheck() {
  const P = K.P,
    it = P.queue[0]
  if (!it || P.locked) return
  const v =
    P.p.input === 'place'
      ? K.R.placed.length
      : P.p.input === 'choices'
        ? K.R.sel
        : K.R.buf === ''
          ? null
          : +K.R.buf
  if (v == null) {
    toast('Pick an answer first')
    return
  }
  P.locked = true
  const ok = same(v, it.answer),
    key = it.prompt + '|' + it.answer
  if (ok) {
    if (!P.retried.has(key)) P.first++
    P.done++
    P.queue.shift()
  } else if (!P.retried.has(key)) {
    P.retried.add(key)
    P.queue.push(P.queue.shift())
  } else {
    P.done++
    P.queue.shift()
  }
  showPracticeFeedback(ok, it, P.retried.has(key) && P.queue.includes(it))
  if (!ok && autoRead(P.p)) say(`The answer is ${it.answer}`)
  setTimeout(
    () => {
      P.locked = false
      renderPractice()
    },
    ok ? 700 : 2400,
  )
}
async function finishPractice() {
  const P = K.P
  K.stage = 'pdone'
  const rec = {
    id: 'p' + K.sid + Date.now(),
    sid: K.sid,
    pid: P.p.id,
    date: todayIso(),
    items: P.done,
    correct: P.first,
    secs: Math.round((performance.now() - P.t0) / 1000),
  }
  P.rec = rec
  try {
    if (P.done) await API.logPractice(rec)
  } catch (e) {}
  renderStudent()
}

/* ---- skin/screens_student.js ---- */
/* SKIN FILE. Owned by the skin (Codex). Change freely, but keep every contract in AGENTS.md. */
/* ================= student screens =================
   Every student-facing screen and the race view. The engine calls these hooks. */
const myRide = (size, o = {}) => racerOf(K.sid, { size, ...o })
const rideName = () =>
  (
    RIDES.find((r) => r.k === stableOf(K.sid).ride) || RIDES[0]
  ).name.toLowerCase()
function shell(inner, { hud = '' } = {}) {
  return `<div class="stage">${stadium()}<div class="stage-in">${hud}${inner}</div></div>`
}
/* Shared presentation for the paddock, finish celebration, and Stable. */
function clubShell(title, inner, cls = '') {
  return `<div class="club-stage ${cls}"><div class="club-wrap"><header class="club-heading"><div><span class="race-eyebrow">TGES • TIGER DOWNS</span><h1>${title}</h1></div><span class="club-emblem" aria-hidden="true">★ FRIDAY RACING CLUB</span></header>${inner}</div></div>`
}
function paddockRide(size, opts = {}) {
  return `<div class="paddock-art">${sceneSvg()}<div class="paddock-ride">${myRide(size, opts)}</div><span class="paddock-plate">${esc(displayName(stableOf(K.sid)))}</span></div>`
}
function ribbonTags(sid, pid) {
  const pts = weeklyPoints(sid, pid),
    all = DB.attempts.filter((a) => a.sid === sid && a.pid === pid),
    g = goalOf(PR[pid])
  const best = all.length ? Math.max(...all.map((a) => a.correct)) : 0,
    trophies = all.filter((a) => a.correct >= g).length
  return {
    best,
    trophies,
    html: `<div class="tags"><span class="tag"><b>⭐</b>Personal best: ${best}</span><span class="tag"><b>🏆</b>Trophies: ${trophies}</span></div>`,
  }
}

function renderStudent() {
  document.body.className = 'kid'
  const app = $('#app'),
    t = K.tid ? teacherOf(K.tid) : null
  if (K.stage === 'join') {
    app.innerHTML =
      shell(`<div class="sign flow-card join-card"><span class="flow-kicker">TGES • TIGER DOWNS</span><div class="welcome-racer">${mascot('horse', { size: 220, still: true, silk: '#F2B705' })}</div><h1 style="font-size:40px">Friday Fluency Race</h1><p style="font-size:20px;margin:6px 0 14px">Type your class code.</p>
      <input id="code" class="ansbox" style="font-size:34px;width:240px;text-transform:uppercase" value="${esc(K.code)}" aria-label="Class code" placeholder="TG-3B">
      <div style="margin-top:14px"><button class="kbtn green" data-act="k-join">Go</button></div>
      ${
        !SERVER
          ? `<p class="note" style="margin-top:14px">Demo class codes</p><div class="row" style="justify-content:center;gap:8px">${DB.teachers
              .filter((_, i) => i % 3 === 0)
              .map(
                (t) =>
                  `<button class="tile" style="font-size:16px;padding:6px 10px" data-act="k-code" data-c="${t.classCode}">${t.classCode}</button>`,
              )
              .join('')}</div>`
          : ''
      }</div>`)
    $('#code')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') joinClass()
    })
    return
  }
  if (K.stage === 'who') {
    app.innerHTML =
      shell(`<div class="sign wide flow-card roster-card"><span class="flow-kicker">YOUR CLASS • YOUR FRIDAY RACE</span><div class="spread"><h1>Tap your name</h1><span class="partpill">${esc(t.name)}, ${gradeName(t.grade)}</span></div>
      <div class="tiles" style="margin-top:14px">${rosterOf(t.id)
        .map(
          (s) =>
            `<button class="tile" data-act="k-who" data-s="${s.id}"><span class="roster-icon" aria-hidden="true">${esc(s.name.charAt(0))}</span>${esc(s.name)}</button>`,
        )
        .join('')}</div>
      <p style="margin-top:14px"><button class="kbtn alt" data-act="k-back">Back</button></p></div>`)
    return
  }
  const st = studentOf(K.sid),
    p = PR[effPid(st)]
  if (K.stage === 'practice') {
    renderPractice()
    return
  }
  if (K.stage === 'pdone') {
    renderPracticeDone()
    return
  }
  if (K.stage === 'name') {
    renderNaming()
    return
  }
  if (K.stage === 'stable') {
    renderStable()
    return
  }
  if (K.stage === 'gate' || K.stage === 'lights') {
    const tg = ribbonTags(K.sid, p.id),
      pts = weeklyPoints(K.sid, p.id),
      last = pts[pts.length - 1]
    app.innerHTML = clubShell(
      'THE STARTING GATE',
      `<section class="club-card gate-card">
      <div class="gate-preview"><div class="starting-rig"><span>READY • SET • GO</span><div class="lights" id="lightsL" aria-label="Countdown lights"><i class="red"></i><i class="yellow"></i><i class="green"></i></div></div>${paddockRide(350)}${tg.html}</div>
      <div class="gate-mid"><span class="club-kicker">YOUR FRIDAY CHALLENGE</span><h2 class="gate-skill">${esc(p.label)}</h2>
       <p class="club-copy">${last ? `Last Friday ${esc(displayName(stableOf(K.sid)))} got <b>${last.y}</b>. Pass it today!` : 'Your first race sets the pace for next Friday.'}</p>
       ${p.input !== 'place' && !p.noSpeak && K.stage === 'gate' ? `<div class="answer-mode"><span class="club-kicker">ANSWER BY</span><div class="row"><button class="chipbtn" data-act="k-mode" data-m="tap" aria-pressed="${K.mode === 'tap'}">👆 ${p.input === 'pad' ? 'Typing' : 'Tapping'}</button><button class="chipbtn" data-act="k-mode" data-m="speak" aria-pressed="${K.mode === 'speak'}">🎤 Speaking</button></div></div>` : ''}
       ${
         racedThisWeek(K.sid, p.id) && !K.allowRetake
           ? `<p class="club-copy"><b>You already raced this week.</b> Your Friday score is saved. Warm up with practice instead!</p><button class="kbtn" data-act="k-practice">🎯 Practice</button><p><button class="linkish" data-act="k-retake">Teacher: allow a retake</button></p>`
           : `<div class="gate-actions"><button class="kbtn green" data-act="k-start" ${K.stage === 'lights' ? 'disabled' : ''}>${K.stage === 'lights' ? 'Get ready…' : '▶ Start now'}</button><button class="kbtn alt" data-act="k-practice" ${K.stage === 'lights' ? 'disabled' : ''}>🎯 Practice</button></div><p class="note">Practice does not count toward your Friday score.</p>`
       }
       ${K.allowRetake ? '<p class="note">Retake: saved for the teacher, but the first race this week stays the official score.</p>' : ''}
       ${K.stage === 'gate' ? '<button class="linkish back-stable" data-act="k-stable">← Back to my stable</button>' : ''}</div></section>`,
      'gate-stage',
    )
    return
  }
  if (K.stage === 'race') {
    renderRace()
    return
  }
  if (K.stage === 'done') {
    const a = K.R.attempt,
      tg = ribbonTags(K.sid, p.id),
      prev = K.R.ghost,
      rib = studentRibbons(K.sid, p.id).filter(
        (x) => x.t !== 'Raced this Friday',
      )
    const w = wallet(K.sid),
      gained = w.earned - (K.R.earned0 || 0),
      why = w.ev.filter((e) => e.d === a.date && e.n).map((e) => e.why),
      up = w.tier > tierOf_(K.R.earned0 || 0)
    app.innerHTML = clubShell(
      'THE FINISH LINE',
      `<section class="club-card finish-card"><div class="finish-preview"><div class="finish-banner">★ RACE COMPLETE ★</div>${paddockRide(350, { victory: victoryOf(K.sid) })}${tg.html}
      ${rib.length ? `<div class="ribbons">${rib.map((x) => `<div class="ribbon"><span class="r">${x.r}</span>${esc(x.t)}</div>`).join('')}</div>` : ''}</div>
      <div class="finish-results"><span class="club-kicker">YOUR FRIDAY RESULT</span><h2><button class="spk" data-act="k-say" data-t="You got ${a.correct} questions correct!" aria-label="Read aloud">🔊</button> You got <strong>${a.correct}</strong> questions correct!</h2>
      <p class="club-copy">${prev == null ? 'That is your starting pace. Next Friday you race this score.' : a.correct > prev ? `${esc(displayName(stableOf(K.sid)))} passed last Friday's score by ${a.correct - prev}!` : a.correct === prev ? 'Neck and neck with last Friday!' : `Last Friday you got ${prev}. Chase it down next Friday.`}</p>
      ${gained > 0 ? `<div class="earnpop"><div>${HS(40)} <b>+${gained}</b> horseshoe${gained > 1 ? 's' : ''}</div><div class="note">${esc([...new Set(why)].join(' · '))}</div></div>` : ''}
      ${up ? `<div class="tier-up">🏅 <div><b>New tier: ${TIERS[w.tier].n}!</b><span>New gear unlocked in your Stable.</span></div></div>` : ''}
      <div class="finish-actions"><button class="kbtn" data-act="k-review">🔎 See my race</button><button class="kbtn alt" data-act="k-stable">🏠 My stable</button><button class="kbtn green" data-act="k-finish">✓ All done</button></div></div></section>`,
      'finish-stage',
    )
    if (autoRead(p)) say(`You got ${a.correct} questions correct!`)
    return
  }
  if (K.stage === 'review') {
    app.innerHTML = reviewHtml(K.R.res, K.R.attempt, true)
  }
}
function reviewHtml(items, a, student) {
  const shown = items.filter((x) => !K.missedOnly || x.status !== 'correct'),
    answered = a.correct + a.incorrect
  const mark = (x) =>
    x.status === 'correct'
      ? '<b class="ok">✓</b>'
      : x.status === 'incorrect'
        ? '<b class="no">✗</b>'
        : '<b class="skip">–</b>'
  const box = (x) =>
    `<span class="rbox ${x.status === 'correct' ? '' : 'miss'}">${x.response === '' || x.response == null ? '&nbsp;' : esc(x.response)}</span>`
  const q = (x) =>
    /[+−×÷]/.test(x.prompt) && !/[=?]/.test(x.prompt)
      ? esc(x.prompt) + ' ='
      : esc(x.prompt)
  const content = `<div class="wrap ${student ? 'flow-card review-card' : ''}" style="padding:20px"><div class="spread"><h1 style="font-family:var(--kid);font-weight:500">Review your work</h1>${student ? '<button class="kbtn green" data-act="k-finish">All done</button>' : ''}</div>
   <div class="review"><div class="rhead"><span>${pct(a.correct / Math.max(1, answered))} accuracy</span><span class="sep">|</span><span>${a.correct} correct <b class="ok">✓</b></span><span>${a.incorrect} incorrect <b class="no">✗</b></span>${a.noResp + a.notRec ? `<span>${a.noResp + a.notRec} no answer <b class="skip">–</b></span>` : ''}
     <label class="chk"><input type="checkbox" data-act="k-missed" ${K.missedOnly ? 'checked' : ''}> Show missed questions only</label><label class="chk"><input type="checkbox" data-act="k-key" ${K.hideKey ? 'checked' : ''}> Hide answer key</label></div>
    <div class="rgrid">${shown.map((x) => `<div class="ritem"><span class="rn">${x.i})</span><span class="rq">${q(x)}</span>${box(x)}${mark(x)}${x.status !== 'correct' && !K.hideKey ? `<span class="rkey">Answer:<b>${x.answer}</b></span>` : ''}</div>`).join('') || '<p>No missed questions. Clean race!</p>'}</div></div></div>`
  return student ? shell(content) : content
}
function renderRace() {
  const R = K.R,
    p = R.p,
    st = studentOf(K.sid),
    best = Math.max(
      0,
      ...DB.attempts
        .filter((a) => a.sid === K.sid && a.pid === p.id)
        .map((a) => a.correct),
    )
  const mark = (f, t) =>
    `<span class="dmark" style="left:calc(12% + 70%*${f})">${t}</span>`
  $('#app').innerHTML = `<div class="race-stage"><div class="race-wrap">
   <header class="race-heading"><div><span class="race-eyebrow">TGES • FRIDAY FLUENCY</span><h1>YOUR FRIDAY RACE</h1></div><span class="race-skill">${esc(p.label)}</span></header>
   <div class="race-hud"><span class="chip2" id="pc">Problem 1 of ${p.items}</span><span class="chip2" id="streak">🔥 Streak 0</span><span class="chip2 best-chip">★ Personal best <b>${best}</b></span><span class="race-read"><svg class="pie" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16" fill="#e9eff0"/><circle id="pie" cx="18" cy="18" r="8" fill="none" stroke="#F2B705" stroke-width="16" stroke-dasharray="50.3 50.3" transform="rotate(-90 18 18)"/></svg><button class="spk" data-act="k-say-item" aria-label="Read the question again">🔊</button></span></div>
   <div class="track2">${sceneSvg()}
    <span class="course-sign">TIGER DOWNS <small>YOUR FRIDAY TRACK</small></span>
    ${mark(0.25, '¼')}${mark(0.5, '½')}${mark(0.75, '¾')}<span class="finish2"><b>FINISH</b></span>
    <div class="lane2 l1"><span class="runner2" id="me" style="left:12%"><span class="tag2 you">${esc(displayName(stableOf(K.sid)) || st.name.split(' ')[0])}</span><span class="trail t-${trailOf(K.sid)}"></span>${myRide(160)}</span></div>
    ${R.ghost != null ? `<div class="lane2 l2"><span class="runner2" id="gh" style="left:12%"><span class="tag2">Last Friday</span>${myRide(150, { ghost: true })}</span></div>` : ''}

   </div>
   <div class="qcard"><div class="qtext" id="qtext"></div><div id="item" class="qvis"></div><div class="answer" id="ans"></div>
     ${K.mode === 'speak' ? '<div class="mic">🎤 Say your answer out loud <span id="heard" class="note"></span></div>' : ''}</div>
  </div></div>`
}
function updateRaceBar() {
  const R = K.R,
    p = R.p,
    correct = R.res.filter((x) => x.status === 'correct').length
  const pos = (f) => `calc(12% + 70%*${clamp(f, 0, 1)})`
  $('#me').style.left = pos(correct / p.items)
  if ($('#gh')) $('#gh').style.left = pos(((R.i / p.items) * R.ghost) / p.items)
  let k = 0
  for (let i = R.res.length - 1; i >= 0 && R.res[i].status === 'correct'; i--)
    k++
  $('#pc').textContent = `Problem ${R.i + 1} of ${p.items}`
  const sk = $('#streak')
  sk.textContent = `🔥 Streak ${k}`
  sk.classList.toggle('hot', k >= 5)
}
/* on-screen question: K hears and sees it; a listening item never prints the number it asks for */
function qText(it, p) {
  const spk =
    '<button class="spk" data-act="k-say-item" aria-label="Read aloud">🔊</button> '
  if (it.quiet) return spk + 'Listen, then tap the number you hear.'
  if (p.grade === 'K') return spk + esc(it.say || it.prompt)
  return it.ask ? spk + esc(it.ask) : ''
}
const COLOR_CHOICE = { red: '#C8102E', blue: '#1F6FB2' }
function choiceButtons(it) {
  const colorLabel = (c) =>
    COLOR_CHOICE[c]
      ? `<span style="display:inline-block;width:1.5em;height:1.5em;border-radius:6px;background:${COLOR_CHOICE[c]};border:3px solid #fff;vertical-align:middle"></span>`
      : null
  const wide = (it.choices || []).some(
    (c) => String(c).length > 2 && !it.labels && !COLOR_CHOICE[c],
  )
  return (it.choices || [])
    .map(
      (c) =>
        `<button class="cbtn ${wide ? 'wide' : ''}" data-act="k-sel" data-v="${esc(c)}" aria-pressed="false" aria-label="${esc(COLOR_CHOICE[c] ? c + ' group' : c)}">${it.labels && it.labels[c] ? it.labels[c] : colorLabel(c) || esc(c)}</button>`,
    )
    .join('')
}
function placeCritter(i) {
  const R = K.R,
    it = R.items[R.i],
    tray = document.querySelectorAll('#tray .critter'),
    b = tray[i]
  if (!b || b.disabled) return
  b.disabled = true
  b.style.visibility = 'hidden'
  R.placed.push(i)
  const slot = Array.from({ length: tray.length }, (_, n) => n).find(
      (n) => !document.querySelector(`#placed [data-slot="${n}"]`),
    ),
    el = document.createElement('button')
  el.className = 'critter placed-c'
  el.textContent = it.vis.icon
  el.dataset.act = 'k-unplace'
  el.dataset.i = i
  el.setAttribute('aria-label', 'Take one back')
  el.dataset.slot = slot
  el.style.gridColumn = (slot % 6) + 1
  el.style.gridRow = Math.floor(slot / 6) + 1
  $('#placed').appendChild(el)
}
function unplaceCritter(i) {
  const R = K.R
  R.placed = R.placed.filter((x) => x !== +i)
  document.querySelector(`#placed [data-i="${i}"]`)?.remove()
  const b = document.querySelectorAll('#tray .critter')[i]
  if (b) {
    b.disabled = false
    b.style.visibility = ''
  }
}
function renderPractice() {
  const P = K.P,
    p = P.p,
    it = P.queue[0]
  if (!it) {
    return finishPractice()
  }
  K.R = { p, items: [it], i: 0, buf: '', sel: null, placed: [], res: [] } // reuse input helpers
  $('#app').innerHTML =
    shell(`<div class="practice-card flow-card"><span class="flow-kicker">PRACTICE PADDOCK • WARM UP FOR FRIDAY</span><div class="hud"><span class="partpill" style="background:#6B3FA0;font-size:16px">Practice ${Math.min(P.done + 1, P.total)} of ${P.total}</span>${P.weak.length ? `<span class="trybest">Working on: ${esc(P.weak.slice(0, 2).join(', '))}</span>` : ''}<div class="hud-r"><button class="spk" data-act="k-say-item" aria-label="Read aloud">🔊</button><button class="kbtn alt" style="font-size:16px;padding:6px 14px" data-act="k-pstop">Stop</button></div></div>
   <div class="qcard"><div class="qtext">${qText(it, p)}</div><div id="item" class="qvis">${renderVis(it.vis)}</div><div class="answer" id="ans"></div><div id="fb" aria-live="assertive"></div></div></div>`)
  const ans = $('#ans')
  if (p.input === 'place')
    ans.innerHTML = `<button class="submit" data-act="k-psubmit">Check</button>`
  else if (p.input === 'choices')
    ans.innerHTML = `<div class="choicebar">${choiceButtons(it)}</div><button class="submit" data-act="k-psubmit">Check</button>`
  else
    ans.innerHTML = `<div class="ansbox" id="buf">&nbsp;</div><div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => `<button data-act="k-digit" data-d="${d}">${d}</button>`).join('')}<button data-act="k-del" aria-label="Erase">⌫</button><button class="go" data-act="k-psubmit">Check</button></div>`
  if (autoRead(p) && it.say) say(it.say)
}
function renderPracticeDone() {
  const P = K.P
  $('#app').innerHTML =
    shell(`<div class="sign flow-card practice-done"><span class="flow-kicker">PADDOCK SESSION COMPLETE</span><div class="completion-medal" aria-hidden="true">★</div><div class="welcome-racer">${myRide(220, { still: true })}</div><h1>Practice done!</h1>
    <p style="font-size:20px">${P.first} of ${P.done} right on the first try.</p><p class="note">Practice does not change your Friday race. It gets you ready for it.</p>
    <div class="row" style="justify-content:center;margin-top:10px"><button class="kbtn" data-act="k-practice">Practice again</button><button class="kbtn green" data-act="k-finish">All done</button></div></div>`)
  if (autoRead(P.p)) say(`Practice done! ${P.first} right on the first try.`)
}
function showItem(it, p, secs) {
  const prompt = qText(it, p)
  $('.race-stage')?.setAttribute('data-input', p.input)
  $('.race-stage')?.setAttribute('data-visual', it.vis.t)
  $('.race-stage')?.setAttribute('data-grade', p.grade)
  $('#qtext').innerHTML = prompt
  $('#item').innerHTML = renderVis(it.vis)
  const ans = $('#ans')
  if (p.input === 'place')
    ans.innerHTML = `<button class="submit" data-act="k-submit">Submit</button>`
  else if (p.input === 'choices')
    ans.innerHTML = `<div class="choicebar">${choiceButtons(it)}</div><button class="submit" data-act="k-submit">Submit</button>`
  else
    ans.innerHTML = `<div class="ansbox" id="buf" aria-live="polite">&nbsp;</div><div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => `<button data-act="k-digit" data-d="${d}">${d}</button>`).join('')}<button data-act="k-del" aria-label="Erase">⌫</button><button class="go" data-act="k-enter">Submit</button></div>`
  const pie = $('#pie')
  pie.style.transition = 'none'
  pie.style.strokeDashoffset = '0'
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      pie.style.transition = `stroke-dashoffset ${secs}s linear`
      pie.style.strokeDashoffset = '50.3'
    }),
  )
}

/* ---- small hooks the engine calls ---- */
function markChoice(v) {
  document
    .querySelectorAll('.cbtn')
    .forEach((b) => b.setAttribute('aria-pressed', same(cval(b.dataset.v), v)))
}
function showBuffer(buf) {
  const b = $('#buf')
  if (b) b.innerHTML = buf ? esc(Number(buf).toLocaleString()) : '&nbsp;'
}
function showHeard(tx) {
  const m = $('#heard')
  if (m) m.textContent = 'Heard: ' + tx
}
function showPracticeFeedback(ok, it, willRepeat) {
  $('#fb').innerHTML = ok
    ? '<div class="fb ok-fb">✓ Yes! That is right.</div>'
    : `<div class="fb no-fb">Not quite. The answer is <b>${esc(it.answer)}</b>.${willRepeat ? ' You will see this one again.' : ''}</div>`
  document.querySelectorAll('#ans button').forEach((b) => (b.disabled = true))
}
function playStartLights(done) {
  const L = ['red', 'yellow', 'green']
  let k = 0
  const step = () => {
    document
      .querySelectorAll(`.lights .${L[k]}`)
      .forEach((i) => i.classList.add('on'))
    k++
    if (k < 3) setTimeout(step, 700)
    else setTimeout(done, 600)
  }
  setTimeout(step, 300)
}

/* ---- skin/screens_stable.js ---- */
/* SKIN FILE. Owned by the skin (Codex). Change freely, but keep every contract in AGENTS.md. */
/* ================= Stable screens (student) ================= */
const K_SLOT_DEFAULT = 'blanket'
function renderNaming() {
  const st = stableOf(K.sid),
    s = studentOf(K.sid),
    kid = teacherOf(s.teacherId).grade === 'K'
  K.nd = K.nd || {
    a: NAME_A[hash(K.sid) % NAME_A.length],
    b: NAME_B[(hash(K.sid) >>> 4) % NAME_B.length],
  }
  const preview = `<div class="stall small">${racerOf(K.sid, { size: 220 })}</div>`
  const body = kid
    ? `<div class="tiles" style="margin-top:12px">${K_NAMES.map(([e, n]) => `<button class="tile" data-act="k-kname" data-n="${n}"><span class="big">${e}</span>${n}</button>`).join('')}</div>`
    : `<div class="namegrid"><div><h3>Pick a first word</h3><div class="chips">${NAME_A.map((w) => `<button class="chipbtn" data-act="k-na" data-w="${w}" aria-pressed="${K.nd.a === w}">${w}</button>`).join('')}</div></div>
        <div><h3>Pick a second word</h3><div class="chips">${NAME_B.map((w) => `<button class="chipbtn" data-act="k-nb" data-w="${w}" aria-pressed="${K.nd.b === w}">${w}</button>`).join('')}</div></div></div>
       <div class="plate" style="margin:14px auto">${esc(K.nd.a + ' ' + K.nd.b)}</div>
       <button class="kbtn green" data-act="k-name-ok">Use this name</button>
       <details style="margin-top:14px;text-align:left"><summary style="font:600 18px var(--kid);cursor:pointer">Or make up your own name</summary>
        <p class="note">Your teacher checks made-up names first. Until then, your racer uses the name above.</p>
        <div class="row"><input id="customname" class="in" maxlength="20" placeholder="Up to 20 letters" style="max-width:280px;font-size:18px"><button class="kbtn" style="font-size:18px;padding:8px 16px" data-act="k-name-custom">Send to my teacher</button></div></details>`
  $('#app').innerHTML =
    shell(`<div class="sign wide flow-card naming-card ${kid ? 'picture-naming' : 'word-naming'}"><span class="flow-kicker">THE STABLE • MAKE IT YOURS</span><h1>${st.name ? 'Rename' : 'Name'} your racer!</h1>${st.name ? `<p class="note">Renaming costs 3 horseshoes.</p>` : ''}<div class="naming-layout"><div class="naming-racer">${preview}<p class="note">Your racer. Your style.</p></div><div class="naming-options">${body}</div></div>
    ${st.name ? '<p style="margin-top:12px"><button class="linkish" data-act="k-stable">Keep my name</button></p>' : ''}</div>`)
}
function renderStable() {
  const st = stableOf(K.sid),
    w = wallet(K.sid),
    s = studentOf(K.sid),
    tier = TIERS[w.tier],
    next = TIERS[w.tier + 1],
    kind = st.ride || 'horse'
  const tab = K.stab || 'gear',
    slot = K.slot || K_SLOT_DEFAULT
  const prog = next
    ? clamp((w.earned - tier.at) / (next.at - tier.at), 0, 1)
    : 1
  const pending =
    st.nameStatus === 'pending'
      ? `<p class="note">“${esc(st.custom)}” is waiting for your teacher.</p>`
      : st.nameStatus === 'denied'
        ? `<p class="note">Your teacher asked for a different made-up name. <button class="linkish" data-act="k-rename">Try another</button></p>`
        : ''
  const left = `<div class="stable-display">${paddockRide(330, { still: true })}</div>
    <div class="plate ${w.marks.plate ? 'gold' : ''}">${esc(displayName(st))}</div>${pending}
    <div class="row" style="justify-content:center;gap:8px;margin-top:8px"><span class="tierbadge t${w.tier}">${tier.n}</span><button class="linkish" data-act="k-rename">Rename</button></div>`
  const marks = `<div class="marks">
    <div><span class="mk">🎀</span><b>${w.marks.ribbons}</b> practice ribbon${w.marks.ribbons === 1 ? '' : 's'}<div class="note">${5 - (w.practice % 5)} more practice session${5 - (w.practice % 5) === 1 ? '' : 's'} to the next one</div></div>
    <div><span class="mk">${w.marks.grit ? '⭐' : '☆'}</span>${w.marks.grit ? '<b>Grit star</b> for a comeback' : 'Grit star: come back after a tough week'}</div>
    <div><span class="mk">${w.marks.plate ? '🥇' : '🔒'}</span>${w.marks.plate ? '<b>Gold nameplate</b> for 4 Fridays on track' : 'Gold nameplate: 4 Fridays in a row on your growth line'}</div></div>`
  const wallet_ = `<div class="walletcard"><span class="club-kicker">YOUR HORSESHOE WALLET</span><div class="bal">${HS(40)}<b>${w.balance}</b><span>horseshoes</span></div>
    <div class="tierbar"><i style="width:${prog * 100}%"></i></div><div class="note">${next ? `${next.at - w.earned} more earned to reach <b>${next.n}</b>` : 'Top tier: Legend!'}</div>${marks}</div>`
  let panel = ''
  if (tab === 'gear') {
    const slots = SLOTS.filter(
      ([k]) =>
        k === 'ride' ||
        k === 'colors' ||
        GEAR.some((g) => g.slot === k && (!g.only || g.only.includes(kind))),
    )
    const chips = `<div class="chips">${slots.map(([k, l]) => `<button class="chipbtn" data-act="k-slot" data-s="${k}" aria-pressed="${slot === k}">${l}</button>`).join('')}</div>`
    let cards = ''
    if (slot === 'ride')
      cards = RIDES.map(
        (r) =>
          `<button class="gearcard ${st.ride === r.k ? 'on' : ''}" data-act="k-ride" data-r="${r.k}">${mascot(r.k, { silk: st.silk, coat: st.coat, gear: gearFor(st), size: 200, still: true })}<b>${r.name}</b><span class="note">${st.ride === r.k ? 'Riding' : 'Free'}</span></button>`,
      ).join('')
    else if (slot === 'colors')
      cards = `<div style="grid-column:1/-1"><h3>Racing silks</h3><div class="swatches">${SILKS.map((c) => `<button class="swatch" style="background:${c}" data-act="k-silk" data-c="${c}" aria-pressed="${st.silk === c}" aria-label="${SILK_NAMES[c]}"></button>`).join('')}</div>
      ${kind === 'horse' ? `<h3>Coat</h3><div class="swatches">${COATS.map((c) => `<button class="swatch" style="background:${c}" data-act="k-coat" data-c="${c}" aria-pressed="${st.coat === c}" aria-label="${COAT_NAMES[c]}"></button>`).join('')}</div>` : ''}</div>`
    else
      cards = GEAR.filter(
        (g) => g.slot === slot && (!g.only || g.only.includes(kind)),
      )
        .map((g) => {
          const eq =
              (st.equip[slot] ||
                GEAR.find((x) => x.slot === slot && x.cost === 0).id) === g.id,
            have = owns(st, g),
            locked = w.tier < g.tier
          const prevGear = { ...gearFor(st) }
          if (['blanket', 'helmet', 'mane', 'tail', 'wraps'].includes(slot))
            prevGear[slot] = g.v
          const pic =
            slot === 'trail'
              ? `<div class="trailbox"><span class="trail t-${g.v}"></span>${mascot(kind, { silk: st.silk, coat: st.coat, gear: gearFor(st), size: 110 })}</div>`
              : slot === 'victory'
                ? mascot(kind, {
                    silk: st.silk,
                    coat: st.coat,
                    gear: gearFor(st),
                    size: 120,
                    victory: g.v,
                    still: true,
                  })
                : gearCloseup(kind, st, prevGear, slot, g)
          const btn = eq
            ? '<span class="pill p-ok">Wearing</span>'
            : locked
              ? `<span class="pill p-none">🔒 ${TIERS[g.tier].n} tier</span>`
              : have
                ? `<span class="pill p-sky">Owned: tap to wear</span>`
                : w.balance >= g.cost
                  ? `<span class="buy">${HS(18)} ${g.cost}</span>`
                  : `<span class="pill p-none">${HS(14)} ${g.cost} · need ${g.cost - w.balance} more</span>`
          return `<button class="gearcard ${eq ? 'on' : ''} ${locked ? 'locked' : ''}" data-act="k-gear" data-g="${g.id}" ${locked ? 'disabled' : ''}>${pic}<b>${esc(g.name)}</b>${btn}</button>`
        })
        .join('')
    panel = chips + `<div class="gearcards">${cards}</div>`
  } else if (tab === 'trophies') {
    const ms = w.ev.filter(
        (e) => e.big && e.big !== 'grit' && e.big !== 'plate',
      ),
      pbs = w.ev.filter((e) => e.why === 'Personal best'),
      tiers = TIERS.slice(1).filter((t) => w.earned >= t.at)
    const card = (i, t, d) =>
      `<div class="trophy"><span>${i}</span><b>${esc(t)}</b><span class="note">${d ? fmtD(d) : ''}</span></div>`
    panel = `<div class="trophies">${
      [
        ...tiers.map((t) => card('🏅', t.n + ' tier', null)),
        ...ms.map((e) => card('🏆', e.why, e.d)),
        ...(w.marks.grit
          ? [card('⭐', 'Comeback star', w.ev.find((e) => e.big === 'grit').d)]
          : []),
        ...pbs
          .slice(-6)
          .reverse()
          .map((e) => card('🎆', 'Personal best', e.d)),
      ].join('') || '<p>Race on Friday to start your trophy case!</p>'
    }</div>`
  } else {
    panel = `<table class="earned"><tbody>${
      w.ev
        .slice(-14)
        .reverse()
        .map(
          (e) =>
            `<tr><td class="note">${fmtD(e.d)}</td><td>${esc(e.why)}</td><td class="num">${e.n ? '+' + e.n + ' ' + HS(14) : ''}</td></tr>`,
        )
        .join('') ||
      '<tr><td>No horseshoes yet. Race on Friday or practice to earn some!</td></tr>'
    }</tbody></table>
     <p class="note">Horseshoes come from showing up, practicing, beating your own score, staying on your growth line, and explaining your thinking. Never from beating classmates.</p>`
  }
  $('#app').innerHTML = clubShell(
    'MY STABLE',
    `<div class="club-card stablecard" data-stable-tab="${tab}"><div class="spread stable-heading"><h2>${esc(s.name.split(' ')[0])}'s stable</h2><div class="row"><button class="kbtn alt" data-act="k-practice">🎯 Practice</button><button class="kbtn green" data-act="k-gate">Starting gate</button></div></div>
    <div class="stable-grid"><div>${left}</div><div>${wallet_}</div></div>
    <div class="chips tabs2">${[
      ['gear', 'Gear'],
      ['trophies', 'Trophy case'],
      ['earned', 'How I earned'],
    ]
      .map(
        ([k, l]) =>
          `<button class="chipbtn big" data-act="k-stab" data-t="${k}" aria-pressed="${tab === k}">${l}</button>`,
      )
      .join('')}</div>
    <section class="stable-shop" ${tab === 'earned' ? 'tabindex="0"' : ''} aria-label="${tab === 'gear' ? 'Gear shop' : tab === 'trophies' ? 'Trophy case' : 'Horseshoe earnings'}">${panel}</section></div>`,
    'stable-stage',
  )
}

/* Zoom the actual layered racer art; keep the equipped pattern faithful to the shop item. */
function gearCloseup(kind, st, gear, slot, g) {
  const crops = {
    blanket:
      kind === 'moto'
        ? '90 43 52 34'
        : kind === 'tiger'
          ? '72 29 42 37'
          : '57 31 49 40',
    helmet: kind === 'tiger' ? '136 23 39 30' : '112 0 46 32',
    mane: '99 32 65 42',
    tail: '-5 36 62 55',
    wraps: '42 67 107 42',
  }
  const art = mascot(kind, {
    silk: st.silk,
    coat: st.coat,
    gear,
    size: 220,
    still: true,
  })
    .replace(
      'viewBox="-10 -12 200 130"',
      `viewBox="${crops[slot] || '-10 -12 200 130'}"`,
    )
    .replace(
      'aria-label="' + (kind === 'moto' ? 'motorbike' : kind) + ' racer"',
      `aria-label="${esc(g.name)} close-up on your racer"`,
    )
  return `<div class="gear-closeup">${art}<span>DETAIL VIEW</span></div>`
}

/* ---- engine/08_dashboards_shared.js ---- */
/* ENGINE FILE. Owned by the engine (Claude). Codex: do not edit. Request changes in REQUESTS.md. */
/* Teacher and district views. Their look comes from skin/theme.css; their HTML stays engine-owned. */
/* ================= charts ================= */
function lineChart({
  series,
  yMax,
  goal,
  notes,
  h = 260,
  W = 760,
  xs = FRIDAYS,
  label = 'Correct',
  goalLabel = 'Goal',
}) {
  const H = h,
    L = 40,
    R = 16,
    T = 14,
    B = 34,
    n = Math.max(2, xs.length)
  const X = (i) => L + ((W - L - R) * i) / (n - 1),
    Y = (v) => T + (H - T - B) * (1 - v / yMax)
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(label)} by Friday">`
  const step = yMax <= 10 ? 2 : yMax <= 20 ? 5 : yMax <= 40 ? 10 : 25
  for (let v = 0; v <= yMax; v += step) {
    s += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`
  }
  const every = Math.ceil(xs.length / 9)
  xs.forEach((w, i) => {
    if (i % every === 0 || i === xs.length - 1)
      s += `<text x="${X(i)}" y="${H - 12}" text-anchor="middle">${fmtD(w)}</text>`
    if (notes && notes[w])
      s += `<g><title>${esc(fmtD(w))}: ${esc(notes[w])}</title><rect x="${X(i) - 7}" y="${H - B + 4}" width="14" height="10" rx="2" fill="var(--gold)" stroke="#000" stroke-width=".8"/></g>`
  })
  if (goal != null)
    s += `<line x1="${L}" x2="${W - R}" y1="${Y(goal)}" y2="${Y(goal)}" stroke="var(--ok)" stroke-width="2" stroke-dasharray="2 4"/><text x="${W - R}" y="${Y(goal) - 6}" text-anchor="end" style="fill:var(--ok);font-weight:700">${goalLabel} ${goal}</text>`
  series.forEach((se) => {
    const pts = se.points.filter((p) => p.y != null)
    if (!pts.length) return
    s += `<polyline fill="none" stroke="${se.color}" stroke-width="${se.width || 2.5}" ${se.dash ? `stroke-dasharray="${se.dash}"` : ''} points="${pts.map((p) => X(p.x) + ',' + Y(p.y)).join(' ')}"/>`
    if (se.dots !== false)
      pts.forEach(
        (p) =>
          (s += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="4.5" fill="${se.color}" stroke="var(--card)" stroke-width="1.5"><title>${fmtD(xs[p.x] || '')}: ${r1(p.y)}</title></circle>`),
      )
  })
  return s + '</svg>'
}
function legend(items) {
  return `<div class="legend">${items.map(([c, t, d]) => `<span><i style="background:${d ? `repeating-linear-gradient(90deg,${c} 0 4px,transparent 4px 7px)` : c}"></i>${esc(t)}</span>`).join('')}</div>`
}
function iconToggle() {
  return `<div class="row noprint" style="gap:6px;align-items:center"><span class="note">Racers</span>${[
    ['horse', 'Horses'],
    ['moto', 'Motorbikes'],
  ]
    .map(
      ([k, l]) =>
        `<button class="btn ${S.icon === k ? 'gold' : 'ghost'}" style="padding:2px 12px 2px 6px;display:inline-flex;align-items:center;gap:4px" data-act="icon" data-i="${k}">${mascot(k, { size: 40, still: true, silk: k === 'moto' ? SILKS[2] : SILKS[0] })}${l}</button>`,
    )
    .join('')}</div>`
}
function derby(entries, { icon = S.icon } = {}) {
  // entries: [{label, frac(0..1), shown, ghost}]; every lane gets its own silks and coat
  const kind = RIDE_KIND[icon] || 'horse'
  return `<div class="track" role="img" aria-label="Race standings">${[0.25, 0.5, 0.75].map((f) => `<span class="post" style="left:calc(170px + (100% - 270px)*${f})"></span>`).join('')}<span class="finish"></span>
  ${entries.map((e, i) => `<div class="lane"><span class="who" title="${esc(e.label)}">${esc(e.label)}</span><span class="runner" data-to="${e.frac ?? 0}" style="left:170px">${mascot(e.ghost ? 'horse' : kind, { silk: e.ghost ? '#9AA3A8' : SILKS[i % SILKS.length], coat: COATS[(i * 3 + 1) % COATS.length], num: e.ghost ? '' : i + 1, size: 96, ghost: e.ghost })}</span><span class="pct">${e.shown ?? ''}</span></div>`).join('')}</div>`
}
function animateDerby(root = document) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() =>
      root.querySelectorAll('.track .runner').forEach((r) => {
        r.style.left = `calc(170px + (100% - 270px)*${clamp(+r.dataset.to, 0, 1)})`
      }),
    ),
  )
}
function toast(msg) {
  const t = document.createElement('div')
  t.className = 'toast'
  t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 2400)
}
function modal(html) {
  const l = $('#layer')
  l.innerHTML = `<div class="modal-bg" data-act="close-modal"><div class="modal" role="dialog" aria-modal="true">${html}<div style="margin-top:16px;text-align:right"><button class="btn ghost" data-act="close-modal">Close</button></div></div></div>`
}
const arrow = (v) =>
  v == null
    ? '<span class="flat">–</span>'
    : v > 0.05
      ? `<span class="up">▲ ${r1(v)}</span>`
      : v < -0.05
        ? `<span class="down">▼ ${r1(Math.abs(v))}</span>`
        : '<span class="flat">● 0</span>'
const arrowTbl = (v) =>
  v == null
    ? '–'
    : v > 0.05
      ? `<b style="color:var(--ok)">+${r1(v)}</b>`
      : v < -0.05
        ? `<b style="color:var(--bad)">−${r1(Math.abs(v))}</b>`
        : '0'

/* ================= app state + masthead ================= */
const S = {
  icon: 'horse',
  view: 'teacher',
  tid: null,
  tab: 'friday',
  week: null,
  sid: null,
  pid: null,
  month: null,
  dtab: 'overview',
  dgrade: 'all',
  anon: false,
}
const PARAMS = {}
function renderMast() {
  const canSwitch = !SERVER || DB.role === 'district'
  if (PILOT) {
    const many = DB.teachers.length > 1
    $('#mast').innerHTML =
      `<div class="wrap"><div class="brand"><b>Tiger Downs</b><span>Math fluency races, ${esc(SETTINGS.school)}</span></div>
     <span class="demo-flag" title="Everything is saved on this device only.">PILOT · THIS DEVICE ONLY</span>
     ${S.view === 'teacher' && many ? `<select aria-label="Choose a class" data-act="pick-teacher">${DB.teachers.map((t) => `<option value="${t.id}" ${t.id === S.tid ? 'selected' : ''}>${esc(t.name)} (${t.classCode})</option>`).join('')}</select>` : ''}
     ${
       S.view === 'setup'
         ? ''
         : `<div class="roles" role="group" aria-label="View">${[
             ['student', 'Student'],
             ['teacher', 'Teacher'],
           ]
             .map(
               ([k, l]) =>
                 `<button data-act="view" data-v="${k}" aria-pressed="${S.view === k}">${l}</button>`,
             )
             .join('')}</div>`
     }</div>`
    return
  }
  const tsel =
    S.view === 'teacher' && (!SERVER || DB.role === 'district')
      ? `<select aria-label="Choose a teacher" data-act="pick-teacher">${GRADES.map(
          (g) =>
            `<optgroup label="${gradeName(g)}">${DB.teachers
              .filter((t) => t.grade === g)
              .map(
                (t) =>
                  `<option value="${t.id}" ${t.id === S.tid ? 'selected' : ''}>${esc(t.name)} (${t.classCode})</option>`,
              )
              .join('')}</optgroup>`,
        ).join('')}</select>`
      : ''
  $('#mast').innerHTML =
    `<div class="wrap"><div class="brand"><b>Tiger Downs</b><span>Math fluency races, ${esc(SETTINGS.school)}</span></div>
   ${!SERVER ? '<span class="demo-flag" title="Demo data. Your actions save in this browser only.">DEMO</span>' : ''}
   ${tsel}
   ${
     canSwitch
       ? `<div class="roles" role="group" aria-label="View">${[
           ['student', 'Student'],
           ['teacher', 'Teacher'],
           ['district', 'District'],
         ]
           .map(
             ([k, l]) =>
               `<button data-act="view" data-v="${k}" aria-pressed="${S.view === k}">${l}</button>`,
           )
           .join('')}</div>`
       : ''
   }</div>`
  $('#mast').style.display = S.view === 'student' && SERVER ? 'none' : ''
  $('#rail').style.display = $('#mast').style.display
}

/* ---- engine/09_teacher.js ---- */
/* ENGINE FILE. Owned by the engine (Claude). Codex: do not edit. Request changes in REQUESTS.md. */
/* ================= teacher dashboard ================= */
const MOVES = {
  'Quantities 1-5':
    'Quick looks with dot cards and five-frames; name the amount without counting.',
  'Quantities 6-10':
    'Ten-frame flashes: 5 and some more. Ask, "How did you see it?"',
  'Ten and 0-4':
    'Two ten-frames: say "ten and ___" before naming the teen number.',
  'Ten and 5-9': 'Build teens on a rekenrek: ten and some more.',
  'Count forward':
    'Choral counting from any number; stop and ask what comes next.',
  'Count back':
    'Count back from 20 with a number path; launch-style countdowns.',
  'Put together': 'Story mats with counters; act out joining stories.',
  'Take apart': 'Take-from stories with cubes; cover and remove.',
  'Count on 1-2': 'Start with the bigger number and count on.',
  Doubles: 'Doubles pictures and mirror games.',
  'Near doubles': 'Doubles plus or minus one number strings.',
  'Make 10': 'Ten-frame partners of 10; "What goes with 7 to make 10?"',
  'Bridge 10': 'Make-10 strategy: 8 + 5 is 8 + 2 + 3.',
  'Other within 10': 'Part-part-whole mats and number bonds.',
  'Count back 1-2': 'Count back on a number line.',
  'Think addition': 'Think addition: 9 − 4, what plus 4 makes 9?',
  'From 10': 'Partners of 10 reversed.',
  '−0 / −all': 'Talk through zero and same-number rules.',
  'Teens, no bridge': 'Subtract from the ones: 17 − 4, take 4 from 7.',
  '10 more': 'Hundred chart moves down one row.',
  '10 less': 'Hundred chart moves up one row.',
  'Add tens': 'Count by tens; 3 tens and 4 tens.',
  'Subtract tens': 'Base-ten rods: remove tens.',
  '0s': 'Groups of zero: 5 groups of nothing.',
  '1s': 'Identity property talk.',
  '2s': 'Doubles.',
  '3s': 'Double plus one more group.',
  '4s': 'Double the double.',
  '5s': 'Clock and nickel counting.',
  '6s': 'Break apart: 5 groups plus 1 more group.',
  '7s': 'Break apart: 5 groups plus 2 groups.',
  '8s': 'Double, double, double.',
  '9s': 'Use 10s and take one group away.',
  '10s': 'Place value: ten groups.',
  '11s': 'Break apart 10 + 1.',
  '12s': 'Break apart 10 + 2.',
  '× tens': 'Place value: 4 × 30 is 4 × 3 tens.',
  'Add with regrouping':
    'Place value disks to show the trade before the algorithm.',
  'Subtract with regrouping':
    'Decompose a ten (or hundred) with base-ten blocks; regrouping across zeros.',
  'Add, no regrouping': 'Mental place-value addition.',
  'Subtract, no regrouping': 'Mental place-value subtraction.',
  '3-digit × 2-digit': 'Area model, then partial products, then the algorithm.',
  '2-digit × 2-digit': 'Area model to partial products.',
  '1-digit divisor': 'Partial quotients with friendly multiples.',
  'One more': 'Number path: put a finger on the number and step forward one.',
  'One less': 'Number path: step back one; stair-step cubes.',
  'Numerals 0-10': 'Numeral cards with matching dot cards; trace and say.',
  'Numerals 11-20':
    'Teen numbers on ten-frame cards: say "ten and ___" then the numeral.',
  'Which has more':
    'Line the two groups up one-to-one and see which has extras.',
  'Which has fewer':
    'Match one-to-one; the group that runs out first has fewer.',
  'Count forward': 'Choral count from any number; stop and predict the next.',
  'Cross a decade':
    'Hundred chart: what happens after 39? Point to the next row.',
  'Past 100': 'Extend the hundred chart to 120 and count across 100.',
  'Count back': 'Count back on a number line or hundred chart.',
  'Different tens': 'Compare tens first with base-ten rods.',
  'Same tens': 'Same tens? Compare the ones.',
  Equal: 'Talk about what = means: the same value on both sides.',
  'Missing addend within 10':
    'Number bonds: the whole and one part, find the other part.',
  'Missing addend, teens': 'Count up through 10: 8 + 2 is 10, then 3 more.',
  'Missing first addend':
    'Turn it around: ? + 5 = 12 is the same as 5 + ? = 12.',
  'Missing part in subtraction': 'Think addition: 15 − ? = 9 means 9 + ? = 15.',
  'Number first': 'Read the equal sign as "is the same as."',
  'Both sides': 'Balance scale: work out each side, then compare.',
  'Standard form': 'Solve, then check the given answer.',
  'Forward across a hundred': 'Base-ten blocks: 10 tens make the next hundred.',
  'Forward across a ten': 'Hundred chart moves to the next row after a 9.',
  'Backward across a hundred': 'Unbundle a hundred into tens.',
  'Backward across a ten': 'Unbundle a ten to count back.',
  'Different hundreds': 'Compare hundreds first.',
  'Same hundreds': 'Same hundreds? Compare the tens, then ones.',
  'Reversed or close digits':
    'Read both numbers aloud; check the tens place first.',
  'Even to 10': 'Pair objects up: everyone has a partner means even.',
  'Odd to 10': 'Pair objects up: one left over means odd.',
  'Even 11-20': 'Build with cubes in two rows.',
  'Odd 11-20': 'Two equal rows plus one left over.',
  'Arrays to 10': 'Count by rows: skip count the rows.',
  'Arrays 12-16': 'Skip count by the row size.',
  'Arrays 18-25': 'Repeated addition by rows: 5 + 5 + 5 + 5.',
  'Nearest 10': 'Number line: which ten is it closer to?',
  'Nearest 10, ones digit 5': 'Teach the halfway rule: 5 rounds up.',
  'Nearest 100': 'Number line between two hundreds.',
  'Nearest 100, tens digit 5': 'Halfway is 50: round up.',
  'Up into the next hundred':
    '296 to the nearest 10 is 300: the tens roll over.',
  'Different number of digits': 'More digits means a greater whole number.',
  'Different thousands': 'Compare the thousands place first.',
  'Different tens or ones': 'Line up the places and compare left to right.',
  'Known factor 2-5': 'Think multiplication: 4 × ? = 28.',
  'Known factor 6-9': 'Use a known fact: 6 × 8 is 5 × 8 plus 8.',
  'Prime under 20':
    'Build rectangles with tiles: only one rectangle means prime.',
  'Prime 20-100': 'Test small divisors: 2, 3, 5, 7.',
  'Composite, even': 'Every even number past 2 is composite.',
  'Composite, odd': 'Check 3, 7, and 9 patterns: 51 = 3 × 17, 91 = 7 × 13.',
  'Nearest 1,000': 'Number line between two thousands.',
  'Nearest 10,000': 'Underline the place, look one place right.',
  'Nearest 100,000': 'Underline the place, look one place right.',
  'Across a place': '9,960 to the nearest 100 is 10,000: the places roll over.',
  'Tenths vs hundredths': 'Rewrite 0.5 as 0.50 before comparing.',
  'Same tenths': 'Same tenths? Compare hundredths.',
  'Different tenths': 'Compare tenths first, on a hundredths grid.',
  'Equal (0.5 and 0.50)': 'Shade 0.5 and 0.50 on grids: same amount.',
  'Different ones': 'Compare the whole number first.',
  '2-digit divisor':
    'Make a multiples list of the divisor first; estimate with compatible numbers.',
}
const moveFor = (k) =>
  MOVES[k] ||
  (k.startsWith('÷')
    ? `Use the related multiplication fact: think ${k.slice(1)} × ? .`
    : 'Small-group strategy instruction on this fact set.')

function probesForClass(t) {
  const used = new Set(
    DB.attempts
      .filter((a) => studentOf(a.sid)?.teacherId === t.id)
      .map((a) => a.pid),
  )
  used.add(t.probeId)
  rosterOf(t.id).forEach((s) => used.add(effPid(s)))
  return PROBES.filter((p) => used.has(p.id))
}
function teacherTabs() {
  const tabs = [
    ['friday', 'Friday check'],
    ['race', 'Monthly race'],
    ['students', 'Class roster'],
    ['student', 'Student report'],
    ['skills', 'Skills and next moves'],
    ['flex', 'Flexibility checks'],
    ['rewards', 'Stables and rewards'],
    ['assign', PILOT ? 'Class race' : 'Assign in Classroom'],
  ]
  if (PILOT) tabs.push(['pilot', 'Pilot data'])
  return `<nav class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${S.tab === k}" data-act="tab" data-t="${k}">${l}</button>`).join('')}</nav>`
}
function renderTeacher() {
  document.body.className = ''
  const t = teacherOf(S.tid)
  if (!t) {
    $('#app').innerHTML =
      '<div class="wrap"><p>No class found for this account. Ask the district math lead to add you to the Teachers tab.</p></div>'
    return
  }
  if (!S.pid || !probesForClass(t).some((p) => p.id === S.pid))
    S.pid = t.probeId
  if (
    S.tab === 'student' &&
    S.sid &&
    studentOf(S.sid) &&
    !weeklyPoints(S.sid, S.pid).length
  )
    S.pid = effPid(studentOf(S.sid))
  const p = PR[S.pid]
  const probeSel = `<select class="in" style="width:auto" data-act="pick-probe" aria-label="Skill set">${probesForClass(
    t,
  )
    .map(
      (x) =>
        `<option value="${x.id}" ${x.id === S.pid ? 'selected' : ''}>${esc(x.label)} (${esc(x.std)})${x.id === t.probeId ? ' (class race)' : ' (individual)'}</option>`,
    )
    .join('')}</select>`
  let body = ''
  if (S.tab === 'friday') body = tFriday(t, p)
  else if (S.tab === 'race') body = tRace(t, p)
  else if (S.tab === 'students') body = tRoster(t, p)
  else if (S.tab === 'student') body = tStudent(t, p)
  else if (S.tab === 'skills') body = tSkills(t, p)
  else if (S.tab === 'flex') body = tFlex(t, p)
  else if (S.tab === 'rewards') body = tRewards(t)
  else if (S.tab === 'pilot') body = tPilot(t)
  else body = tAssign(t, p)
  $('#app').innerHTML =
    `<div class="wrap" style="padding-bottom:40px"><div class="spread" style="margin-top:22px"><div><h1>${esc(t.name)}, ${gradeName(t.grade)}</h1><p class="sub">Class code ${esc(t.classCode)}. ${rosterOf(t.id).length} students. ${TYPE_LABEL[p.type]}: ${esc(p.std)}. Goal: ${goalOf(p)} of ${p.items} correct (${Math.round(goalPct(p) * 100)}%) by ${fmtD(SETTINGS.goalDate)}.</p></div>${!['assign', 'flex', 'rewards', 'pilot'].includes(S.tab) ? probeSel : ''}</div>${teacherTabs()}${body}</div>`
  animateDerby()
}
function weeksWithData(tid, pid) {
  return FRIDAYS.filter((w) => classWeek(tid, pid, w).tested > 0)
}
function tFriday(t, p) {
  const wk = weeksWithData(t.id, p.id)
  if (!wk.length) return emptyState(t)
  if (!S.week || !wk.includes(S.week)) S.week = wk[wk.length - 1]
  const i = wk.indexOf(S.week),
    cw = classWeek(t.id, p.id, S.week),
    pw = i > 0 ? classWeek(t.id, p.id, wk[i - 1]) : null
  const cs = classSummary(t.id, p.id),
    notes = DB.notes[t.id] || {}
  const ser = FRIDAYS.map((w, x) => ({ x, y: classWeek(t.id, p.id, w).median }))
  const bench = FRIDAYS.map((w, x) => ({ x, y: benchMedian(t.grade, p.id, w) }))
  const rows = cs.sums.map((x) => {
    const q = x.pts.find((z) => z.w === S.week),
      qi = x.pts.indexOf(q),
      pv = qi > 0 ? x.pts[qi - 1] : null
    return { ...x, q, ch: q && pv ? q.y - pv.y : null }
  })
  const order = { change: 0, keep: 1, none: 2, on: 3, raise: 4 }
  rows.sort(
    (a, b) =>
      order[a.decision.k] - order[b.decision.k] ||
      a.s.name.localeCompare(b.s.name),
  )
  const absent = rows.filter((r) => !r.q).map((r) => r.s.name.split(' ')[0])
  const medDelta =
    pw && cw.median != null && pw.median != null ? cw.median - pw.median : null
  const story = `${cw.improved} of ${cw.tested} students who raced moved up from their last race${cw.dropped ? `, ${cw.dropped} dropped` : ''}. The class median ${medDelta == null ? 'is' : medDelta > 0 ? 'rose to' : medDelta < 0 ? 'fell to' : 'held at'} ${r1(cw.median)} of ${p.items}. ${cs.change ? `<b>${cs.change} student${cs.change > 1 ? 's have' : ' has'} four straight Fridays under the aimline.</b> More of the same instruction will not close their gap; change the instructional move for that group.` : 'No student has four straight Fridays under the aimline.'}`
  return `<div class="stack">
   <div class="row" style="align-items:center"><label class="f" for="wk" style="margin:0">Friday</label><select id="wk" class="in" style="width:auto" data-act="pick-week">${[
     ...wk,
   ]
     .reverse()
     .map(
       (w) =>
         `<option value="${w}" ${w === S.week ? 'selected' : ''}>${fmtD(w)}</option>`,
     )
     .join('')}</select></div>
   <div class="tote">
    <div><div class="n">${cw.tested}<small>/ ${cw.n}</small></div><div class="l">Raced this Friday</div><div class="d">${absent.length ? esc(absent.slice(0, 4).join(', ')) + (absent.length > 4 ? ' +' + (absent.length - 4) : '') : 'Everyone raced'}</div></div>
    <div><div class="n">${r1(cw.median)}<small>/ ${p.items}</small></div><div class="l">Class median correct</div><div class="d">${arrow(medDelta)} vs last Friday</div></div>
    <div><div class="n">${pct(cw.atGoal)}</div><div class="l">At goal (${goalOf(p)}+)</div><div class="d">${pw ? arrow(cw.atGoal != null && pw.atGoal != null ? (cw.atGoal - pw.atGoal) * 100 : null) + ' pts' : ''}</div></div>
    <div><div class="n">${r1(cs.slope)}</div><div class="l">Median growth per week</div><div class="d">Correct answers gained each Friday</div></div>
    <div><div class="n" style="color:${cs.change ? '#ff9a8d' : 'var(--gold)'}">${cs.change}</div><div class="l">Need an instruction change</div><div class="d">4 Fridays under aimline</div></div>
   </div>
   <div class="callout">${story}</div>
   ${(() => {
     const own = rosterOf(t.id).filter(
       (s) => s.probeId && s.probeId !== p.id,
     ).length
     return own && p.id === t.probeId
       ? `<p class="note" style="margin:0">${own} student${own > 1 ? 's run their own race' : ' runs an individual race'}. Choose it in the skill set menu above to see their progress.</p>`
       : ''
   })()}
   <div class="grid2">
    <div class="panel"><h3>Is instruction moving the class forward?</h3>${lineChart(
      {
        series: [
          { color: 'var(--turf)', points: ser },
          { color: 'var(--clay)', dash: '6 5', points: bench, dots: false },
        ],
        yMax: p.items,
        goal: goalOf(p),
        notes,
      },
    )}
     ${legend([
       ['var(--turf)', 'Class median'],
       ['var(--clay)', gradeName(t.grade) + ' median, all TGES classes', 1],
       ['var(--ok)', 'Goal', 1],
     ])}<p class="note">Gold tabs on the timeline mark weeks with an instruction note. Hover a tab to read it.</p></div>
    <div class="panel"><h3>What we taught the week of ${fmtD(S.week)}</h3><p class="note">Name the strategy or routine. This is what lets you and the district connect Friday growth to instruction.</p>
     <textarea id="note" class="in" rows="4" placeholder="Example: Make-10 number strings daily, small group on doubles plus one">${esc(notes[S.week] || '')}</textarea>
     <p><button class="btn" data-act="save-note">Save note</button></p>
     <div class="note">${Object.keys(notes)
       .sort()
       .reverse()
       .slice(0, 4)
       .map((w) => `<div><b>${fmtD(w)}</b>: ${esc(notes[w])}</div>`)
       .join('')}</div></div>
   </div>
   <div class="panel"><h3>Every student, this Friday</h3><div class="tbl-wrap"><table><thead><tr><th>Student</th><th class="num">Score</th><th class="num">Change</th><th>Level</th><th class="num">Growth / wk</th><th>Decision</th></tr></thead><tbody>
    ${rows.map((r) => `<tr class="click" data-act="open-student" data-s="${r.s.id}"><td>${esc(r.s.name)}</td><td class="num">${r.q ? r.q.y + (r.q.a.accom ? '<sup title="Extended time">*</sup>' : '') : '<span class="note">absent</span>'}</td><td class="num">${arrowTbl(r.ch)}</td><td><span class="pill ${tierOf(r.q?.y, p).cls}">${tierOf(r.q?.y, p).label}</span></td><td class="num">${r1(r.slope)}</td><td><span class="pill ${r.decision.cls}" title="${esc(r.decision.why)}">${r.decision.label}</span></td></tr>`).join('')}
   </tbody></table></div><p class="note">* Raced with extended time. Accommodated races count for the student and the class but are left out of the grade-level comparison line. Decision rule: after 3 baseline Fridays, 4 points in a row under the aimline means change instruction; 4 at or above means stay the course.</p></div>
  </div>`
}
function emptyState(t) {
  return `<div class="panel"><h2>No races yet for this skill set</h2><p>Post the race link in Google Classroom and have students run it this Friday.</p><button class="btn" data-act="tab" data-t="assign">Set up the Friday race</button></div>`
}
function tRace(t, p) {
  const ms = months()
  if (!S.month || !ms.includes(S.month)) S.month = ms[ms.length - 1]
  const end = monthEnd(S.month),
    cs = classSummary(t.id, p.id),
    cm = classMonth(t.id, S.month)
  const elapsed = clamp(
    weeksBetween(FRIDAYS[0], end) /
      Math.max(1, weeksBetween(FRIDAYS[0], fridayOf(SETTINGS.goalDate))),
    0,
    1,
  )
  const mWeeks = FRIDAYS.filter((w) => monthKey(w) === S.month)
  const rows = cs.sums
    .map((x) => {
      const inM = x.pts.filter((q) => mWeeks.includes(q.w))
      const before = x.pts.filter((q) => q.w < mWeeks[0]).pop()
      const startV = before ? before.y : inM[0]?.y
      const endV = inM[inM.length - 1]?.y
      return {
        ...x,
        frac: progressFrac(x, end),
        startV,
        endV,
        gain: startV != null && endV != null ? endV - startV : null,
        races: inM.length,
      }
    })
    .sort((a, b) => (b.frac ?? -1) - (a.frac ?? -1))
  const lanes = S.anon
    ? [
        { label: 'Our class', frac: cm.distance, shown: pct(cm.distance) },
        { label: 'Goal pace', frac: elapsed, shown: pct(elapsed), ghost: true },
      ]
    : rows.map((r) => ({
        label: r.s.name,
        frac: r.frac ?? 0,
        shown: r.frac == null ? '–' : pct(r.frac),
      }))
  return `<div class="stack">
   <div class="spread"><div class="row" style="align-items:center"><label class="f" style="margin:0" for="mo">Month</label><select id="mo" class="in" style="width:auto" data-act="pick-month">${ms.map((m) => `<option value="${m}" ${m === S.month ? 'selected' : ''}>${monthName(m)}</option>`).join('')}</select></div>
    ${iconToggle()}<label class="row" style="align-items:center;gap:8px;font-weight:600"><input type="checkbox" data-act="anon" ${S.anon ? 'checked' : ''}> Projector mode (hide names)</label></div>
   <div class="panel"><h2>${monthName(S.month)} race</h2><p class="sub">Each runner's distance is how far that student has closed the gap between their baseline and the goal. Students race their own starting line, so a student who began far behind can still lead the field.</p>
    <div style="margin-top:14px">${derby(lanes)}</div>
    <div class="tote" style="margin-top:14px"><div><div class="n">${pct(cm.distance)}</div><div class="l">Class distance to goal</div></div><div><div class="n">${cm.gain == null ? '–' : (cm.gain >= 0 ? '+' : '−') + Math.abs(Math.round(cm.gain * 100))}</div><div class="l">Points of distance gained this month</div></div><div><div class="n">${pct(elapsed)}</div><div class="l">Goal pace (time elapsed)</div></div><div><div class="n">${pct(cm.participation)}</div><div class="l">Friday participation</div></div></div>
   </div>
   ${
     S.anon
       ? ''
       : `<div class="panel"><h3>Monthly report: ${monthName(S.month)}</h3><div class="tbl-wrap"><table><thead><tr><th>Student</th><th class="num">Start of month</th><th class="num">End of month</th><th class="num">Gain</th><th class="num">Distance</th><th class="num">Races</th><th>Decision</th></tr></thead><tbody>
   ${rows.map((r) => `<tr class="click" data-act="open-student" data-s="${r.s.id}"><td>${esc(r.s.name)}</td><td class="num">${r.startV ?? '–'}</td><td class="num">${r.endV ?? '–'}</td><td class="num">${arrowTbl(r.gain)}</td><td class="num">${pct(r.frac)}</td><td class="num">${r.races}/${mWeeks.length}</td><td><span class="pill ${r.decision.cls}">${r.decision.label}</span></td></tr>`).join('')}</tbody></table></div></div>`
   }
  </div>`
}
function tRoster(t, p) {
  const cs = classSummary(t.id, p.id),
    wk = iso(new Date(Date.now() - 7 * 864e5)),
    m = monthKey(todayIso())
  return `<div class="stack"><div class="panel"><div class="spread"><h3>Class roster: ${esc(p.label)}</h3><button class="btn ghost" data-act="export">Export race data (CSV)</button></div>
   <div class="tbl-wrap"><table><thead><tr><th>Student</th><th>Race</th><th class="num">Baseline</th><th class="num">Latest</th><th class="num">Growth / wk</th><th>Level</th><th>Decision</th><th class="num">Practice, 7 days</th><th>Flexibility</th><th>Supports</th><th></th></tr></thead><tbody>
   ${cs.sums
     .map((x) => {
       const pr = practiceFor(x.s.id, wk),
         fl = flexFor(x.s.id).pop()
       return `<tr><td class="click" data-act="open-student" data-s="${x.s.id}" style="cursor:pointer;text-decoration:underline;white-space:nowrap">${esc(x.s.name)}</td><td>${x.s.probeId && x.s.probeId !== t.probeId ? `<span class="pill p-sky" title="${esc(PR[x.s.probeId].label)}">Own: ${esc(PR[x.s.probeId].std.split(',')[0])}</span>` : '<span class="note">Class</span>'}</td><td class="num">${x.base ?? '–'}</td><td class="num">${x.last?.y ?? '–'}</td><td class="num">${r1(x.slope)}</td><td><span class="pill ${x.tier.cls}">${x.tier.label}</span></td><td><span class="pill ${x.decision.cls}">${x.decision.label}</span></td><td class="num">${pr.length ? pr.length + ' (' + Math.round(pr.reduce((a, q) => a + q.secs, 0) / 60) + ' min)' : '–'}</td><td>${fl ? `<span class="lvl l${fl.level}">${fl.level}</span> <span class="note nowrap">${FLEX[fl.level - 1].short}</span>` : '<span class="note">not checked</span>'}</td><td class="note">${esc(accomLabel(x.s.accom))}</td><td><button class="btn ghost" style="padding:3px 10px" data-act="edit-student" data-s="${x.s.id}">Settings</button></td></tr>`
     })
     .join('')}
   </tbody></table></div><p class="note">Students on an individual race appear here when that race is chosen in the skill set menu. Practice never changes Friday scores.</p></div>
   <div class="panel"><h3>Add students</h3><p class="note">Paste one name per line, for example from your Google Classroom People page.</p><textarea id="newnames" class="in" rows="4" placeholder="Jordan Smith"></textarea><p><button class="btn" data-act="add-students">Add to roster</button></p></div></div>`
}
function probeOptions(grade, sel, { classOpt } = {}) {
  const lower = GRADES.slice(0, GRADES.indexOf(grade) + 1).reverse()
  return (
    (classOpt ? `<option value="">Class race</option>` : '') +
    lower
      .map(
        (g) =>
          `<optgroup label="${gradeName(g)}${g !== grade ? ' (below grade)' : ''}">${PROBES.filter(
            (x) => x.grade === g,
          )
            .map(
              (x) =>
                `<option value="${x.id}" ${x.id === sel ? 'selected' : ''}>${esc(x.label)} (${esc(x.std)}) · ${TYPE_LABEL[x.type]}</option>`,
            )
            .join('')}</optgroup>`,
      )
      .join('')
  )
}
function studentModal(sid) {
  const s = studentOf(sid),
    t = teacherOf(s.teacherId),
    a = s.accom || {}
  modal(`<h2>${esc(s.name)}: settings</h2>
   <div class="stack" style="margin-top:12px">
    <div><label class="f" for="sm-race">Race</label><select id="sm-race" class="in">${probeOptions(t.grade, s.probeId, { classOpt: true })}</select>
     <p class="note">Class race is ${esc(PR[t.probeId].label)}. Pick an individual race for intervention. Changing it starts a new progress line; earlier races stay in history.</p></div>
    <div class="grid2"><div><label class="f" for="sm-x">Extended time per problem</label><select id="sm-x" class="in"><option value="1">Standard time</option><option value="1.5" ${a.x == 1.5 ? 'selected' : ''}>1.5 times (IEP or 504)</option><option value="2" ${a.x == 2 ? 'selected' : ''}>2 times (IEP or 504)</option></select></div>
     <div><label class="f">&nbsp;</label><label class="toggle"><input type="checkbox" id="sm-read" ${a.read ? 'checked' : ''}> Read every problem aloud</label></div></div>
    <p class="note" style="margin:0">Extended-time races are marked in every report and left out of grade-level comparison lines.</p>
    <div class="grid2"><div><label class="f" for="sm-email">Family email</label><input id="sm-email" class="in" type="email" value="${esc(s.familyEmail || '')}"></div>
     <div><label class="f" for="sm-lang">Family language</label><select id="sm-lang" class="in"><option value="en">English</option><option value="es" ${s.familyLang === 'es' ? 'selected' : ''}>Español</option></select></div></div>
    <div><label class="f" for="sm-sis">Student ID (for eduCLIMBER)</label><input id="sm-sis" class="in" value="${esc(s.sisId || '')}"></div>
    <div><button class="btn" data-act="save-student" data-s="${sid}">Save settings</button></div></div>`)
}
function tStudent(t, p) {
  const ros = rosterOf(t.id)
  if (!S.sid || !ros.some((s) => s.id === S.sid)) S.sid = ros[0]?.id
  const st = studentOf(S.sid)
  if (!weeklyPoints(S.sid, p.id).length && effPid(st) !== p.id)
    p = PR[effPid(st)]
  const x = summarize(S.sid, p.id)
  const sel = `<select class="in" style="width:auto" data-act="pick-student" aria-label="Student">${ros.map((s) => `<option value="${s.id}" ${s.id === S.sid ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>`
  if (!x.pts.length)
    return `<div class="row">${sel}</div><div class="panel" style="margin-top:14px"><h2>${window.StudentIdentity ? StudentIdentity.compact() : esc(st.name)} has not raced this skill set yet.</h2></div>`
  const aimPts = FRIDAYS.map((w, i) => ({
    x: i,
    y: i >= x.pts[0].x ? x.aim(i) : null,
  }))
  const sk = {}
  x.pts.slice(-4).forEach((q) =>
    Object.entries(q.a.skills || {}).forEach(([k, [c, n]]) => {
      sk[k] = sk[k] || [0, 0]
      sk[k][0] += c
      sk[k][1] += n
    }),
  )
  const skl = Object.entries(sk)
    .filter(([k, [c, n]]) => n >= 3)
    .sort((a, b) => a[1][0] / a[1][1] - b[1][0] / b[1][1])
  const wksToGoal =
    x.slope > 0 && x.last.y < x.goal
      ? Math.ceil((x.goal - x.last.y) / x.slope)
      : null
  const rib = x.pts.map((_, i) => i).length
  return `<div class="stack"><div class="row noprint" style="align-items:center">${sel}<button class="btn ghost" data-act="family" data-s="${S.sid}" data-l="en">Family report (English)</button><button class="btn ghost" data-act="family" data-s="${S.sid}" data-l="es">Informe familiar (Español)</button><button class="btn ghost" data-act="edit-student" data-s="${S.sid}">Settings</button></div>
   <div class="panel"><div class="spread"><div><h2>${window.StudentIdentity ? StudentIdentity.compact() : esc(st.name)}</h2><p class="sub">${esc(p.label)} (${esc(p.std)}). ${st.probeId && st.probeId === p.id ? 'Individual race. ' : ''}${esc(t.name)}, ${gradeName(t.grade)}.${accomLabel(st.accom) ? ' Supports: ' + esc(accomLabel(st.accom)) + '.' : ''}</p></div><span class="pill ${x.decision.cls}" style="font-size:15px;padding:6px 14px">${x.decision.label}</span></div>
    <div class="callout ${x.decision.k === 'change' ? 'red' : ''}" style="margin-top:12px">${esc(x.decision.why)} ${wksToGoal ? `At the current rate, about ${wksToGoal} more Friday${wksToGoal > 1 ? 's' : ''} to reach ${x.goal}.` : ''}</div>
    ${lineChart({
      series: [
        {
          color: 'var(--sky)',
          dash: '7 6',
          points: aimPts,
          dots: false,
          width: 2,
        },
        {
          color: 'var(--turf)',
          points: x.pts.map((q) => ({ x: q.x, y: q.y })),
        },
      ],
      yMax: p.items,
      goal: x.goal,
      notes: DB.notes[t.id] || {},
    })}
    ${legend([
      ['var(--turf)', 'Friday score'],
      ['var(--sky)', 'Aimline from baseline to goal', 1],
      ['var(--ok)', 'Goal', 1],
    ])}
   </div>
   <div class="grid2">
    <div class="panel"><h3>Latest race, ${fmtD(x.last.w)}</h3><dl class="kv"><dt>Correct</dt><dd>${x.last.y} of ${x.last.a.total}</dd><dt>Wrong</dt><dd>${x.last.a.incorrect}</dd><dt>No answer in time</dt><dd>${x.last.a.noResp}</dd><dt>Not heard (speech)</dt><dd>${x.last.a.notRec}</dd><dt>Correct per minute</dt><dd>${r1(x.cpm)}</dd><dt>Accuracy on answered</dt><dd>${pct(x.acc)}</dd><dt>Median answer time</dt><dd>${x.last.a.medianRt ?? '–'} sec</dd><dt>Baseline</dt><dd>${x.base}</dd><dt>Growth per week</dt><dd>${r1(x.slope)}</dd><dt>Answer mode</dt><dd>${x.last.a.mode === 'speak' ? 'Spoke' : 'Typed or tapped'}</dd></dl></div>
    <div class="panel"><h3>Skills, last 4 races</h3><p class="note">Weakest first, fact sets with at least 3 problems. These are fact sets inside the standard, not mastery of the standard.</p>
     ${skl
       .map(([k, [c, n]]) => {
         const v = c / n
         return `<div style="margin:8px 0"><div class="spread" style="font-size:14px"><b>${esc(k)}</b><span>${c}/${n} (${pct(v)})</span></div><div style="height:10px;background:var(--line);border-radius:6px;overflow:hidden"><i style="display:block;height:100%;width:${v * 100}%;background:${v >= 0.9 ? 'var(--ok)' : v >= 0.7 ? 'var(--gold)' : 'var(--bad)'}"></i></div>${v < 0.7 ? `<div class="note">Next move: ${esc(moveFor(k))}</div>` : ''}</div>`
       })
       .join('')}
    </div>
   </div>
   <div class="grid2">
    <div class="panel"><h3>Flexibility checks</h3>${
      flexFor(S.sid).length
        ? `<table><thead><tr><th>Date</th><th>Problem</th><th>What the student did</th></tr></thead><tbody>${flexFor(
            S.sid,
          )
            .reverse()
            .map(
              (f) =>
                `<tr><td>${fmtD(f.date)}</td><td>${esc(f.prompt)}</td><td><span class="lvl l${f.level}">${f.level}</span> ${esc(FLEX[f.level - 1].name)}${f.note ? `<div class="note">${esc(f.note)}</div>` : ''}</td></tr>`,
            )
            .join('')}</tbody></table>`
        : '<p class="note">No check yet this year.</p>'
    }
     <button class="btn ghost" style="margin-top:10px" data-act="flex-check" data-s="${S.sid}">Do a flexibility check</button></div>
    <div class="panel"><h3>Practice</h3>${(() => {
      const pr = practiceFor(S.sid)
      if (!pr.length)
        return '<p class="note">No practice sessions yet. Practice is untimed, shows the answer after a miss, and focuses on the weakest fact sets.</p>'
      const wk = pr.filter(
        (q) => q.date >= iso(new Date(Date.now() - 7 * 864e5)),
      )
      return `<dl class="kv"><dt>Sessions, last 7 days</dt><dd>${wk.length}</dd><dt>Minutes, last 7 days</dt><dd>${Math.round(wk.reduce((a, q) => a + q.secs, 0) / 60)}</dd><dt>Sessions this year</dt><dd>${pr.length}</dd><dt>First-try accuracy</dt><dd>${pct(
        pr.reduce((a, q) => a + q.correct, 0) /
          Math.max(
            1,
            pr.reduce((a, q) => a + q.items, 0),
          ),
      )}</dd></dl>`
    })()}</div>
   </div>
   <div class="panel"><h3>Race history</h3><div class="tbl-wrap"><table><thead><tr><th>Date</th><th class="num">Correct</th><th class="num">Wrong</th><th class="num">No answer</th><th class="num">Not heard</th><th class="num">Seconds</th><th>Mode</th><th>Flags</th><th></th></tr></thead><tbody>
    ${DB.attempts
      .filter((a) => a.sid === S.sid && a.pid === p.id)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(
        (a) =>
          `<tr><td>${fmtD(a.date)}</td><td class="num">${a.correct}</td><td class="num">${a.incorrect}</td><td class="num">${a.noResp}</td><td class="num">${a.notRec}</td><td class="num">${a.secs}</td><td>${a.mode}</td><td class="note">${[a.exits ? a.exits + ' page exit' + (a.exits > 1 ? 's' : '') : '', a.accom ? '×' + a.accom + ' time' : '', a.retake ? 'retake, not official' : ''].filter(Boolean).join(', ')}</td><td>${a.seed ? '<span class="note">summary only</span>' : `<button class="btn ghost" style="padding:4px 10px" data-act="items" data-a="${a.id}">Items</button>`}</td></tr>`,
      )
      .join('')}
   </tbody></table></div></div></div>`
}
function tSkills(t, p) {
  const ros = rosterOf(t.id),
    cols = new Set(),
    data = {}
  ros.forEach((s) => {
    const pts = weeklyPoints(s.id, p.id).slice(-4)
    const m = {}
    pts.forEach((q) =>
      Object.entries(q.a.skills || {}).forEach(([k, [c, n]]) => {
        cols.add(k)
        m[k] = m[k] || [0, 0]
        m[k][0] += c
        m[k][1] += n
      }),
    )
    data[s.id] = m
  })
  const ck = [...cols].sort((a, b) => {
    const na = parseInt(a),
      nb = parseInt(b)
    return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb
  })
  if (!ck.length) return emptyState(t)
  const colTot = ck
    .map((k) => {
      let c = 0,
        n = 0
      ros.forEach((s) => {
        const v = data[s.id][k]
        if (v) {
          c += v[0]
          n += v[1]
        }
      })
      return { k, v: n ? c / n : null, n }
    })
    .sort((a, b) => (a.v ?? 1) - (b.v ?? 1))
  const color = (v) =>
    v == null
      ? 'var(--paper)'
      : v >= 0.9
        ? '#2E9E5B'
        : v >= 0.75
          ? '#9BD07A'
          : v >= 0.6
            ? '#F2B705'
            : v >= 0.4
              ? '#F08C3A'
              : '#C8102E'
  const groups = colTot.slice(0, 3).map((c) => ({
    ...c,
    kids: ros
      .filter((s) => {
        const v = data[s.id][c.k]
        return v && v[1] >= 2 && v[0] / v[1] < 0.7
      })
      .map((s) => s.name),
  }))
  return `<div class="stack"><div class="panel"><h3>Small groups for next week</h3><p class="note">The three weakest fact sets across the class, with the students under 70% on each in their last 4 races.</p>
   <div class="grid2" style="margin-top:10px">${groups.map((g) => `<div style="border:2px dashed var(--line);border-radius:10px;padding:12px"><div class="spread"><b style="font:700 20px var(--display)">${esc(g.k)}</b><span class="pill ${g.v >= 0.9 ? 'p-ok' : g.v >= 0.7 ? 'p-warn' : 'p-bad'}">${pct(g.v)} class</span></div><p style="margin:6px 0">${esc(moveFor(g.k))}</p><div class="note">${g.kids.length ? esc(g.kids.join(', ')) : 'No one under 70%'}</div></div>`).join('')}</div></div>
   <div class="panel"><h3>Fact-set heat map, last 4 races</h3><div class="tbl-wrap"><table class="heat"><thead><tr><th style="text-align:left">Student</th>${ck.map((k) => `<th>${esc(k)}</th>`).join('')}</tr></thead><tbody>
    ${ros
      .map(
        (s) =>
          `<tr><td class="name">${esc(s.name)}</td>${ck
            .map((k) => {
              const v = data[s.id][k]
              const a = v ? v[0] / v[1] : null
              return `<td style="background:${color(a)};color:${a != null && (a < 0.4 || a >= 0.9) ? '#fff' : '#000'}" title="${esc(s.name)}, ${esc(k)}: ${v ? v[0] + '/' + v[1] : 'no items'}">${a == null ? '' : Math.round(a * 100)}</td>`
            })
            .join('')}</tr>`,
      )
      .join('')}
   </tbody></table></div>${legend([
     ['#2E9E5B', '90%+'],
     ['#9BD07A', '75-89%'],
     ['#F2B705', '60-74%'],
     ['#F08C3A', '40-59%'],
     ['#C8102E', 'under 40%'],
   ])}</div></div>`
}
function baseUrl() {
  return SERVER ? DB.appUrl || '' : location.href.split('?')[0].split('#')[0]
}
function tAssign(t, p) {
  const link = baseUrl() + '?class=' + encodeURIComponent(t.classCode)
  const share =
    'https://classroom.google.com/share?url=' +
    encodeURIComponent(link) +
    '&title=' +
    encodeURIComponent('Friday Fluency Race')
  const opts = (g) =>
    PROBES.filter((x) => x.grade === g)
      .map(
        (x) =>
          `<option value="${x.id}" ${x.id === t.probeId ? 'selected' : ''}>${esc(x.label)} (${esc(x.std)}) · ${TYPE_LABEL[x.type]}, ${x.items} × ${x.secs}s</option>`,
      )
      .join('')
  const lower = GRADES.slice(0, GRADES.indexOf(t.grade))
  return `<div class="grid2">
   <div class="panel stack"><h3>1. Choose this class's race</h3><p class="note">One skill set per class keeps every Friday comparable. Change it when the class meets the goal or the unit shifts. Below-grade sets are for intervention groups.</p>
    <select id="probe" class="in"><optgroup label="${gradeName(t.grade)}">${opts(t.grade)}</optgroup>${lower.length ? `<optgroup label="Below grade (intervention)">${lower.map(opts).join('')}</optgroup>` : ''}</select>
    <div class="note" id="pdesc"><span class="pill ${PR[t.probeId].type === 'fluency' ? 'p-ok' : PR[t.probeId].type === 'local' ? 'p-warn' : 'p-sky'}">${TYPE_LABEL[PR[t.probeId].type]}</span> ${esc(PR[t.probeId].desc)}</div>
    <div><button class="btn" data-act="save-probe">Save race</button></div>
    <div class="callout">Changing the race starts a new progress line. Old races stay in each student's history under the old skill set.</div>
    <h3 style="margin-top:8px">Individual races for intervention</h3><p class="note">Check students, pick a race, apply. Choose "Class race" to move them back.</p>
    <div style="columns:2;font-size:14px">${rosterOf(t.id)
      .map(
        (s) =>
          `<label style="display:block"><input type="checkbox" class="bulk" value="${s.id}"> ${esc(s.name)}${s.probeId && s.probeId !== t.probeId ? ` <span class="pill p-sky">${esc(PR[s.probeId].std.split(',')[0])}</span>` : ''}</label>`,
      )
      .join('')}</div>
    <select id="bulkrace" class="in">${probeOptions(t.grade, '', { classOpt: true })}</select>
    <div><button class="btn" data-act="bulk-race">Apply to checked students</button></div></div>
   ${
     PILOT
       ? `<div class="panel stack"><h3>2. How students start (pilot)</h3>
    <ol style="margin:0;padding-left:20px;font-size:14px">
     <li>Open Tiger Downs on the class device and select <b>Student</b> at the top.</li>
     <li>Each student taps their name, then goes to the starting gate.</li>
     <li>After the race, the student selects <b>All done</b>, and the next student taps their name.</li>
     <li>Friday afternoon, open <b>Pilot data</b> and download a backup.</li>
    </ol>
    <p class="note">Class code for this class: <b>${esc(t.classCode)}</b>. Students only need it when one device holds more than one class.</p></div>`
       : `<div class="panel stack"><h3>2. Post it in Google Classroom</h3>
    <label class="f" for="link">Student link</label><input id="link" class="in" readonly value="${esc(link)}">
    <div class="row"><button class="btn gold" data-act="copy-link">Copy link</button><a class="btn" style="text-decoration:none" href="${share}" target="_blank" rel="noopener">Share to Google Classroom</a></div>
    <ol style="margin:0;padding-left:20px;font-size:14px">
     <li>Select <b>Share to Google Classroom</b>, choose your class, and pick <b>Create assignment</b>.</li>
     <li>Title it "Friday Fluency Race" and set the due date to Friday.</li>
     <li>Each Friday, open the assignment and select <b>Reuse post</b>, or schedule the next four Fridays ahead of time.</li>
     <li>Students sign in with their school Google account. If the app does not recognize them, they type class code <b>${esc(t.classCode)}</b> and tap their name.</li>
    </ol>
    <p class="note">Students on an individual race use the same link. The app gives each child their own race automatically.</p>
    <p class="note">Kindergarten: post it as a Material on the class iPads or Chromebooks and launch it for each child at a station. The race uses tap buttons and pictures, so no reading or typing is required.</p></div>
  </div>`
   }`
}
async function showItems(aid) {
  const items = await API.getItems(aid)
  if (!items) {
    modal(
      '<h2>Item detail</h2><p>Item-level detail is not stored for this race.</p>',
    )
    return
  }
  const at = DB.attempts.find((x) => x.id === aid)
  window._rev = [items, at]
  showReview(items, at)
}
function showReview(items, at) {
  modal(
    `<div class="kid-review">${reviewHtml(items, at, false)}</div><h3 style="margin-top:16px">Timing and status</h3>` +
      `<div class="tbl-wrap"><table><thead><tr><th>#</th><th>Problem</th><th class="num">Answer</th><th class="num">Response</th><th>Status</th><th class="num">Seconds</th><th>Fact set</th></tr></thead><tbody>${items.map((x) => `<tr><td>${x.i}</td><td>${esc(x.prompt)}</td><td class="num">${x.answer}</td><td class="num">${esc(x.response)}</td><td><span class="pill ${x.status === 'correct' ? 'p-ok' : x.status === 'incorrect' ? 'p-bad' : x.status === 'notRecognized' ? 'p-sky' : 'p-none'}">${x.status === 'notRecognized' ? 'not heard' : x.status === 'noResponse' ? 'no answer' : x.status}</span></td><td class="num">${x.rt}</td><td>${esc(x.skill)}</td></tr>`).join('')}</tbody></table></div>`,
  )
}
function exportCsv(rows, name) {
  const csv = csvOf(rows)
  modal(
    `<h2>${esc(name)}</h2><p class="note">${rows.length - 1} rows. Select all, copy, and paste into Google Sheets (Edit, Paste). ${SERVER ? '' : 'Downloads are blocked inside some embedded pages, so copying is the reliable path.'}</p><textarea class="in" rows="14" readonly onclick="this.select()">${esc(csv)}</textarea><p><button class="btn gold" data-act="copy-csv">Copy CSV</button></p>`,
  )
}
function attemptRows(filter) {
  const rows = [
    [
      'date',
      'friday',
      'school',
      'grade',
      'teacher',
      'class_code',
      'student',
      'student_id',
      'standard_set',
      'standard_codes',
      'correct',
      'incorrect',
      'no_response',
      'not_heard',
      'total',
      'seconds',
      'correct_per_min',
      'median_rt',
      'mode',
      'page_exits',
      'fact_set_detail',
    ],
  ]
  DB.attempts
    .filter(filter)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach((a) => {
      const s = studentOf(a.sid),
        t = s && teacherOf(s.teacherId),
        p = PR[a.pid]
      rows.push([
        a.date,
        fridayOf(a.date),
        t?.school,
        t?.grade,
        t?.name,
        t?.classCode,
        s?.name,
        a.sid,
        p?.label,
        p?.std,
        a.correct,
        a.incorrect,
        a.noResp,
        a.notRec,
        a.total,
        a.secs,
        r1(a.correct / Math.max(0.5, a.secs / 60)),
        a.medianRt,
        a.mode,
        a.exits,
        Object.entries(a.skills || {})
          .map(([k, [c, n]]) => `${k}:${c}/${n}`)
          .join('; '),
      ])
    })
  return rows
}

/* ---------- flexibility checks (HB 1030: accurate, efficient, flexible) ---------- */
function tFlex(t, p) {
  const ms = months()
  if (!S.month || !ms.includes(S.month)) S.month = ms[ms.length - 1]
  const ros = rosterOf(t.id),
    recs = ros.map((s) => ({
      s,
      f: flexMonth(s.id, S.month),
      last: flexFor(s.id).pop(),
    }))
  const done = recs.filter((r) => r.f),
    dist = [1, 2, 3, 4].map((l) => done.filter((r) => r.f.level === l).length)
  return `<div class="stack"><div class="spread"><div class="row" style="align-items:center"><label class="f" style="margin:0" for="mo">Month</label><select id="mo" class="in" style="width:auto" data-act="pick-month">${ms.map((m) => `<option value="${m}" ${m === S.month ? 'selected' : ''}>${monthName(m)}</option>`).join('')}</select></div></div>
   <div class="panel"><h2>Flexibility: ${done.length} of ${ros.length} students checked in ${monthName(S.month)}</h2>
    <p class="sub">Speed and accuracy come from the Friday race. Flexibility does not, so once a month sit with each child for two minutes: give one problem, ask "How did you solve it?", and tap what you heard.</p>
    ${done.length ? `<div style="display:flex;height:34px;border-radius:8px;overflow:hidden;margin-top:14px">${dist.map((n, i) => (n ? `<div class="l${i + 1}" style="flex:${n};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px" title="${FLEX[i].name}: ${n}">${n}</div>` : '')).join('')}</div>` : ''}
    ${legend([
      ['#C8102E', '1 ' + FLEX[0].short],
      ['#F08C3A', '2 ' + FLEX[1].short],
      ['#2E9E5B', '3 ' + FLEX[2].short],
      ['#1F6FB2', '4 ' + FLEX[3].short],
    ])}</div>
   <div class="panel"><div class="tbl-wrap"><table><thead><tr><th>Student</th><th>This month</th><th>Most recent check</th><th>Friday race level</th><th></th></tr></thead><tbody>
   ${recs
     .map((r) => {
       const sm = summarize(r.s.id, effPid(r.s))
       return `<tr><td>${esc(r.s.name)}</td><td>${r.f ? `<span class="lvl l${r.f.level}">${r.f.level}</span> ${esc(FLEX[r.f.level - 1].name)}` : '<span class="pill p-warn">Not yet</span>'}</td><td class="note">${r.last ? fmtD(r.last.date) + ': ' + esc(r.last.prompt) : ''}</td><td><span class="pill ${sm.tier.cls}">${sm.tier.label}</span></td><td><button class="btn ${r.f ? 'ghost' : ''}" style="padding:4px 12px" data-act="flex-check" data-s="${r.s.id}">${r.f ? 'Check again' : 'Check now'}</button></td></tr>`
     })
     .join('')}
   </tbody></table></div><p class="note">Watch for students who are fast on Friday but count everything here. That is memorized speed without number sense, and it breaks down with bigger numbers.</p></div></div>`
}
function flexModal(sid) {
  const s = studentOf(sid),
    p = PR[effPid(s)],
    weak = weakSkills(sid, p.id),
    items = p.gen(rng(Date.now()), { ...p, items: 40 })
  const it =
    items.find(
      (x) =>
        weak.includes(x.skill) &&
        !['0s', '1s', '+0', '−0 / −all'].includes(x.skill),
    ) ||
    items.find((x) => x.answer > 2) ||
    items[0]
  S.flexDraft = { sid, pid: p.id, prompt: it.prompt, level: null }
  modal(`<h2>Flexibility check: ${esc(s.name)}</h2>
   <p class="note">Show or say this problem. After the answer, ask: "How did you solve it?" or "How do you know?" Tap what you heard.</p>
   <div style="text-align:center;margin:12px 0"><div style="font:600 54px var(--kid)">${esc(it.vis && it.vis.t === 'eq' ? it.vis.text + ' ?' : it.prompt)}</div>${p.grade === 'K' ? `<div style="margin-top:8px">${renderVis(it.vis)}</div>` : ''}<div class="note">${weak.includes(it.skill) ? 'From a fact set this student is missing: ' + esc(it.skill) : esc(it.skill)}. <button class="btn ghost" style="padding:2px 10px" data-act="flex-check" data-s="${sid}">Different problem</button></div></div>
   <div class="levels">${FLEX.map((f) => `<button data-act="flex-level" data-l="${f.l}" aria-pressed="false"><span class="lvl l${f.l}">${f.l}</span> <b>${f.name}</b><div class="note">${f.d}</div></button>`).join('')}</div>
   <label class="f" for="flexnote" style="margin-top:12px">What the student said (optional)</label><input id="flexnote" class="in" placeholder="I know 8 + 2 is 10, then 3 more">
   <p><button class="btn" data-act="save-flex">Save check</button></p>`)
}
/* ---------- family report, English and Spanish ---------- */
const PROBE_ES = {
  'K.NR.1.3': 'Uno más, uno menos (hasta 20)',
  'K.NR.4.1': 'Escucha y toca el número (0 a 20)',
  'K.NR.4.2': '¿Qué grupo tiene más? ¿Menos?',
  'K.NR.5.1': 'Hacer 10 (¿cuántos más?)',
  '1.NR.1': '¿Qué número sigue? (hasta 120)',
  '1.NR.1.3': 'Comparar números hasta 100',
  '1.NR.2.3': 'Número que falta hasta 20',
  '1.NR.2.5': '¿Verdadero o falso? (signo igual)',
  '2.NR.1.2': 'Contar pasando decenas y centenas (hasta 1,000)',
  '2.NR.1.3': 'Comparar números hasta 1,000',
  '2.NR.3.1': '¿Par o impar? (hasta 20)',
  '2.NR.3.2': 'Arreglos: ¿cuántos hay en total?',
  '3.NR.1.3': 'Redondear a la decena o centena más cercana',
  '3.NR.1.2': 'Comparar números hasta 10,000',
  '4.PAR.3.3': 'Factor que falta',
  '4.PAR.3.4': '¿Primo o compuesto?',
  '4.NR.1.4': 'Redondear números de varios dígitos',
  '4.NR.5.3': 'Comparar decimales hasta centésimas',
  'K.NR.1': '¿Cuántos hay? Cantidades hasta 10',
  'K.NR.1p': 'Pon objetos en el dibujo (contar)',
  'K.NR.2': '¿Qué número sigue? Contar',
  'K.NR.3': 'Diez y algunos más (11 a 19)',
  'K.NR.5': 'Juntar y quitar hasta 5',
  '1.NR.2': 'Sumar y restar hasta 10',
  '1.NR.5a': '10 más, 10 menos',
  '1.NR.5b': 'Sumar y restar decenas',
  '2.NR.2a': 'Sumar y restar hasta 20',
  '2.NR.2b': 'Sumar y restar hasta 100',
  '3.PAR.3m': 'Datos de multiplicación',
  '3.PAR.3d': 'Datos de división',
  '3.PAR.3t': 'Multiplicar por múltiplos de 10',
  '3.PAR.2': 'Sumar y restar hasta 1,000',
  '4.FACT': 'Repaso de multiplicación y división',
  '4.NR.2': 'Sumar y restar números de varios dígitos',
  '5.FACT': 'Repaso de multiplicación y división',
  '5.NR.2a': 'Multiplicar números de varios dígitos',
  '5.NR.2b': 'Dividir números de varios dígitos',
}
const HOME_TIPS = {
  en: {
    K: 'Count real things together: spoons, steps, cars. Ask "How many? How do you know?" Show fingers fast and ask how many without counting.',
    1: 'Play "Make 10" with playing cards: find two cards that add to 10. Ask how they figured out a fact, not just the answer.',
    2: 'Play "Make 10" with playing cards, then try teen facts: 8 + 5 is 8 + 2 + 3. Five minutes a day is plenty.',
    3: 'Practice one times table a week. Ask "If you forget 7 × 6, how could you figure it out?" (5 × 6 plus 2 × 6).',
    4: 'Keep multiplication facts warm with a 5-minute card game. Ask your child to estimate before solving bigger problems.',
    5: 'Ask your child to estimate first, then solve. Keep multiplication facts warm with a short card game.',
  },
  es: {
    K: 'Cuenten cosas reales juntos: cucharas, escalones, carros. Pregunte "¿Cuántos hay? ¿Cómo lo sabes?" Muestre dedos rápido y pregunte cuántos sin contar.',
    1: 'Jueguen "Haz 10" con cartas: busquen dos cartas que sumen 10. Pregunte cómo lo pensó, no solo la respuesta.',
    2: 'Jueguen "Haz 10" con cartas y luego sumas como 8 + 5 = 8 + 2 + 3. Cinco minutos al día es suficiente.',
    3: 'Practiquen una tabla de multiplicar por semana. Pregunte "Si olvidas 7 × 6, ¿cómo lo puedes calcular?" (5 × 6 más 2 × 6).',
    4: 'Repasen las tablas de multiplicar con un juego de cartas de 5 minutos. Pida que estime antes de resolver problemas grandes.',
    5: 'Pida que estime primero y luego resuelva. Repasen las tablas de multiplicar con un juego corto de cartas.',
  },
}
function familyReport(sid, lang) {
  const s = studentOf(sid),
    t = teacherOf(s.teacherId),
    p = PR[effPid(s)],
    x = summarize(sid, p.id),
    first = s.name.split(' ')[0],
    fl = flexFor(sid).pop(),
    es = lang === 'es'
  const label = es ? PROBE_ES[p.id] || p.label : p.label
  const pts = x.pts,
    lastM = pts.length ? monthName(monthKey(pts[pts.length - 1].w)) : ''
  const growth =
    x.slope == null
      ? ''
      : es
        ? x.slope > 0.05
          ? `${first} está mejorando, unas ${r1(x.slope)} respuestas correctas más cada semana.`
          : 'Su puntaje se ha mantenido igual en las últimas semanas. Estamos ajustando la enseñanza para ayudarle.'
        : x.slope > 0.05
          ? `${first} is improving by about ${r1(x.slope)} more correct answers each week.`
          : 'Scores have been level the last few weeks. We are adjusting instruction to help.'
  const L = es
    ? {
        title: `Informe de matemáticas de ${first}`,
        intro: `Cada viernes, ${first} resuelve ${p.items} problemas en una carrera corta de matemáticas. Mide qué tan rápido y con qué precisión sabe sus datos de matemáticas.`,
        skill: 'Destreza',
        start: 'Primer puntaje',
        now: 'Puntaje más reciente',
        goal: 'Meta para mayo',
        of: 'de',
        flex: 'Cuando explica cómo resolvió un problema',
        home: 'Para practicar en casa',
        from: 'Maestra o maestro',
      }
    : {
        title: `${first}'s math fluency report`,
        intro: `Every Friday, ${first} answers ${p.items} problems in a short math race. It shows how quickly and accurately ${first} knows math facts.`,
        skill: 'Skill',
        start: 'First score',
        now: 'Latest score',
        goal: 'Goal by May',
        of: 'of',
        flex: 'When explaining how a problem was solved',
        home: 'Practice at home',
        from: 'Teacher',
      }
  modal(`<div class="family"><h2>${esc(L.title)}</h2><p class="note">${esc(lastM)} · ${esc(t.name)}, ${esc(SETTINGS.school)}</p>
   <p>${esc(L.intro)}</p>
   <dl class="kv"><dt>${L.skill}</dt><dd>${esc(label)} (${esc(p.std)})</dd><dt>${L.start}</dt><dd>${x.base ?? '–'} ${L.of} ${p.items}</dd><dt>${L.now}</dt><dd>${x.last?.y ?? '–'} ${L.of} ${p.items}</dd><dt>${L.goal}</dt><dd>${x.goal} ${L.of} ${p.items}</dd>
   ${fl ? `<dt>${L.flex}</dt><dd>${esc(es ? FLEXES[fl.level - 1].name : FLEX[fl.level - 1].name)}</dd>` : ''}</dl>
   <p>${esc(growth)}</p>
   ${pts.length ? lineChart({ series: [{ color: 'var(--turf)', points: pts.map((q) => ({ x: q.x, y: q.y })) }], yMax: p.items, goal: x.goal, h: 200, goalLabel: es ? 'Meta' : 'Goal' }) : ''}
   <h3 style="margin-top:10px">${L.home}</h3><p>${esc(HOME_TIPS[es ? 'es' : 'en'][t.grade])}</p>
   <p class="note">${L.from}: ${esc(t.name)}</p></div>
   <p class="noprint"><button class="btn" data-act="print-family">Print or save as PDF</button></p>`)
}

/* ---------- stables and rewards (teacher) ---------- */
function tRewards(t) {
  const ros = rosterOf(t.id),
    m = monthKey(todayIso())
  const pend = ros.filter((s) => stableOf(s.id).nameStatus === 'pending')
  const queue = []
  ros.forEach((s) =>
    milestones(s.id)
      .filter(physOn)
      .forEach((ms) => {
        if (!(stableOf(s.id).delivered || {})[ms.key]) queue.push({ s, ms })
      }),
  )
  const rows = ros.map((s) => {
    const st = stableOf(s.id),
      w = wallet(s.id)
    return {
      s,
      st,
      w,
      month: w.ev
        .filter((e) => monthKey(e.d) === m)
        .reduce((a, e) => a + e.n, 0),
    }
  })
  return `<div class="stack">
   <div class="grid2">
    <div class="panel"><h3>Racer names to check (${pend.length})</h3><p class="note">Students can pick from word lists right away. Names they make up wait here and stay hidden until you approve them.</p>
     ${pend.length ? pend.map((s) => `<div class="spread" style="border-bottom:1px solid var(--line);padding:8px 0"><div><b>“${esc(stableOf(s.id).custom)}”</b><div class="note">${esc(s.name)}</div></div><div class="row"><button class="btn" style="padding:5px 12px" data-act="approve-name" data-s="${s.id}" data-ok="1">Approve</button><button class="btn ghost" style="padding:5px 12px" data-act="approve-name" data-s="${s.id}" data-ok="0">Ask for another</button></div></div>`).join('') : '<p class="note">Nothing waiting.</p>'}</div>
    <div class="panel"><h3>Reward queue (${queue.length})</h3><p class="note">Milestones the district set for a physical reward. Mark each one when you hand it out.</p>
     ${queue.length ? `<table><tbody>${queue.map(({ s, ms }) => `<tr><td>${esc(s.name)}</td><td>${esc(ms.label)}<div class="note">${fmtD(ms.d)}</div></td><td><button class="btn ghost" style="padding:4px 10px" data-act="deliver" data-s="${s.id}" data-k="${esc(ms.key)}">Mark given</button></td></tr>`).join('')}</tbody></table>` : '<p class="note">No rewards waiting.</p>'}</div>
   </div>
   <div class="panel"><h3>Class stables</h3><p class="note">Horseshoes come only from effort and growth: racing on Friday, practice (up to 3 sessions a week), beating their own score, staying on their growth line, comebacks, and explaining their thinking. Never from rank or raw speed.</p>
    <div class="tbl-wrap"><table><thead><tr><th></th><th>Student</th><th>Racer name</th><th>Tier</th><th class="num">Earned this month</th><th class="num">Earned this year</th><th class="num">Practice ribbons</th><th>Effort marks</th></tr></thead><tbody>
    ${rows.map((r) => `<tr><td style="width:70px">${racerOf(r.s.id, { size: 64, still: true })}</td><td>${esc(r.s.name)}</td><td>${esc(displayName(r.st) || 'not named yet')}${r.st.nameStatus === 'pending' ? ' <span class="pill p-warn">name pending</span>' : ''}</td><td><span class="tierbadge t${r.w.tier}" style="font-size:12px">${TIERS[r.w.tier].n}</span></td><td class="num">${r.month}</td><td class="num">${r.w.earned}</td><td class="num">${r.w.marks.ribbons}</td><td class="note">${[r.w.marks.grit ? '⭐ grit' : '', r.w.marks.plate ? '🥇 on-track plate' : ''].filter(Boolean).join(', ')}</td></tr>`).join('')}
    </tbody></table></div></div></div>`
}

/* ---- engine/11_pilot.js ---- */
/* ENGINE FILE. Owned by the engine (Claude). Codex: do not edit. Request changes in REQUESTS.md. */
/* ================= no-server pilot mode =================
   Built with `python3 build.py --pilot` (dist/Index-pilot.html). Everything stays on this device:
   no server, no Google account, no email, no speech recognition service. A teacher PIN guards the
   teacher dashboard. Backup files move classes between devices and, later, into the real system. */
const PILOT_ITEM_KEEP = 150 // keep problem-by-problem detail for the latest 150 races
function pilotHash(pin) {
  return 'h' + hash('tiger-downs:' + pin)
}
function pilotStore() {
  return local.get()
}
function pilotUid(prefix) {
  return (
    prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  )
}

/* write the whole current state into the device store (used after setup and imports) */
function pilotPersist() {
  const L = local.get()
  Object.assign(L, {
    teachers: DB.teachers,
    students: DB.students,
    attempts: DB.attempts,
    flex: DB.flex,
    practice: DB.practice,
    notes: DB.notes,
    stables: DB.stables,
    settings: SETTINGS,
    classProbe: {},
    studentPatch: {},
  })
  local.set(L)
}
function pilotPrepare() {
  // speech recognition sends audio to an outside service, so the pilot is tap or type only
  PROBES.forEach((p) => (p.noSpeak = true))
  K.mode = 'tap'
}
function pilotStorageKB() {
  try {
    return Math.round((legacyStorage.getItem(LS_KEY) || '').length / 1024)
  } catch (e) {
    return 0
  }
}

/* ---------- first-run setup ---------- */
function renderPilotSetup() {
  document.body.className = ''
  const opts = GRADES.map(
    (g) => `<option value="${g}">${gradeName(g)}</option>`,
  ).join('')
  $('#app').innerHTML =
    `<div class="wrap" style="padding:28px 20px 40px;max-width:820px">
   <h1>Set up the Tiger Downs pilot</h1>
   <p class="sub">This copy of Tiger Downs keeps everything on this device. Nothing is sent anywhere. Set up your class once; you can add more classes later from the teacher dashboard.</p>
   <div class="panel stack" style="margin-top:16px">
    <div class="grid2"><div><label class="f" for="ps-name">Teacher name</label><input id="ps-name" class="in" placeholder="Ms. Jordan"></div>
     <div><label class="f" for="ps-grade">Grade</label><select id="ps-grade" class="in" data-act="ps-grade">${opts}</select></div></div>
    <div><label class="f" for="ps-race">Class race</label><select id="ps-race" class="in">${probeOptions('K', '')}</select></div>
    <div><label class="f" for="ps-roster">Students, one per line (first name and last initial is enough)</label><textarea id="ps-roster" class="in" rows="8" placeholder="Jordan S.&#10;Amari T."></textarea></div>
    <div class="grid2"><div><label class="f" for="ps-pin">Teacher PIN (4 or more digits)</label><input id="ps-pin" class="in" type="password" inputmode="numeric" autocomplete="new-password"></div>
     <div><label class="f" for="ps-pin2">Type the PIN again</label><input id="ps-pin2" class="in" type="password" inputmode="numeric" autocomplete="new-password"></div></div>
    <p class="note" style="margin:0">The PIN keeps students out of the teacher dashboard. It is a classroom lock, not strong security, so do not reuse a password.</p>
    <div><button class="btn" data-act="ps-create">Create my class</button></div>
   </div>
   <div class="panel stack" style="margin-top:16px"><h3>Setting up a second device for a class that already exists?</h3>
    <p class="note">On the first device, open the teacher dashboard, select <b>Pilot data</b>, and download a backup file. Then load it here. Both devices will share the same class, students, and racers.</p>
    <input type="file" id="ps-file" accept=".json,application/json" class="in"><div><button class="btn ghost" data-act="ps-import-first">Load backup and start</button></div>
   </div></div>`
}
async function pilotCreate() {
  const name = $('#ps-name').value.trim(),
    grade = $('#ps-grade').value,
    pid = $('#ps-race').value
  const names = $('#ps-roster')
    .value.split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  const pin = $('#ps-pin').value.trim(),
    pin2 = $('#ps-pin2').value.trim()
  if (!name) return toast('Add the teacher name.')
  if (!PR[pid]) return toast('Choose a class race.')
  if (names.length < 1) return toast('Add at least one student.')
  if (!/^\d{4,}$/.test(pin)) return toast('The PIN needs 4 or more digits.')
  if (pin !== pin2) return toast('The two PINs do not match.')
  const tid = pilotUid('t'),
    codeBase = 'TG-' + grade + 'P'
  const taken = new Set(DB.teachers.map((t) => t.classCode))
  let code = codeBase,
    n = 2
  while (taken.has(code)) code = codeBase + n++
  DB.teachers.push({
    id: tid,
    name,
    grade,
    school: SETTINGS.school,
    classCode: code,
    probeId: pid,
    email: '',
  })
  DB.students.push(
    ...names.map((nm) => ({
      id: pilotUid('s'),
      name: nm.slice(0, 40),
      teacherId: tid,
      grade,
      probeId: '',
      accom: null,
      familyLang: 'en',
    })),
  )
  const L = local.get()
  if (!L.pinHash) L.pinHash = pilotHash(pin)
  local.set(L)
  pilotPersist()
  location.reload()
}

/* ---------- teacher PIN ---------- */
function pilotAskPin(then) {
  modal(`<h2>Teacher PIN</h2><p class="note">Enter the PIN to open the teacher dashboard on this device.</p>
    <input id="pin-in" class="in" type="password" inputmode="numeric" autocomplete="off" style="max-width:220px">
    <p><button class="btn" data-act="pin-ok">Open dashboard</button></p>`)
  S._afterPin = then
  setTimeout(() => {
    const i = $('#pin-in')
    if (i) {
      i.focus()
      i.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') pilotCheckPin()
      })
    }
  }, 50)
}
function pilotCheckPin() {
  const L = local.get()
  if (pilotHash(($('#pin-in') || {}).value || '') === L.pinHash) {
    S.unlocked = true
    $('#layer').innerHTML = ''
    ;(S._afterPin || (() => {}))()
  } else toast('That PIN does not match.')
}

/* ---------- backups: export, import (merge) ---------- */
function pilotBackup() {
  const L = local.get()
  return {
    app: 'tiger-downs',
    kind: 'pilot-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    device: L.deviceId || (L.deviceId = pilotUid('d')),
    teachers: DB.teachers,
    students: DB.students,
    attempts: DB.attempts,
    practice: DB.practice,
    flex: DB.flex,
    notes: DB.notes,
    stables: DB.stables,
    items: L.items || {},
    settings: SETTINGS,
    pinHash: L.pinHash,
  }
}
function pilotDownload() {
  const L = local.get()
  if (!L.deviceId) {
    L.deviceId = pilotUid('d')
    local.set(L)
  }
  const data = JSON.stringify(pilotBackup()),
    fname = `tiger-downs-backup-${todayIso()}.json`
  try {
    const url = URL.createObjectURL(
      new Blob([data], { type: 'application/json' }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = fname
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
    toast('Backup downloaded: ' + fname)
  } catch (e) {
    pilotShowBackupText(data)
  }
}
function pilotShowBackupText(data) {
  modal(
    `<h2>Backup text</h2><p class="note">If the download did not start, select all of this text, copy it, and save it in a file ending in .json.</p><textarea class="in" rows="12" readonly onclick="this.select()">${esc(data || JSON.stringify(pilotBackup()))}</textarea>`,
  )
}
function pilotMerge(b) {
  if (!b || b.app !== 'tiger-downs' || b.kind !== 'pilot-backup')
    throw new Error('That file is not a Tiger Downs pilot backup.')
  const byId = (arr, list) => {
    const m = new Map(arr.map((x) => [x.id, x]))
    ;(list || []).forEach((x) => {
      if (x && x.id) m.set(x.id, Object.assign(m.get(x.id) || {}, x))
    })
    return [...m.values()]
  }
  const union = (arr, list) => {
    const seen = new Set(arr.map((x) => x.id))
    ;(list || []).forEach((x) => {
      if (x && x.id && !seen.has(x.id)) {
        arr.push(x)
        seen.add(x.id)
      }
    })
    return arr
  }
  const before = {
    t: DB.teachers.length,
    s: DB.students.length,
    a: DB.attempts.length,
  }
  DB.teachers = byId(DB.teachers, b.teachers)
  DB.students = byId(DB.students, b.students)
  DB.attempts = union(DB.attempts, b.attempts)
  DB.practice = union(DB.practice, b.practice)
  DB.flex = union(DB.flex, b.flex)
  Object.entries(b.notes || {}).forEach(([tid, m]) => {
    DB.notes[tid] = Object.assign({}, m, DB.notes[tid] || {})
  })
  Object.entries(b.stables || {}).forEach(([sid, st]) => {
    const cur = DB.stables[sid]
    if (!cur || (st.updatedAt || 0) > (cur.updatedAt || 0)) DB.stables[sid] = st
  })
  const L = local.get()
  L.items = Object.assign({}, b.items || {}, L.items || {})
  if (!L.pinHash && b.pinHash) L.pinHash = b.pinHash
  local.set(L)
  pilotPersist()
  return {
    teachers: DB.teachers.length - before.t,
    students: DB.students.length - before.s,
    races: DB.attempts.length - before.a,
  }
}
function pilotReadFile(input, done) {
  const f = input && input.files && input.files[0]
  if (!f) return toast('Choose a backup file first.')
  const r = new FileReader()
  r.onload = () => {
    try {
      done(pilotMerge(JSON.parse(r.result)))
    } catch (e) {
      toast(e.message || 'That file could not be read.')
    }
  }
  r.readAsText(f)
}
function pilotPrune(L) {
  const keys = Object.keys(L.items || {})
  if (keys.length <= PILOT_ITEM_KEEP) return
  keys.slice(0, keys.length - PILOT_ITEM_KEEP).forEach((k) => delete L.items[k])
}

/* ---------- teacher tab: Pilot data ---------- */
function tPilot(t) {
  const kb = pilotStorageKB(),
    pct = Math.min(100, Math.round((kb / 4800) * 100)),
    L = local.get()
  return `<div class="stack">
   <div class="callout">Pilot mode: everything is saved <b>on this device only</b>. Clearing the browser's history or site data erases it, so download a backup every Friday after races.</div>
   <div class="grid2">
    <div class="panel stack"><h3>Back up this device</h3>
     <p class="note">Saves every class, student, race, racer, and note on this device into one file. Keep it somewhere safe, such as your district Google Drive.</p>
     <div class="row"><button class="btn" data-act="pl-download">Download backup</button><button class="btn ghost" data-act="pl-text">Show backup as text</button></div>
     <p class="note">Storage used: ${kb} KB of about 4,800 KB (${pct}%). Problem-by-problem detail is kept for the latest ${PILOT_ITEM_KEEP} races; scores are kept for every race.</p></div>
    <div class="panel stack"><h3>Combine devices</h3>
     <p class="note">Students raced on more than one device? Download a backup on each other device, then load those files here. Races are combined, never duplicated or overwritten.</p>
     <input type="file" id="pl-file" accept=".json,application/json" class="in"><div><button class="btn" data-act="pl-import">Load and combine</button></div></div>
   </div>
   <div class="grid2">
    <div class="panel stack"><h3>Add another class</h3>
     <div class="grid2"><div><label class="f" for="pa-name">Teacher name</label><input id="pa-name" class="in"></div>
      <div><label class="f" for="pa-grade">Grade</label><select id="pa-grade" class="in">${GRADES.map((g) => `<option value="${g}" ${g === t.grade ? 'selected' : ''}>${gradeName(g)}</option>`).join('')}</select></div></div>
     <label class="f" for="pa-roster">Students, one per line</label><textarea id="pa-roster" class="in" rows="4"></textarea>
     <p class="note" style="margin:0">The new class starts on the grade's first race; change it in Class race.</p>
     <div><button class="btn ghost" data-act="pl-addclass">Add class</button></div></div>
    <div class="panel stack"><h3>Teacher PIN and device</h3>
     <div class="grid2"><div><label class="f" for="pc-old">Current PIN</label><input id="pc-old" class="in" type="password" inputmode="numeric"></div><div><label class="f" for="pc-new">New PIN</label><input id="pc-new" class="in" type="password" inputmode="numeric"></div></div>
     <div><button class="btn ghost" data-act="pl-pin">Change PIN</button></div>
     <hr style="border:0;border-top:1px solid var(--line);width:100%">
     <p class="note">Erase removes every class, student, and race from this device. Download a backup first.</p>
     <div class="row" style="align-items:center"><input id="pl-erase" class="in" placeholder="Type ERASE" style="max-width:160px"><button class="btn ghost" data-act="pl-erase">Erase this device</button></div></div>
   </div>
   <div class="panel"><h3>When the district system is back</h3><p class="note">Keep every backup file. Each one holds every race in the same format the full version uses, so pilot races can be moved into the district system later instead of re-entered.</p></div>
  </div>`
}
async function pilotAct(a, el) {
  switch (a) {
    case 'ps-grade': {
      const g = $('#ps-grade').value
      $('#ps-race').innerHTML = probeOptions(g, '')
      break
    }
    case 'ps-create':
      await pilotCreate()
      break
    case 'ps-import-first':
      pilotReadFile($('#ps-file'), (r) => {
        toast(`Loaded ${r.teachers} class(es) and ${r.races} races`)
        setTimeout(() => location.reload(), 600)
      })
      break
    case 'pin-ok':
      pilotCheckPin()
      break
    case 'pl-download':
      pilotDownload()
      break
    case 'pl-text':
      pilotShowBackupText()
      break
    case 'pl-import':
      pilotReadFile($('#pl-file'), (r) => {
        toast(`Combined: ${r.students} new students, ${r.races} new races`)
        bumpCache()
        render()
      })
      break
    case 'pl-addclass': {
      const name = $('#pa-name').value.trim(),
        grade = $('#pa-grade').value,
        names = $('#pa-roster')
          .value.split('\n')
          .map((s) => s.trim())
          .filter(Boolean)
      if (!name || !names.length)
        return toast('Add a teacher name and at least one student.')
      const tid = pilotUid('t'),
        taken = new Set(DB.teachers.map((t) => t.classCode))
      let code = 'TG-' + grade + 'P',
        n = 2
      while (taken.has(code)) code = 'TG-' + grade + 'P' + n++
      DB.teachers.push({
        id: tid,
        name,
        grade,
        school: SETTINGS.school,
        classCode: code,
        probeId: PROBES.find((p) => p.grade === grade).id,
        email: '',
      })
      DB.students.push(
        ...names.map((nm) => ({
          id: pilotUid('s'),
          name: nm.slice(0, 40),
          teacherId: tid,
          grade,
          probeId: '',
          accom: null,
          familyLang: 'en',
        })),
      )
      pilotPersist()
      S.tid = tid
      S.tab = 'assign'
      toast('Class added: ' + code)
      render()
      break
    }
    case 'pl-pin': {
      const L = local.get()
      if (pilotHash($('#pc-old').value.trim()) !== L.pinHash)
        return toast('Current PIN does not match.')
      const np = $('#pc-new').value.trim()
      if (!/^\d{4,}$/.test(np))
        return toast('The new PIN needs 4 or more digits.')
      L.pinHash = pilotHash(np)
      local.set(L)
      toast('PIN changed')
      render()
      break
    }
    case 'pl-erase':
      if (($('#pl-erase').value || '').trim() !== 'ERASE')
        return toast('Type ERASE to confirm.')
      RaceStorage.removeItem(LS_KEY)
      location.reload()
      break
  }
}

/* ---- engine/10_district_events_boot.js ---- */
/* ENGINE FILE. Owned by the engine (Claude). Codex: do not edit. Request changes in REQUESTS.md. */
/* ================= district dashboard ================= */
const GCOL = {
  K: '#C8102E',
  1: '#F08C3A',
  2: '#8A6D00',
  3: '#1F5E3B',
  4: '#1F6FB2',
  5: '#6B3FA0',
}
function gradeWeek(g, w) {
  let tested = 0,
    at = 0,
    n = 0
  DB.teachers
    .filter((t) => t.grade === g)
    .forEach((t) => {
      const c = classWeek(t.id, t.probeId, w)
      n += c.n
      tested += c.tested
      at += (c.atGoal || 0) * c.tested
    })
  return {
    n,
    tested,
    atGoal: tested ? at / tested : null,
    part: n ? tested / n : null,
  }
}
function classesIn(g) {
  return DB.teachers.filter((t) => g === 'all' || t.grade === g)
}
function districtTabs() {
  const tabs = [
    ['overview', 'Overview'],
    ['derby', 'Monthly derby'],
    ['impact', 'Instruction impact'],
    ['grid', 'Grade by month'],
    ['settings', 'Goals and timing'],
  ]
  return `<nav class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${S.dtab === k}" data-act="dtab" data-t="${k}">${l}</button>`).join('')}</nav>`
}
function renderDistrict() {
  document.body.className = ''
  let body =
    S.dtab === 'overview'
      ? dOverview()
      : S.dtab === 'derby'
        ? dDerby()
        : S.dtab === 'impact'
          ? dImpact()
          : S.dtab === 'grid'
            ? dGrid()
            : dSettings()
  $('#app').innerHTML =
    `<div class="wrap" style="padding-bottom:40px"><div class="spread" style="margin-top:22px"><div><h1>K-5 math fluency, district view</h1><p class="sub">${esc(SETTINGS.district)}. ${DB.teachers.length} classes, ${DB.students.length} students. Every class races its assigned skill set each Friday; growth is measured against each student's own baseline.</p></div>
   ${S.dtab !== 'settings' ? `<select class="in" style="width:auto" data-act="dgrade" aria-label="Grade filter"><option value="all">All grades</option>${GRADES.map((g) => `<option value="${g}" ${S.dgrade === g ? 'selected' : ''}>${gradeName(g)}</option>`).join('')}</select>` : ''}</div>${districtTabs()}${body}</div>`
  animateDerby()
}
function dOverview() {
  const gs = S.dgrade === 'all' ? GRADES : [S.dgrade]
  const lastW = [...FRIDAYS]
    .reverse()
    .find((w) => gs.some((g) => gradeWeek(g, w).tested > 0))
  const prevW = FRIDAYS[FRIDAYS.indexOf(lastW) - 1]
  const agg = (w) => {
    let n = 0,
      t = 0,
      a = 0
    gs.forEach((g) => {
      const x = gradeWeek(g, w)
      n += x.n
      t += x.tested
      a += (x.atGoal || 0) * x.tested
    })
    return { n, t, at: t ? a / t : null }
  }
  const L = agg(lastW),
    P = prevW ? agg(prevW) : null,
    F = agg(FRIDAYS[0])
  const cls = classesIn(S.dgrade).map((t) => ({
    t,
    ...classSummary(t.id, t.probeId),
  }))
  const flagged = cls.reduce((a, c) => a + c.change, 0)
  const series = gs.map((g) => ({
    color: GCOL[g],
    points: FRIDAYS.map((w, x) => {
      const v = gradeWeek(g, w).atGoal
      return { x, y: v == null ? null : v * 100 }
    }),
  }))
  return `<div class="stack">
   <div class="tote">
    <div><div class="n">${L.t}<small>/ ${L.n}</small></div><div class="l">Raced on ${fmtD(lastW)}</div><div class="d">${pct(L.t / Math.max(1, L.n))} participation</div></div>
    <div><div class="n">${pct(L.at)}</div><div class="l">At goal now</div><div class="d">${P ? arrow(L.at != null && P.at != null ? (L.at - P.at) * 100 : null) + ' pts vs last Friday' : ''}</div></div>
    <div><div class="n">${pct(F.at)}</div><div class="l">At goal on ${fmtD(FRIDAYS[0])}</div><div class="d">First Friday of the year</div></div>
    <div><div class="n">${r1(median(cls.map((c) => c.slope).filter((v) => v != null)))}</div><div class="l">Median class growth / wk</div><div class="d">Correct answers per Friday</div></div>
    <div><div class="n" style="color:#ff9a8d">${flagged}</div><div class="l">Students needing an instruction change</div><div class="d">4 Fridays under aimline</div></div>
   </div>
   ${(() => {
     const studs = DB.students.filter(
         (s) => S.dgrade === 'all' || s.grade === S.dgrade,
       ),
       ids = new Set(studs.map((s) => s.id)),
       m = monthKey(lastW),
       wk = iso(new Date(D(lastW).getTime() - 6 * 864e5))
     const own = studs.filter(
         (s) => s.probeId && s.probeId !== teacherOf(s.teacherId).probeId,
       ).length,
       since30 = iso(new Date(D(lastW).getTime() - 30 * 864e5)),
       flexed = studs.filter((s) =>
         flexFor(s.id).some((f) => f.date >= since30),
       ).length,
       prac = DB.practice.filter((p) => ids.has(p.sid) && p.date >= wk).length,
       acc = studs.filter(
         (s) => s.accom && (s.accom.x > 1 || s.accom.read),
       ).length
     return `<div class="tote" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))"><div><div class="n" style="font-size:32px">${own}</div><div class="l">Students on an individual race</div></div><div><div class="n" style="font-size:32px">${pct(flexed / Math.max(1, studs.length))}</div><div class="l">Flexibility checked, last 30 days</div></div><div><div class="n" style="font-size:32px">${prac}</div><div class="l">Practice sessions, week of ${fmtD(lastW)}</div></div><div><div class="n" style="font-size:32px">${acc}</div><div class="l">Students with testing supports</div></div></div>`
   })()}
   <div class="panel"><h3>Percent of students at goal, every Friday</h3>${lineChart({ series, yMax: 100, W: 1150, h: 300, label: 'Percent at goal' })}${legend(gs.map((g) => [GCOL[g], gradeName(g)]))}
    <p class="note">Each line uses each class's assigned skill set and its goal. A rising line means Friday-to-Friday instruction is moving students across the goal line.</p></div>
   <div class="panel"><h3>Grade levels</h3><div class="tbl-wrap"><table><thead><tr><th>Grade</th><th class="num">Classes</th><th class="num">Students</th><th class="num">Raced last Friday</th><th class="num">At goal, first Friday</th><th class="num">At goal now</th><th class="num">Median growth / wk</th><th class="num">Need change</th></tr></thead><tbody>
    ${gs
      .map((g) => {
        const c = cls.filter((x) => x.t.grade === g),
          a = gradeWeek(g, lastW),
          f = gradeWeek(g, FRIDAYS[0])
        return `<tr class="click" data-act="dgrade-go" data-g="${g}"><td><b style="color:${GCOL[g]}">●</b> ${gradeName(g)}</td><td class="num">${c.length}</td><td class="num">${a.n}</td><td class="num">${pct(a.part)}</td><td class="num">${pct(f.atGoal)}</td><td class="num"><b>${pct(a.atGoal)}</b></td><td class="num">${r1(median(c.map((x) => x.slope).filter((v) => v != null)))}</td><td class="num">${c.reduce((s, x) => s + x.change, 0)}</td></tr>`
      })
      .join('')}
   </tbody></table></div></div></div>`
}
function dDerby() {
  const ms = months()
  if (!S.month || !ms.includes(S.month)) S.month = ms[ms.length - 1]
  const rows = classesIn(S.dgrade)
    .map((t) => classMonth(t.id, S.month))
    .sort((a, b) => (b.distance ?? 0) - (a.distance ?? 0))
  const byGain = [...rows].sort((a, b) => (b.gain ?? -1) - (a.gain ?? -1))
  return `<div class="stack"><div class="spread"><div class="row" style="align-items:center"><label class="f" style="margin:0" for="mo">Month</label><select id="mo" class="in" style="width:auto" data-act="pick-month">${ms.map((m) => `<option value="${m}" ${m === S.month ? 'selected' : ''}>${monthName(m)}</option>`).join('')}</select></div>${iconToggle()}</div>
   <div class="panel"><h2>${monthName(S.month)} derby</h2><p class="sub">Classes race on distance: the average share of the gap from baseline to goal their students have closed. Because every class runs from its own starting line, a kindergarten class and a fifth-grade class can share one track fairly.</p>
    <div style="margin-top:14px">${derby(rows.map((r) => ({ label: `${r.t.grade === 'K' ? 'K' : r.t.grade}: ${r.t.name}`, frac: r.distance ?? 0, shown: pct(r.distance) })))}</div>
    <p class="note" style="margin-top:8px">Most improved this month: <b>${esc(byGain[0]?.t.name)}</b> (+${Math.round((byGain[0]?.gain || 0) * 100)} points of distance). Recognize growth publicly. Keep raw scores private.</p></div>
   <div class="panel"><h3>Monthly report by class</h3><div class="tbl-wrap"><table><thead><tr><th>Class</th><th>Skill set</th><th class="num">Distance</th><th class="num">Gained this month</th><th class="num">At goal</th><th class="num">Participation</th><th class="num">Growth / wk</th><th class="num">Need change</th></tr></thead><tbody>
    ${rows.map((r) => `<tr class="click" data-act="open-class" data-t="${r.t.id}"><td><b style="color:${GCOL[r.t.grade]}">●</b> ${esc(r.t.name)}, ${gradeName(r.t.grade)}</td><td>${esc(PR[r.t.probeId].std)}</td><td class="num"><b>${pct(r.distance)}</b></td><td class="num">${r.gain == null ? '–' : (r.gain >= 0 ? '+' : '−') + Math.abs(Math.round(r.gain * 100))}</td><td class="num">${pct(r.atGoal)}</td><td class="num">${pct(r.participation)}</td><td class="num">${r1(r.slope)}</td><td class="num">${r.change || ''}</td></tr>`).join('')}
   </tbody></table></div><p class="note">Select a class to open its teacher dashboard.</p></div></div>`
}
function dImpact() {
  const out = classesIn(S.dgrade).map((t) => {
    const wk = weeksWithData(t.id, t.probeId),
      last4 = wk.slice(-4)
    const pts = last4.map((w) => ({
      x: wIndex(w),
      y: classWeek(t.id, t.probeId, w).median,
    }))
    const notes = DB.notes[t.id] || {}
    const gains = wk
      .slice(0, -1)
      .filter((w) => notes[w])
      .map((w) => {
        const nx = wk[wk.indexOf(w) + 1]
        return {
          w,
          text: notes[w],
          d:
            classWeek(t.id, t.probeId, nx).median -
            classWeek(t.id, t.probeId, w).median,
        }
      })
    const s4 = rosterOf(t.id)
      .map((s) =>
        ols(
          weeklyPoints(s.id, t.probeId)
            .filter((q) => last4.includes(q.w))
            .map((q) => ({ x: q.x, y: q.y })),
        ),
      )
      .filter((v) => v != null)
    return {
      t,
      slope4: mean(s4),
      notes,
      gains,
      cs: classSummary(t.id, t.probeId),
      p: PR[t.probeId],
    }
  })
  const flat = out
    .filter((o) => o.slope4 != null && o.slope4 < o.p.items * 0.01)
    .sort((a, b) => a.slope4 - b.slope4)
  const strong = [...out]
    .filter((o) => o.slope4 != null)
    .sort((a, b) => b.slope4 / b.p.items - a.slope4 / a.p.items)
    .slice(0, 4)
  const allGains = out
    .flatMap((o) => o.gains.map((g) => ({ ...g, t: o.t, p: o.p })))
    .sort((a, b) => b.d / b.p.items - a.d / a.p.items)
    .slice(0, 8)
  const card = (
    o,
  ) => `<div style="border:2px dashed var(--line);border-radius:10px;padding:12px"><div class="spread"><b style="font:700 20px var(--display)">${esc(o.t.name)}, ${gradeName(o.t.grade)}</b><span class="pill ${o.slope4 < o.p.items * 0.01 ? 'p-bad' : 'p-ok'}">${o.slope4 >= 0 ? '+' : ''}${r1(o.slope4)} / wk, last 4</span></div>
    <div class="note">${esc(o.p.label)}. ${o.cs.change} student${o.cs.change === 1 ? '' : 's'} under the aimline 4 Fridays.</div>
    <div style="font-size:14px;margin-top:6px">${
      Object.keys(o.notes)
        .sort()
        .slice(-3)
        .reverse()
        .map((w) => `<div><b>${fmtD(w)}</b>: ${esc(o.notes[w])}</div>`)
        .join('') || '<span class="note">No instruction notes logged.</span>'
    }</div>
    <button class="btn ghost" style="margin-top:8px;padding:4px 10px" data-act="open-class" data-t="${o.t.id}">Open class</button></div>`
  return `<div class="stack">
   <div class="panel"><h3>Classes flat for the last four Fridays</h3><p class="note">Average student growth under 1% of the race per week across the last four Fridays. These are coaching conversations, not evaluations: look at the logged instruction next to the line.</p>
    <div class="grid2" style="margin-top:10px">${flat.length ? flat.map(card).join('') : '<p>No class is flat right now.</p>'}</div></div>
   <div class="panel"><h3>Fastest-growing classes</h3><div class="grid2" style="margin-top:10px">${strong.map(card).join('')}</div></div>
   <div class="panel"><h3>Logged instruction followed by the biggest Friday gains</h3><p class="note">The week a strategy was logged, compared with the next Friday's class median. This shows what to look at, not what caused the gain.</p>
    <div class="tbl-wrap"><table><thead><tr><th>Class</th><th>Week of</th><th>What was taught</th><th class="num">Next Friday median change</th></tr></thead><tbody>${allGains.map((g) => `<tr><td>${esc(g.t.name)}, ${gradeName(g.t.grade)}</td><td>${fmtD(g.w)}</td><td>${esc(g.text)}</td><td class="num">${arrowTbl(g.d)}</td></tr>`).join('')}</tbody></table></div></div></div>`
}
function dGrid() {
  const ms = months(),
    gs = S.dgrade === 'all' ? GRADES : [S.dgrade]
  const cell = (g, m) => {
    const c = DB.teachers
      .filter((t) => t.grade === g)
      .map((t) => classMonth(t.id, m))
    const d = mean(c.map((x) => x.distance).filter((v) => v != null)),
      a = mean(c.map((x) => x.atGoal).filter((v) => v != null))
    return `<td class="num"><b>${pct(a)}</b> at goal<br><span class="note">${pct(d)} distance</span></td>`
  }
  const rows = [
    ['grade', 'month', 'pct_at_goal', 'avg_distance', 'participation'],
  ]
  gs.forEach((g) =>
    ms.forEach((m) => {
      const c = DB.teachers
        .filter((t) => t.grade === g)
        .map((t) => classMonth(t.id, m))
      rows.push([
        g,
        m,
        r1(mean(c.map((x) => x.atGoal).filter((v) => v != null)) * 100),
        r1(mean(c.map((x) => x.distance).filter((v) => v != null)) * 100),
        r1(mean(c.map((x) => x.participation)) * 100),
      ])
    }),
  )
  window._gridRows = rows
  return `<div class="panel"><div class="spread"><h3>Grade by month</h3><div class="row"><button class="btn ghost" data-act="export-grid">Export monthly report (CSV)</button><button class="btn ghost" data-act="export-all">Export every race (CSV)</button><button class="btn gold" data-act="export-ec">Export for eduCLIMBER</button></div></div>
   <div class="tbl-wrap" style="margin-top:10px"><table><thead><tr><th>Grade</th>${ms.map((m) => `<th class="num">${monthName(m)}</th>`).join('')}</tr></thead><tbody>${gs.map((g) => `<tr><td><b style="color:${GCOL[g]}">●</b> ${gradeName(g)}</td>${ms.map((m) => cell(g, m)).join('')}</tr>`).join('')}</tbody></table></div>
   <p class="note">Month values use the last Friday of each month. Partial months show progress to date.</p></div>`
}
function dSettings() {
  return `<div class="stack"><div class="panel stack"><h3>Goals</h3><div class="grid2">
   <div><label class="f" for="gf">Fact races: goal percent correct</label><input id="gf" class="in" type="number" min="50" max="100" value="${Math.round(SETTINGS.goalFact * 100)}"></div>
   <div><label class="f" for="gm">Multi-digit races: goal percent correct</label><input id="gm" class="in" type="number" min="50" max="100" value="${Math.round(SETTINGS.goalMulti * 100)}"></div>
   <div><label class="f" for="gd">Goal date</label><input id="gd" class="in" type="date" value="${SETTINGS.goalDate}"></div>
   <div><label class="f" for="mm">Grade 3-5 fact races: largest factor</label><select id="mm" class="in"><option value="10" ${SETTINGS.multMax == 10 ? 'selected' : ''}>10 (GSE: within 100)</option><option value="12" ${SETTINGS.multMax == 12 ? 'selected' : ''}>12 (beyond GSE)</option></select></div></div>
   <div class="callout">These goals are placeholders until the district sets them from fall baseline data. Georgia does not publish a fluency rate norm for these standards.</div></div>
   <div class="panel"><h3>Race length and timing</h3><p class="note">Draft values. Each needs sign-off from a teacher at that grade before it counts for decisions. Changing a value mid-year breaks comparability with earlier Fridays.</p>
   <div class="tbl-wrap"><table><thead><tr><th>Grade</th><th>Skill set</th><th>Standards</th><th class="num">Problems</th><th class="num">Seconds each</th><th class="num">Race length</th></tr></thead><tbody>
    ${PROBES.map((p) => `<tr><td>${p.grade}</td><td>${esc(p.label)}</td><td>${esc(p.std)}</td><td class="num"><input class="in" style="width:70px" type="number" min="5" max="40" data-tm="${p.id}" data-f="items" value="${p.items}"></td><td class="num"><input class="in" style="width:70px" type="number" min="2" max="180" data-tm="${p.id}" data-f="secs" value="${p.secs}"></td><td class="num">${Math.round((p.items * p.secs) / 6) / 10} min</td></tr>`).join('')}
   </tbody></table></div>
   </div>
   <div class="panel stack"><h3>Race blueprints</h3>
    <p class="note"><b>Fluency standard</b> races match standards the GaDOE curriculum maps flag as fluency. <b>Skill checks</b> are quick foundational skills worth tracking weekly but are not fluency standards. <b>Local expectation</b> marks Grade 3 multiplication and division facts, which Georgia frames as strategy work (3.PAR.3.2-3.3) rather than a fluency standard. Every race uses a balanced form: the same number of problems from each fact family every Friday, drawn without repeats, so a score change means learning changed, not the luck of the draw. Problems still differ for every student and every week.</p>
    <div class="grid2" style="align-items:start">${PROBES.map(
      (p) =>
        `<details style="border:1px solid var(--line);border-radius:8px;padding:8px 12px"><summary><b>${esc(p.label)}</b> <span class="note">${p.grade === 'K' ? 'K' : 'Grade ' + p.grade} · ${esc(p.std)} · ${TYPE_LABEL[p.type]} · ${p.items} problems</span></summary><table style="margin-top:6px"><thead><tr><th>Family</th><th class="num">Problems per race</th><th class="num">Pool</th></tr></thead><tbody>${blueprintRows(
          p,
        )
          .map(
            ([k, n, pool]) =>
              `<tr><td>${esc(k)}</td><td class="num">${n}</td><td class="num">${pool == null ? 'thousands' : pool}</td></tr>`,
          )
          .join('')}</tbody></table></details>`,
    ).join('')}</div>
   </div>
   <div class="panel stack"><h3>Physical rewards</h3>
    <p class="note">Choose which milestones put a student in their teacher's reward queue for a squishy or other physical reward. Everything else stays virtual (gear, trophies, tiers). Check with the federal programs director before using Title I funds for incentives; PTO or donated funds are usually the safer source.</p>
    <div class="grid2">${[
      ['goal', 'Reached their goal on a race'],
      ['tier2', 'Reached Racer tier'],
      ['tier3', 'Reached Champion tier'],
      ['tier4', 'Reached Legend tier'],
      ['practice10', 'Finished 10 practice sessions'],
    ]
      .map(
        ([k, l]) =>
          `<label class="toggle"><input type="checkbox" data-phys="${k}" ${(SETTINGS.physical || PHYS_DEFAULT)[k] ? 'checked' : ''}> ${l}</label>`,
      )
      .join('')}</div></div>
   <div class="panel stack"><h3>Automatic communication</h3>
    <p class="note">Sent from the district Google account by Apps Script triggers. Start in preview mode: every message goes to district admins only, so you can read a full cycle before anything reaches teachers, principals, or families.</p>
    <div class="grid2">
     <label class="toggle"><input type="checkbox" id="c-friday" ${SETTINGS.comms.friday ? 'checked' : ''}> Friday 7:30 a.m. race-day reminder to teachers</label>
     <label class="toggle"><input type="checkbox" id="c-digest" ${SETTINGS.comms.digest ? 'checked' : ''}> Monday 7:00 a.m. digest to principals and admins</label>
     <label class="toggle"><input type="checkbox" id="c-family" ${SETTINGS.comms.family ? 'checked' : ''}> Monthly family report, first Monday (English or Spanish)</label>
     <div><label class="f" for="c-mode">Mode</label><select id="c-mode" class="in"><option value="preview">Preview: send everything to admins only</option><option value="live" ${SETTINGS.comms.mode === 'live' ? 'selected' : ''}>Live: send to teachers, principals, families</option></select></div></div>
    <div class="row"><button class="btn ghost" data-act="preview-comms" data-k="friday">Preview teacher reminder</button><button class="btn ghost" data-act="preview-comms" data-k="digest">Preview Monday digest</button><button class="btn ghost" data-act="preview-comms" data-k="family">Preview family report</button></div>
    <div class="callout red">Before switching family reports to live: confirm family emails are current in the Students tab, and have a Spanish-speaking staff member read the Spanish version once.</div>
   </div>
   <div class="panel stack"><h3>eduCLIMBER export</h3>
    <p class="note">Exports each student's official Friday score (first race of the week, no retakes or practice) as progress monitoring data. Rename the headers below to match MCSS's eduCLIMBER import template exactly; uncheck columns the template does not use.</p>
    <div><label class="f" for="ec-name">Assessment name</label><input id="ec-name" class="in" value="${esc(SETTINGS.ecName)}"></div>
    <div class="tbl-wrap"><table><thead><tr><th>Include</th><th>Data</th><th>Header in the file</th></tr></thead><tbody>${SETTINGS.ecCols.map(([k, h, on], i) => `<tr><td><input type="checkbox" data-ec="${i}" data-f="on" ${on ? 'checked' : ''}></td><td>${esc(k)}</td><td><input class="in" data-ec="${i}" data-f="h" value="${esc(h)}"></td></tr>`).join('')}</tbody></table></div>
   </div>
   <div class="panel">
   <p><button class="btn" data-act="save-settings">Save all settings</button> ${!SERVER ? '<button class="btn ghost" data-act="reset-demo">Reset demo data</button>' : ''}</p></div></div>`
}

/* ================= eduCLIMBER + communication previews ================= */
function ecRows() {
  const cols = SETTINGS.ecCols.filter((c) => c[2]),
    rows = [cols.map((c) => c[1])]
  DB.students.forEach((s) => {
    const t = teacherOf(s.teacherId)
    const pids = new Set(
      DB.attempts.filter((a) => a.sid === s.id).map((a) => a.pid),
    )
    pids.forEach((pid) => {
      const p = PR[pid]
      weeklyPoints(s.id, pid).forEach((q) => {
        const v = {
          sisId: s.sisId || s.id,
          name: s.name,
          school: t.school,
          grade: t.grade,
          teacher: t.name,
          assessment: SETTINGS.ecName,
          measure: `${p.label} (${p.std})`,
          date: q.a.date,
          score: q.y,
          total: q.a.total,
          goal: goalOf(p),
          accom: q.a.accom ? 'Extended time x' + q.a.accom : '',
        }
        rows.push(cols.map((c) => v[c[0]]))
      })
    })
  })
  return rows
}
function previewComms(kind) {
  if (SERVER) {
    API.commsPreview(kind)
      .then((html) =>
        modal(
          `<p class="note">Preview of the message the next trigger will send.</p><div style="border:1px solid var(--line);border-radius:8px;padding:14px">${html}</div>`,
        ),
      )
      .catch((e) => toast(e.message))
    return
  }
  const t = teacherOf(S.tid) || DB.teachers[0],
    lastW = FRIDAYS[FRIDAYS.length - 1]
  if (kind === 'family') {
    const s =
      rosterOf(t.id).find((x) => x.familyLang === 'es') || rosterOf(t.id)[0]
    familyReport(s.id, s.familyLang)
    return
  }
  if (kind === 'friday') {
    const cw = classWeek(t.id, t.probeId, lastW),
      miss = rosterFor(t.id, t.probeId)
        .filter(
          (s) => !weeklyPoints(s.id, t.probeId).some((q) => q.w === lastW),
        )
        .map((s) => s.name)
    modal(
      `<p class="note">To: ${esc(t.email)} · Subject: Race day: Friday Fluency Race</p><div style="border:1px solid var(--line);border-radius:8px;padding:14px"><p>Good morning ${esc(t.name)},</p><p>Today is race day for ${esc(t.classCode)}. Students open the race from your Google Classroom post, or here: ${esc(baseUrl() + '?class=' + t.classCode)}</p><p>Last Friday ${cw.tested} of ${cw.n} students raced.${miss.length ? ' Missed last week: ' + esc(miss.join(', ')) + '.' : ''}</p><p>After school, open the Friday check and log what you taught this week.</p></div>`,
    )
    return
  }
  const rows = DB.teachers.map((t) => ({
    t,
    c: classWeek(t.id, t.probeId, lastW),
    cs: classSummary(t.id, t.probeId),
  }))
  modal(`<p class="note">To: district admins and principals · Subject: Fluency digest, week of ${fmtD(lastW)}</p><div style="border:1px solid var(--line);border-radius:8px;padding:14px"><p>${rows.reduce((a, r) => a + r.c.tested, 0)} of ${rows.reduce((a, r) => a + r.c.n, 0)} students raced on ${fmtD(lastW)}.</p>
   <table><thead><tr><th>Class</th><th class="num">Raced</th><th class="num">Median</th><th class="num">At goal</th><th class="num">Need change</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.t.name)}, ${gradeName(r.t.grade)}</td><td class="num">${r.c.tested}/${r.c.n}</td><td class="num">${r1(r.c.median)}</td><td class="num">${pct(r.c.atGoal)}</td><td class="num">${r.cs.change || ''}</td></tr>`).join('')}</tbody></table>
   <p class="note">Open the district dashboard for the monthly derby and instruction notes.</p></div>`)
}

/* ================= events ================= */
function render() {
  renderMast()
  if (S.view === 'setup') renderPilotSetup()
  else if (S.view === 'student') renderStudent()
  else if (S.view === 'district') renderDistrict()
  else renderTeacher()
}
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]')
  if (!el) return
  const a = el.dataset.act
  if (a === 'close-modal') {
    if (e.target === el || el.tagName === 'BUTTON') $('#layer').innerHTML = ''
    return
  }
  switch (a) {
    case 'view': {
      const v = el.dataset.v
      if (PILOT && v === 'teacher' && !S.unlocked) {
        pilotAskPin(() => {
          S.view = 'teacher'
          if (!teacherOf(S.tid)) S.tid = DB.teachers[0].id
          render()
          window.scrollTo(0, 0)
        })
        break
      }
      if (PILOT && v === 'student') {
        S.unlocked = false
        S.view = 'student'
        if (DB.teachers.length === 1) {
          K.tid = DB.teachers[0].id
          K.stage = 'who'
        } else K.stage = 'join'
        render()
        window.scrollTo(0, 0)
        break
      }
      S.view = v
      if (S.view === 'student') {
        K.stage = 'join'
      }
      render()
      window.scrollTo(0, 0)
      break
    }
    case 'ps-create':
    case 'ps-import-first':
    case 'pin-ok':
    case 'pl-download':
    case 'pl-text':
    case 'pl-import':
    case 'pl-addclass':
    case 'pl-pin':
    case 'pl-erase':
      pilotAct(a, el)
      break
    case 'tab':
      S.tab = el.dataset.t
      render()
      break
    case 'dtab':
      S.dtab = el.dataset.t
      render()
      break
    case 'open-student':
      S.sid = el.dataset.s
      S.tab = 'student'
      render()
      window.scrollTo(0, 0)
      break
    case 'open-class':
      S.tid = el.dataset.t
      S.view = 'teacher'
      S.tab = 'friday'
      S.pid = null
      S.week = null
      render()
      window.scrollTo(0, 0)
      break
    case 'icon':
      S.icon = el.dataset.i
      render()
      break
    case 'dgrade-go':
      S.dgrade = el.dataset.g
      render()
      break
    case 'save-note':
      await API.saveNote(S.tid, S.week, $('#note').value.trim())
      toast('Note saved')
      render()
      break
    case 'save-probe': {
      const pid = $('#probe').value
      await API.setProbe(S.tid, pid)
      S.pid = pid
      toast('Race saved: ' + PR[pid].label)
      render()
      break
    }
    case 'copy-link': {
      const v = $('#link').value
      try {
        await navigator.clipboard.writeText(v)
        toast('Link copied')
      } catch (err) {
        $('#link').select()
        toast('Press Ctrl+C to copy')
      }
      break
    }
    case 'copy-csv': {
      const ta = $('#layer textarea')
      try {
        await navigator.clipboard.writeText(ta.value)
        toast('CSV copied')
      } catch (err) {
        ta.select()
        toast('Press Ctrl+C to copy')
      }
      break
    }
    case 'export': {
      const t = teacherOf(S.tid)
      exportCsv(
        attemptRows((a) => studentOf(a.sid)?.teacherId === t.id),
        t.name + ' race data',
      )
      break
    }
    case 'export-all':
      exportCsv(
        attemptRows(() => true),
        'Every race, all classes',
      )
      break
    case 'export-grid':
      exportCsv(window._gridRows, 'Grade by month report')
      break
    case 'add-students': {
      const names = $('#newnames')
        .value.split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      if (!names.length) return
      await API.addStudents(S.tid, names)
      toast(names.length + ' added')
      render()
      break
    }
    case 'items':
      showItems(el.dataset.a)
      break
    case 'approve-name':
      await API.approveName(el.dataset.s, el.dataset.ok === '1')
      toast(
        el.dataset.ok === '1'
          ? 'Name approved'
          : 'Student will pick another name',
      )
      render()
      break
    case 'deliver':
      await API.markDelivered(el.dataset.s, el.dataset.k)
      toast('Marked as given')
      render()
      break
    case 'edit-student':
      studentModal(el.dataset.s)
      break
    case 'save-student': {
      const sid = el.dataset.s
      await API.updateStudent(sid, {
        probeId: $('#sm-race').value,
        accom: { x: +$('#sm-x').value, read: $('#sm-read').checked },
        familyEmail: $('#sm-email').value.trim(),
        familyLang: $('#sm-lang').value,
        sisId: $('#sm-sis').value.trim(),
      })
      $('#layer').innerHTML = ''
      toast('Settings saved')
      render()
      break
    }
    case 'bulk-race': {
      const ids = [...document.querySelectorAll('.bulk:checked')].map(
          (i) => i.value,
        ),
        pid = $('#bulkrace').value
      if (!ids.length) {
        toast('Check at least one student')
        break
      }
      for (const id of ids) await API.updateStudent(id, { probeId: pid })
      toast(ids.length + ' updated')
      render()
      break
    }
    case 'flex-check':
      flexModal(el.dataset.s)
      break
    case 'flex-level':
      S.flexDraft.level = +el.dataset.l
      document
        .querySelectorAll('[data-act=flex-level]')
        .forEach((b) => b.setAttribute('aria-pressed', b === el))
      break
    case 'save-flex': {
      const d = S.flexDraft
      if (!d || !d.level) {
        toast('Tap what you heard first')
        break
      }
      await API.saveFlex({
        id: 'f' + d.sid + Date.now(),
        sid: d.sid,
        pid: d.pid,
        date: todayIso(),
        prompt: d.prompt,
        level: d.level,
        note: $('#flexnote').value.trim(),
      })
      $('#layer').innerHTML = ''
      toast('Check saved')
      render()
      break
    }
    case 'family':
      familyReport(el.dataset.s, el.dataset.l)
      break
    case 'print-family':
      document.body.classList.add('print-family')
      window.print()
      setTimeout(() => document.body.classList.remove('print-family'), 500)
      break
    case 'export-ec':
      exportCsv(ecRows(), 'eduCLIMBER progress monitoring export')
      break
    case 'preview-comms':
      previewComms(el.dataset.k)
      break
    case 'print':
      window.print()
      break
    case 'save-settings': {
      const timing = {}
      document.querySelectorAll('[data-tm]').forEach((i) => {
        const id = i.dataset.tm
        timing[id] = timing[id] || {}
        timing[id][i.dataset.f] = +i.value
      })
      const ecCols = SETTINGS.ecCols.map(([k, h, on], i) => [
        k,
        document.querySelector(`[data-ec="${i}"][data-f="h"]`).value.trim() ||
          h,
        document.querySelector(`[data-ec="${i}"][data-f="on"]`).checked ? 1 : 0,
      ])
      await API.saveSettings({
        goalFact: +$('#gf').value / 100,
        goalMulti: +$('#gm').value / 100,
        goalDate: $('#gd').value,
        multMax: +$('#mm').value,
        timing,
        ecCols,
        ecName: $('#ec-name').value.trim() || SETTINGS.ecName,
        physical: Object.fromEntries(
          [...document.querySelectorAll('[data-phys]')].map((i) => [
            i.dataset.phys,
            i.checked,
          ]),
        ),
        comms: {
          friday: $('#c-friday').checked,
          digest: $('#c-digest').checked,
          family: $('#c-family').checked,
          mode: $('#c-mode').value,
        },
      })
      toast('Goals and timing saved')
      render()
      break
    }
    case 'reset-demo':
      if (confirm('Clear your demo races, notes, and settings?'))
        API.resetDemo()
      break
    /* student */
    case 'k-code':
      $('#code').value = el.dataset.c
      joinClass()
      break
    case 'k-join':
      joinClass()
      break
    case 'k-back':
      K.stage = 'join'
      renderStudent()
      break
    case 'k-who':
      K.sid = el.dataset.s
      K.nd = null
      K.stab = 'gear'
      K.slot = stableOf(K.sid).rideChosen ? 'blanket' : 'ride'
      /* students who have not picked a racer land on the racer choice */ if (
        SERVER
      ) {
        try {
          await API.studentState(teacherOf(K.tid).classCode, K.sid)
        } catch (err) {}
      }
      K.mode = PR[effPid(studentOf(K.sid))].grade === 'K' ? 'tap' : K.mode
      K.stage = stableOf(K.sid).name ? 'stable' : 'name'
      renderStudent()
      break
    case 'k-kname':
    case 'k-name-ok':
    case 'k-na':
    case 'k-nb':
    case 'k-name-custom':
    case 'k-rename':
    case 'k-stable':
    case 'k-stab':
    case 'k-slot':
    case 'k-ride':
    case 'k-silk':
    case 'k-coat':
    case 'k-gear':
      stableAct(a, el)
      break
    case 'k-mode':
      K.mode = el.dataset.m
      renderStudent()
      break
    case 'k-gate':
      K.stage = 'gate'
      renderStudent()
      break
    case 'k-start':
      startLights()
      break
    case 'k-practice':
      try {
        speechSynthesis.cancel()
      } catch (e) {}
      startPractice()
      break
    case 'k-psubmit':
      practiceCheck()
      break
    case 'k-pstop':
      finishPractice()
      break
    case 'k-retake':
      K.allowRetake = true
      renderStudent()
      break
    case 'k-sel':
      selectChoice(cval(el.dataset.v))
      break
    case 'k-submit': {
      const v = pending()
      if (v == null && K.R.p.input !== 'place') {
        toast('Choose an answer first')
        break
      }
      answer(K.R.p.input === 'place' ? K.R.placed.length : v)
      break
    }
    case 'k-place':
      placeCritter(+el.dataset.i)
      break
    case 'k-unplace':
      unplaceCritter(+el.dataset.i)
      break
    case 'k-say':
      say(el.dataset.t)
      break
    case 'k-say-item': {
      const it = K.R?.items[K.R.i]
      if (it) say(it.say || it.prompt)
      break
    }
    case 'k-digit':
      padInput(el.dataset.d)
      break
    case 'k-del':
      padInput('del')
      break
    case 'k-enter':
      padInput('enter')
      break
    case 'k-review':
      K.stage = 'review'
      renderStudent()
      window.scrollTo(0, 0)
      break
    case 'k-finish':
      try {
        speechSynthesis.cancel()
      } catch (e) {}
      K.sid = null
      K.R = null
      K.stage = SERVER ? 'join' : 'who'
      renderStudent()
      window.scrollTo(0, 0)
      break
  }
})
document.addEventListener('change', (e) => {
  const el = e.target,
    a = el.dataset.act
  if (!a) return
  if (a === 'pick-teacher') {
    S.tid = el.value
    S.pid = null
    S.week = null
    S.sid = null
    render()
  } else if (a === 'pick-probe') {
    S.pid = el.value
    S.week = null
    render()
  } else if (a === 'pick-week') {
    S.week = el.value
    render()
  } else if (a === 'pick-month') {
    S.month = el.value
    render()
  } else if (a === 'pick-student') {
    S.sid = el.value
    render()
  } else if (a === 'anon') {
    S.anon = el.checked
    render()
  } else if (a === 'dgrade') {
    S.dgrade = el.value
    render()
  } else if (a === 'ps-grade') {
    pilotAct('ps-grade', el)
  } else if (a === 'k-missed' || a === 'k-key') {
    if (a === 'k-missed') K.missedOnly = el.checked
    else K.hideKey = el.checked
    if (K.stage === 'review' && S.view === 'student') renderStudent()
    else if (window._rev) showReview(...window._rev)
  }
})
document.addEventListener('change', (e) => {
  if (e.target.id === 'probe') {
    const d = $('#pdesc'),
      q = PR[e.target.value]
    if (d)
      d.innerHTML = `<span class="pill ${q.type === 'fluency' ? 'p-ok' : q.type === 'local' ? 'p-warn' : 'p-sky'}">${TYPE_LABEL[q.type]}</span> ${esc(q.desc)}`
  }
})

/* ================= boot ================= */
async function boot() {
  $('#app').innerHTML =
    '<div class="wrap" style="padding:40px 20px"><p>Loading the track…</p></div>'
  const qs = Object.fromEntries(new URLSearchParams(location.search))
  if (SERVER) {
    await new Promise((res) => {
      try {
        google.script.url.getLocation((l) => {
          Object.assign(PARAMS, l.parameter || {})
          res()
        })
      } catch (e) {
        res()
      }
    })
  } else Object.assign(PARAMS, qs)
  try {
    await API.boot(PARAMS)
  } catch (err) {
    $('#app').innerHTML =
      `<div class="wrap" style="padding:40px 20px"><h2>The app could not load.</h2><p>${esc(err.message || err)}</p></div>`
    return
  }
  if (SERVER) {
    if (DB.role === 'teacher') {
      S.view = 'teacher'
      S.tid = DB.me
    } else if (DB.role === 'district') {
      S.view = 'district'
      S.tid = DB.teachers[0]?.id
    } else {
      S.view = 'student'
    }
  } else if (PILOT) {
    pilotPrepare()
    if (!DB.teachers.length) {
      S.view = 'setup'
      render()
      return
    }
    S.tid = DB.teachers[0].id
    S.view = 'student'
    if (DB.teachers.length === 1) {
      K.tid = S.tid
      K.stage = 'who'
      render()
      return
    }
  } else {
    S.tid = (
      DB.teachers.find((t) => t.name === 'Ms. Hayes') || DB.teachers[0]
    ).id
    if (PARAMS.view) S.view = PARAMS.view
  }
  if (SERVER && DB.role === 'student' && DB.autoClass && !PARAMS.class)
    K.code = String(DB.autoClass).toUpperCase()
  if (PARAMS.class) {
    S.view = 'student'
    K.code = PARAMS.class.toUpperCase()
  }
  render()
  if (S.view === 'student' && K.code) joinClass()
}

