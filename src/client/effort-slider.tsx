/**
 * Segment slider for one model line's reasoning effort (the 改造 of the retired
 * per-line `<select>`).
 *
 * Interaction follows the approved dsh-reasoning-effort visual spec: the thumb
 * follows the pointer CONTINUOUSLY and snaps to a stop on release (one
 * `directory.select` per gesture), the plain thumb is pure white in every
 * theme, the full thumb stays visible at both track endpoints, and
 * reduced-motion freezes motion. Deviations requested for this plugin: the
 * stop count adapts to the model's advertised efforts (not a fixed triple),
 * `auto` is pinned leftmost (see `orderEffortsForSlider`), and the whale-girl
 * runner thumb is per-line — DeepSeek lines run the 8-frame strip, every other
 * model gets the plain knob.
 *
 * The track carries the reference plugin's signature FX, ported from its
 * published bundle: a procedural canvas "radiation" (three sine waves with a
 * sharp crest, exponential trail decay from the thumb, a 4px pixel grid with
 * grain, 14 particle streaks flying left, and a radial glow at the thumb — all
 * clipped LEFT of the thumb, screen-blended over the track, pixelated), a CSS
 * flare at the thumb, theme-split tracks via `body[data-ds-dark-theme]`, a
 * light-theme progress fill, and a `[data-top]` breathe pulse. Dragging speeds
 * and brightens everything. The canvas runs a rAF loop unless
 * `prefers-reduced-motion` is set (then single frames on change).
 *
 * Inline styling only (no CSS modules in the client bundle) — everything a
 * stylesheet needs (pseudo-elements, keyframes, theme selectors, blend modes)
 * is injected once into `document.head` under a plugin-prefixed id. All math
 * is defensive: a render throw here would abdicate the whole model-seat entry
 * back to the shipped selector.
 */
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, JSX, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import { nearestEffortStopIndex } from '../thinking-level.ts'
import { WHALE_RUN_STRIP, WHALE_RUN_STRIP_SRC } from './whale-mascot.ts'

/** One ordered stop of the track (already run through `orderEffortsForSlider`). */
export interface EffortStop {
  id: string
  name: string
}

export interface EffortSliderProps {
  /** Ordered left → right; `auto` first, unknown wire values last. */
  stops: readonly EffortStop[]
  /** The line's effective effort (current selection, else the model default). */
  value: string | undefined
  /** true = whale-girl runner thumb (DeepSeek lines); false = plain white knob. */
  mascot: boolean
  /** Frozen while a route write is in flight. */
  disabled: boolean
  /** Commit the picked stop id (once per gesture / keypress). */
  onCommit: (id: string) => void
  /** Locale copy thunk. */
  t: (key: string) => string
}

/* ── geometry (CSS px) ──────────────────────────────────────────────────── */

/** Editor-row zone height: label row + track + headroom for the standing girl. */
const ZONE_H = 74
/** Track thickness; sits `TRACK_B` px above the zone bottom (above the 14px label row).
 * Proportioned like the reference (track ≈ knob height), not a thin wire. */
const TRACK_H = 24
const TRACK_B = 16
/** Horizontal inset keeping the thumb fully visible at both endpoint stops. */
const PAD_MASCOT = 18
const PAD_KNOB = 14
/** Thumb metrics. */
const GIRL_W = WHALE_RUN_STRIP.frameW / 2
const GIRL_H = WHALE_RUN_STRIP.frameH / 2
const GIRL_B = TRACK_B + TRACK_H / 2 - 4
const KNOB = 28
/** Flare pill sized to OUR track (the reference's 78×46 assumed a 30px track). */
const FLARE_W = 60
const FLARE_H = 36
/** Label row height under the track. */
const LABEL_H = 14
/** Strip footprint in CSS px (asset is 2x). */
const STRIP_CSS_W = (WHALE_RUN_STRIP.frameW * WHALE_RUN_STRIP.frames) / 2
const STRIP_CSS_H = WHALE_RUN_STRIP.frameH / 2

const KEYFRAMES_ID = 'dsh-thinking-levels-effort-slider'
const ZONE_CLASS = 'dsh-tl-zone'
const RUN_CLASS = 'dsh-tl-run'
const GIRL_CLASS = 'dsh-tl-girl'
const KNOB_CLASS = 'dsh-tl-knob'
const TRACK_CLASS = 'dsh-tl-track'
const FILL_CLASS = 'dsh-tl-fill'
const CANVAS_CLASS = 'dsh-tl-canvas'
const FLARE_CLASS = 'dsh-tl-flare'
const RUN_KEYFRAMES = 'dsh-tl-whale-run-keyframes'

/**
 * The effect stylesheet: radiation track themes (dark violet gradient vs pale
 * blue + progress fill), the screen-blended pixelated canvas, the flare with
 * its cross streaks, dragging boosts, the `[data-top]` breathe pulses, the
 * girl's run cycle with drop-shadow glow, and the reduced-motion freezes.
 */
const EFFECT_CSS = `
.${ZONE_CLASS}:focus-visible { outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 2px; }
.${TRACK_CLASS} {
  border-radius: 999px;
  overflow: hidden;
  isolation: isolate;
  background: linear-gradient(100deg, #03040a 0%, #071126 22%, #101d4c 45%, #302262 70%, #5d35a0 100%);
  box-shadow:
    inset 0 1px 0 rgba(189, 199, 255, .15),
    inset 0 -1px 0 rgba(0, 0, 0, .55),
    0 3px 10px rgba(12, 17, 55, .34);
}
body[data-ds-dark-theme] .${TRACK_CLASS}::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 18% 45%, rgba(82, 130, 255, .12), transparent 24%),
    linear-gradient(90deg, rgba(0, 0, 0, .28), transparent 42%, rgba(168, 113, 255, .12));
}
body:not([data-ds-dark-theme]) .${TRACK_CLASS} {
  /* Gradient base even at 0% progress: LIGHT blue at the left deepening
     toward DARK blue at the right (matches the progress direction). */
  background: linear-gradient(90deg, #d9eafc 0%, #b3d3f5 40%, #6ba6e8 78%, #4080d8 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, .9),
    inset 0 0 0 1px rgba(80, 133, 194, .14),
    0 3px 10px rgba(48, 101, 165, .13);
}
.${FILL_CLASS} {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: var(--dsh-tl-progress, 0%);
  border-radius: inherit;
  background: linear-gradient(90deg, #ffffff 0%, #d7eaff 18%, #75afea 54%, #0751ad 100%);
  transition: width 190ms cubic-bezier(.22, 1, .36, 1);
  display: none;
}
body:not([data-ds-dark-theme]) .${FILL_CLASS} { display: block; }
.${CANVAS_CLASS} {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  mix-blend-mode: screen;
  pointer-events: none;
  transition: filter 140ms ease;
}
/* Screen only LIGHTENS — over the pale light-theme track it would wash the
   radiation out; paint it directly there. */
body:not([data-ds-dark-theme]) .${CANVAS_CLASS} { mix-blend-mode: normal; }
.${FLARE_CLASS} {
  position: absolute;
  width: ${FLARE_W}px;
  height: ${FLARE_H}px;
  border-radius: 50%;
  background: radial-gradient(ellipse at 100% 50%, rgba(255,255,255,.96) 0 4%, rgba(188,189,255,.8) 11%, rgba(106,87,255,.5) 28%, rgba(105,31,255,.2) 49%, transparent 74%);
  filter: blur(1.5px) saturate(1.25);
  mix-blend-mode: screen;
  transform: translate(-100%, -50%);
  transition: left 70ms linear, filter 140ms ease;
  pointer-events: none;
}
.${FLARE_CLASS}::before,
.${FLARE_CLASS}::after {
  content: "";
  position: absolute;
  inset: 50% auto auto 100%;
  border-radius: 999px;
  transform: translate(-50%, -50%);
}
.${FLARE_CLASS}::before {
  width: 52px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(100,160,255,.42), #f1ecff, rgba(193,82,255,.65), transparent);
  box-shadow: 0 0 7px #9b7cff, 0 0 13px rgba(72,132,255,.64);
}
.${FLARE_CLASS}::after {
  width: 1px;
  height: 20px;
  background: linear-gradient(180deg, transparent, rgba(196,190,255,.84), transparent);
  box-shadow: 0 0 7px #9c7cff;
}
.${ZONE_CLASS}[data-drag="1"] .${CANVAS_CLASS} { filter: saturate(1.45) brightness(1.28) contrast(1.06); }
.${ZONE_CLASS}[data-drag="1"] .${FLARE_CLASS} { filter: blur(1.5px) saturate(1.6) brightness(1.42); transition: none; }
.${KNOB_CLASS} {
  border-radius: 50%;
  background: #fff;
  border: 1px solid rgba(255, 255, 255, .94);
  box-shadow:
    0 0 0 2px rgba(92, 105, 255, .12),
    0 0 14px rgba(121, 82, 255, .48),
    0 2px 7px rgba(0, 0, 0, .3);
  transition: left 190ms cubic-bezier(.22, 1, .36, 1), transform 160ms ease, box-shadow 180ms ease;
}
.${ZONE_CLASS}[data-drag="1"] .${KNOB_CLASS} {
  transform: translateX(-50%) scale(1.07);
  transition: none;
  box-shadow:
    0 0 0 3px rgba(113, 115, 255, .25),
    0 0 20px rgba(74, 145, 255, .86),
    0 0 31px rgba(171, 53, 255, .66),
    0 3px 8px rgba(0, 0, 0, .32);
}
.${ZONE_CLASS}[data-top="1"] .${TRACK_CLASS} { animation: dsh-tl-dark-breathe 1.9s ease-in-out infinite; }
@keyframes dsh-tl-dark-breathe {
  0%, 100% { box-shadow: inset 0 1px 0 rgba(196,204,255,.16), 0 3px 10px rgba(18,25,72,.4); }
  50% { box-shadow: inset 0 1px 0 rgba(220,214,255,.24), 0 0 21px rgba(111,66,255,.5); }
}
body:not([data-ds-dark-theme]) .${ZONE_CLASS}[data-top="1"] .${TRACK_CLASS} { animation-name: dsh-tl-light-breathe; }
@keyframes dsh-tl-light-breathe {
  0%, 100% { box-shadow: inset 0 1px 0 rgba(255,255,255,.9), inset 0 0 0 1px rgba(67,124,193,.16), 0 3px 10px rgba(48,101,165,.13); }
  50% { box-shadow: inset 0 1px 0 rgba(255,255,255,.95), inset 0 0 0 1px rgba(67,124,193,.22), 0 3px 10px rgba(31,102,190,.22), 0 0 19px rgba(31,105,201,.24); }
}
.${RUN_CLASS} { animation: ${RUN_KEYFRAMES} 0.72s steps(8, end) infinite alternate; }
@keyframes ${RUN_KEYFRAMES} {
  from { background-position-x: 0; }
  to { background-position-x: -${STRIP_CSS_W}px; }
}
.${GIRL_CLASS} {
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, .28)) drop-shadow(0 0 5px rgba(92, 105, 255, .34));
  transform-origin: 50% 68%;
  transition: left 190ms cubic-bezier(.22, 1, .36, 1);
}
.${ZONE_CLASS}[data-drag="1"] .${GIRL_CLASS} {
  animation-duration: 0.42s;
  transition: none;
  filter: drop-shadow(0 2px 1px rgba(0, 0, 0, .28)) drop-shadow(0 0 8px rgba(87, 137, 255, .68));
}
@media (prefers-reduced-motion: reduce) {
  .${ZONE_CLASS}[data-top="1"] .${TRACK_CLASS} { animation: none; }
  .${RUN_CLASS} { animation: none; }
  .${FLARE_CLASS}, .${FILL_CLASS}, .${KNOB_CLASS} { transition: none; }
}
`

let styleInjected = false

/** Inject the effect stylesheet once per document. */
function ensureEffectStyle(): void {
  if (styleInjected || document.getElementById(KEYFRAMES_ID) !== null) {
    styleInjected = true
    return
  }
  const style = document.createElement('style')
  style.id = KEYFRAMES_ID
  style.textContent = EFFECT_CSS
  document.head.appendChild(style)
  styleInjected = true
}

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

/* ── the radiation canvas (ported from dsh-reasoning-effort) ────────────── */

interface RadiationState {
  /** Thumb x in canvas CSS px (already padded). */
  origin: number
  dragging: boolean
}

/**
 * Draw one frame of the track FX: sine-wave columns with a sharp crest and an
 * exponential trail decaying from the thumb, a 4px pixel grid with grain and a
 * radial halo around the thumb, particle streaks streaming LEFT, and a radial
 * glow at the origin — everything clipped LEFT of the thumb, theme-split by
 * the harness `data-ds-dark-theme` body attribute.
 */
function drawRadiation(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  state: RadiationState,
): void {
  const origin = state.origin
  const isDark = document.body.hasAttribute('data-ds-dark-theme')
  const cell = 4
  const speed = state.dragging ? 2.8 : 1
  context.clearRect(0, 0, width, height)
  if (origin <= 0) return
  context.save()
  context.beginPath()
  context.rect(0, 0, origin, height)
  context.clip()
  for (let x = 0; x < origin; x += cell) {
    const delta = x + cell * 0.5 - origin
    const distance = Math.abs(delta)
    const phaseA = distance / 10 - time * 74e-4 * speed
    const phaseB = distance / 23 - time * 41e-4 * speed + 1.7
    const phaseC = distance / 40 - time * 22e-4 * speed + 3.4
    const sinA = Math.max(0, Math.sin(phaseA))
    const sinB = Math.max(0, Math.sin(phaseB))
    const sinC = Math.max(0, Math.sin(phaseC))
    const waveA = Math.pow(sinA, 2.6)
    const waveB = Math.pow(sinB, 3.2)
    const waveC = Math.pow(sinC, 4)
    const crest = Math.pow(sinA, 15) + Math.pow(sinB, 18) * 0.78
    const wave = Math.min(1, waveA * 0.76 + waveB * 0.58 + waveC * 0.32)
    const trail = 0.38 + 0.62 * Math.exp(-distance / Math.max(55, width * 0.72))
    const pillar = Math.pow(Math.max(0, Math.sin(x / 20 + time * 16e-4)), 3) * 0.27
    const columnEnergy = trail * (wave * 1.04 + pillar + crest * 0.32)
    if (columnEnergy > 0.012) {
      const nearness = Math.max(0, 1 - distance / Math.max(1, width * 0.78))
      const red = isDark ? Math.round(42 + 124 * nearness + 75 * wave) : Math.round(28 + 58 * nearness + 15 * wave)
      const green = isDark ? Math.round(56 + 58 * nearness + 44 * crest) : Math.round(88 + 72 * nearness + 30 * crest)
      const blue = isDark ? Math.round(175 + 72 * nearness + 8 * wave) : Math.round(182 + 62 * nearness)
      const alpha = isDark ? Math.min(0.88, columnEnergy * 0.72) : Math.min(0.9, columnEnergy * 0.85)
      context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`
      context.fillRect(x, 0, cell - 1, height)
    }
    for (let y = 0; y < height; y += cell) {
      const deltaY = y + cell * 0.5 - height * 0.5
      const radial = Math.hypot(delta / 38, deltaY / 11)
      const halo = Math.exp(-radial * 0.96) * 1.08
      const verticalShape = 0.58 + 0.42 * Math.cos(deltaY / height * Math.PI)
      const grain = 0.72 + 0.28 * Math.sin(x * 0.73 + y * 1.31 + time * 6e-3)
      const alpha = Math.min(0.96, (columnEnergy * 0.88 + halo + crest * 0.19) * verticalShape * grain)
      if (alpha < 0.035) continue
      const hot = Math.max(0, 1 - radial / 2.4)
      const red = isDark ? Math.round(54 + 148 * hot + 42 * wave + 35 * crest) : Math.round(20 + 92 * hot + 18 * wave)
      const green = isDark ? Math.round(68 + 78 * hot + 46 * crest) : Math.round(78 + 80 * hot + 30 * crest)
      const blue = isDark ? Math.round(186 + 64 * hot) : Math.round(188 + 62 * hot)
      context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${isDark ? alpha : alpha * 0.95})`
      context.fillRect(x, y, cell - 1, cell - 1)
    }
  }
  for (let i = 0; i < 14; i += 1) {
    const travel = (time * (state.dragging ? 0.16 : 0.065) * (0.78 + i % 5 * 0.09) + i * 23) % Math.max(30, origin + 64)
    const particleX = origin - travel
    if (particleX < -24 || particleX > width + 16) continue
    const particleY = 3 + (i * 13 + Math.sin(time * 3e-3 + i) * 5) % Math.max(7, height - 6)
    const length = 4 + i % 4 * 4 + (state.dragging ? 6 : 0)
    const alpha = 0.28 + i % 5 * 0.1
    const streak = context.createLinearGradient(particleX, 0, particleX + length, 0)
    streak.addColorStop(0, isDark ? 'rgba(72,118,255,0)' : 'rgba(24,94,184,0)')
    streak.addColorStop(0.68, isDark ? `rgba(112,135,255,${alpha})` : `rgba(36,108,202,${alpha * 0.72})`)
    streak.addColorStop(1, isDark ? `rgba(236,222,255,${Math.min(1, alpha + 0.26)})` : `rgba(103,175,248,${Math.min(0.82, alpha + 0.18)})`)
    context.fillStyle = streak
    context.fillRect(particleX, particleY, length, i % 3 === 0 ? 2 : 1)
  }
  const glow = context.createRadialGradient(origin, height / 2, 0, origin, height / 2, 24)
  glow.addColorStop(0, isDark ? 'rgba(255,255,255,.82)' : 'rgba(255,255,255,.86)')
  glow.addColorStop(0.14, isDark ? 'rgba(183,190,255,.54)' : 'rgba(162,210,255,.48)')
  glow.addColorStop(0.44, isDark ? 'rgba(103,74,255,.28)' : 'rgba(37,112,207,.22)')
  glow.addColorStop(1, isDark ? 'rgba(86,31,210,0)' : 'rgba(25,91,181,0)')
  context.fillStyle = glow
  context.fillRect(origin - 26, 0, 52, height)
  context.restore()
}

/* ── inline styles (positioning only; looks live in the injected sheet) ─── */

const zoneStyle: CSSProperties = {
  position: 'relative',
  flex: '1 1 auto',
  minWidth: '100px',
  height: `${ZONE_H}px`,
  // Contain the screen-blended canvas/flare layers: they must blend with the
  // track only, never with sibling model rows, and the zone must not lose the
  // stacking race against neighboring popup content.
  isolation: 'isolate',
  zIndex: 1,
  touchAction: 'none',
  userSelect: 'none',
  WebkitUserSelect: 'none',
}

const zoneDisabledStyle: CSSProperties = { ...zoneStyle, opacity: 0.55, cursor: 'default' }
const zoneActiveStyle: CSSProperties = { ...zoneStyle, cursor: 'pointer' }

const girlStyle: CSSProperties = {
  position: 'absolute',
  width: `${GIRL_W}px`,
  height: `${GIRL_H}px`,
  backgroundImage: `url(${WHALE_RUN_STRIP_SRC})`,
  backgroundSize: `${STRIP_CSS_W}px ${STRIP_CSS_H}px`,
  backgroundRepeat: 'no-repeat',
  transform: 'translateX(-50%)',
  pointerEvents: 'none',
}

const knobStyle: CSSProperties = {
  position: 'absolute',
  width: `${KNOB}px`,
  height: `${KNOB}px`,
  transform: 'translateX(-50%)',
  pointerEvents: 'none',
  boxSizing: 'border-box',
}

const labelStyle: CSSProperties = {
  position: 'absolute',
  bottom: '0',
  height: `${LABEL_H}px`,
  lineHeight: `${LABEL_H}px`,
  fontSize: '10px',
  color: 'var(--dsw-alias-label-tertiary)',
  whiteSpace: 'nowrap',
  transform: 'translateX(-50%)',
  pointerEvents: 'none',
}

const labelActiveStyle: CSSProperties = {
  ...labelStyle,
  color: 'var(--dsw-alias-state-business-primary)',
  fontWeight: 600,
}

/**
 * The effort slider for one model line. Renders `null` for an empty stop list —
 * a thrown render would abdicate the whole model-seat entry.
 */
export function EffortSlider({ stops, value, mascot, disabled, onCommit, t }: EffortSliderProps): JSX.Element | null {
  const [dragPos, setDragPos] = useState<number | null>(null)
  // Mirror for the pointer handlers: React state can lag one native event, which
  // would make a fast down→move→up gesture drop frames (or the release no-op).
  const dragRef = useRef<number | null>(null)
  const [keyIndex, setKeyIndex] = useState<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  // Live FX state for the canvas loop, immune to stale handler closures.
  const fractionRef = useRef(0)
  const draggingRef = useRef(false)
  const padRef = useRef(mascot ? PAD_MASCOT : PAD_KNOB)
  // Set by the canvas effect; one static frame per render under reduced motion.
  const redrawRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    redrawRef.current?.()
  })

  /**
   * The canvas FX loop: dpr-aware resize, theme-following redraws, one rAF
   * frame per tick — or static single frames when the user prefers reduced
   * motion. Everything dies with the effect (the editor row unmount). Mounted
   * before the empty-stops early return: hooks must run unconditionally (with
   * no stops the canvas never renders and the effect no-ops).
   */
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const context = canvas.getContext('2d')
    if (context === null) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let width = 1
    let height = 1
    let frame = 0
    const resize = (): void => {
      const bounds = canvas.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = Math.max(1, bounds.width)
      height = Math.max(1, bounds.height)
      canvas.width = Math.max(1, Math.round(width * ratio))
      canvas.height = Math.max(1, Math.round(height * ratio))
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    const draw = (time = performance.now()): void => {
      // The canvas fills the padded track, so the thumb's fraction maps
      // directly onto the canvas width (no extra pad offset here).
      drawRadiation(context, width, height, time, {
        origin: fractionRef.current * width,
        dragging: draggingRef.current,
      })
    }
    const loop = (time: number): void => {
      draw(time)
      frame = window.requestAnimationFrame(loop)
    }
    const redraw = (): void => {
      if (reducedMotion.matches) draw()
    }
    const resizeObserver = new ResizeObserver(() => {
      resize()
      draw()
    })
    const themeObserver = new MutationObserver(() => draw())
    resizeObserver.observe(canvas)
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
    redrawRef.current = redraw
    resize()
    draw()
    if (!reducedMotion.matches) frame = window.requestAnimationFrame(loop)
    return () => {
      window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      themeObserver.disconnect()
      redrawRef.current = null
    }
  }, [])

  if (stops.length === 0) return null
  ensureEffectStyle()

  const pad = mascot ? PAD_MASCOT : PAD_KNOB
  padRef.current = pad
  const count = stops.length
  const indexOf = (fraction: number): number =>
    count <= 1 ? 0 : Math.min(count - 1, Math.max(0, Math.round(fraction * (count - 1))))
  const fractionOf = (index: number): number => (count <= 1 ? 0 : index / (count - 1))

  const committedIndex = nearestEffortStopIndex(stops, value)
  const shownFraction = dragPos ?? fractionOf(keyIndex ?? committedIndex)
  const shownIndex = indexOf(shownFraction)
  fractionRef.current = shownFraction
  draggingRef.current = dragPos !== null

  /** Pointer → 0..1 fraction within the padded rail of the zone's box. */
  const fractionFromEvent = (event: ReactPointerEvent<HTMLDivElement>): number => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width <= 2 * pad) return 0
    return clamp01((event.clientX - rect.left - pad) / (rect.width - 2 * pad))
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (disabled) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    const fraction = fractionFromEvent(event)
    dragRef.current = fraction
    setDragPos(fraction)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (disabled || dragRef.current === null) return
    event.stopPropagation()
    const fraction = fractionFromEvent(event)
    dragRef.current = fraction
    setDragPos(fraction)
  }

  const settle = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (disabled || dragRef.current === null) return
    event.stopPropagation()
    const index = indexOf(dragRef.current)
    dragRef.current = null
    setDragPos(null)
    const id = stops[index]?.id
    if (id !== undefined && id !== value) onCommit(id)
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (disabled) return
    const current = keyIndex ?? committedIndex
    let next: number | undefined
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = Math.max(0, current - 1)
    else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = Math.min(count - 1, current + 1)
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = count - 1
    else return
    event.preventDefault()
    event.stopPropagation()
    setKeyIndex(next)
  }

  const onKeyUp = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (disabled || keyIndex === null) return
    const moved = event.key === 'ArrowLeft' || event.key === 'ArrowRight'
      || event.key === 'ArrowUp' || event.key === 'ArrowDown'
      || event.key === 'Home' || event.key === 'End'
    event.stopPropagation()
    if (!moved) return
    const id = stops[keyIndex]?.id
    setKeyIndex(null)
    if (id !== undefined && id !== value) onCommit(id)
  }

  /**
   * Tick/label/thumb x position inside the padded rail (percent of the zone).
   */
  const at = (fraction: number): string =>
    `calc(${pad}px + ${fraction} * (100% - ${2 * pad}px))`

  const dragging = dragPos !== null

  return (
    <div
      role="slider"
      className={ZONE_CLASS}
      tabIndex={disabled ? -1 : 0}
      aria-label={t('input.effort.title')}
      aria-valuemin={0}
      aria-valuemax={count - 1}
      aria-valuenow={shownIndex}
      aria-valuetext={stops[shownIndex]?.name ?? stops[committedIndex]?.id ?? ''}
      data-drag={dragging ? '1' : '0'}
      data-top={shownIndex === count - 1 ? '1' : '0'}
      style={disabled ? zoneDisabledStyle : zoneActiveStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={settle}
      onPointerCancel={settle}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
    >
      <div
        className={TRACK_CLASS}
        style={{
          position: 'absolute',
          left: `${pad}px`,
          right: `${pad}px`,
          bottom: `${TRACK_B}px`,
          height: `${TRACK_H}px`,
          // Drives the light-theme progress fill (dark theme is canvas-carried).
          '--dsh-tl-progress': `${shownFraction * 100}%`,
        } as CSSProperties}
      >
        <div className={FILL_CLASS} />
        <canvas ref={canvasRef} className={CANVAS_CLASS} />
        {/* Flare lives INSIDE the track: the pill's overflow:hidden clips the
            glow to the pill (it used to bleed above/beside it). Left is the
            fraction of the padded rail = percent of the track width. */}
        <div
          className={FLARE_CLASS}
          style={{ left: `${shownFraction * 100}%`, top: '50%' }}
        />
        {/* Interior stops only: the rounded end caps swallow edge dots. */}
        {stops.slice(1, -1).map((stop, offset) => {
          const index = offset + 1
          return (
            <div
              key={stop.id}
              style={{
                position: 'absolute',
                bottom: `${TRACK_H / 2 - 3.5}px`,
                left: `${(index / Math.max(1, count - 1)) * 100}%`,
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#fff',
                border: '1px solid var(--dsw-alias-border-l2)',
                boxSizing: 'border-box',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
                zIndex: 2,
                opacity: index <= shownIndex ? 1 : 0.65,
              }}
            />
          )
        })}
      </div>
      {mascot
        ? (
          <div
            className={`${RUN_CLASS} ${GIRL_CLASS}`}
            style={{ ...girlStyle, left: at(shownFraction), bottom: `${GIRL_B}px` }}
          />
        )
        : (
          <div
            className={KNOB_CLASS}
            style={{ ...knobStyle, left: at(shownFraction), bottom: `${TRACK_B + TRACK_H / 2 - KNOB / 2}px` }}
          />
        )}
      {count <= 6 && stops.map((stop, index) => (
        <div
          key={stop.id}
          style={{
            ...(index === shownIndex ? labelActiveStyle : labelStyle),
            left: at(fractionOf(index)),
          }}
        >
          {stop.name}
        </div>
      ))}
    </div>
  )
}

export default EffortSlider
