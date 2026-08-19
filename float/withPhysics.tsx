/**
 * Float — the hidden physics mini-game in the testa.studio hero.
 *
 * Framer code override: wrap any component with `withPhysics`.
 *
 *   Idle      decorative shapes drift with zero gravity, drag/tap/hover to play
 *   Discovery after 4 drags the "Play more?" button appears
 *   Expanded  gravity turns on, targets spawn, water jets launch the shapes
 *   Victory   all targets cleared -> the pieces dance
 *
 * Physics tuning is unchanged from v0.1 (see TUNING below); the simulation now
 * runs on a fixed timestep so the feel is identical on 60Hz and 120Hz displays.
 */

import { useCallback, useEffect, useRef, useState } from "react"
import type { ComponentType, CSSProperties } from "react"

/* ------------------------------------------------------------------ *
 *  TUNING — the "zen" numbers. Changing these changes how Float feels. *
 * ------------------------------------------------------------------ */

/** One simulation step = one frame of the original 60fps loop. */
const STEP_MS = 1000 / 60
/** Cap catch-up work after a stall so the tab never spirals. */
const MAX_STEPS_PER_FRAME = 5
const MAX_FRAME_MS = 100

const PHYSICS = {
    gravity: { idle: 0, expanded: 0.02 },
    mass: { idle: 1.5, expanded: 0.5 },
    frictionY: 0.995,
    dampingX: 0.998,
    spinDamping: 0.995,
    bounce: 0.1,
    groundFriction: 0.97,
    maxSpeed: 2,
    restSpeed: 0.01,
    restSpin: 0.002,
    /** Extra breathing room between two touching shapes. */
    collisionGap: 8,
    collisionImpulse: 0.4,
    spinFromImpulse: 0.01,
    /** Wall padding as a fraction of the shape size. */
    edgePadding: 0.08,
    /** Mirrors the top spacing so the field reads as vertically centred. */
    bottomMargin: 80,
}

const INTERACTION = {
    hoverRadius: 150,
    hoverForce: 0.5,
    tapRadius: 200,
    tapForce: 3,
    tapMaxDuration: 200,
    tapMaxTravel: 5,
    dragPushForce: 4,
    releaseRadius: 120,
    releaseForce: 2,
    dragScale: 1.1,
    dragSpinPerPixel: 0.02,
    /** Flick-to-throw: pointer speed over the last `throwSampleMs`. */
    throwScale: 0.6,
    throwMaxSpeed: 4,
    throwSampleMs: 80,
    dragsToReveal: 4,
}

const JET = { sideX: 22, sideY: -100, centerY: -120, spin: 3 }

const TARGETS = {
    mobile: { count: 5, radius: 30 },
    desktop: { count: 10, radius: 44 },
    spawn: { xStart: 0.15, xSpan: 0.7, yStart: 80, ySpan: 250 },
    revealDelay: 2500,
    activateDelay: 5000,
    staggerMs: 100,
    explodeMs: 300,
    victoryDelay: 500,
    /** "play again" settles the field, then fades the new circles in. */
    restartGrace: 900,
    /** ~4s: arm a permanently blocked circle anyway, so a board cannot lock up. */
    armTimeoutFrames: 240,
}

const CELEBRATION = {
    timeStep: 0.05,
    spin: 8,
    /** Matches the integrated bob of v0.1, without the position drift. */
    bob: 30,
    pulse: 0.1,
}

const LAYOUT = {
    maxWidth: 1800,
    expandedHeight: 600,
    cornerRadius: 24,
    expandMs: 800,
}

const MOBILE_QUERY = "(max-width: 767px)"
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"
const VERSION_LABEL = "Float Nov 2025 0.1"
const FONT = "Onest, sans-serif"

/**
 * v0.1 shipped `transform 0.1s ease-out` on every shape, which asked the
 * compositor to interpolate a transform that is already rewritten 60 times a
 * second — 100ms of lag on every drag. Set it back to that string to restore
 * the old feel.
 */
const SHAPE_TRANSITION = ""

const COLORS = [
    "#FF6B4A",
    "#5CB8A0",
    "#F0B856",
    "#4A8FE7",
    "#4A92AB",
    "#B8805A",
    "#9B88C8",
]

/** The 8 shapes, with the per-shape size corrections they need to read evenly. */
const SHAPES: ReadonlyArray<{ path: string; scale: number }> = [
    {
        path: "M69.84,35.67c0-4.56-1.9-6.99-7.65-8.27-1.57-.35-2.33-2.19-1.46-3.54,3.13-4.89,2.75-7.93-.56-11.24s-6.31-3.75-11.21-.61c-1.36.87-3.2.11-3.54-1.47-1.25-5.64-3.67-7.51-8.33-7.51s-7.11,1.81-8.35,7.49c-.34,1.58-2.18,2.34-3.54,1.47-4.87-3.11-7.9-2.72-11.2.58-3.32,3.32-3.75,6.31-.61,11.21.87,1.36.11,3.2-1.47,3.54-5.64,1.25-7.51,3.67-7.51,8.33s1.83,7.14,7.58,8.37c1.58.34,2.35,2.18,1.48,3.54-3.23,5.02-2.81,8.05.44,11.3,3.24,3.24,6.32,3.6,11.33.39,1.36-.87,3.2-.11,3.54,1.47,1.27,5.87,3.7,7.73,8.31,7.73,4.58,0,7.01-1.92,8.29-7.74.34-1.58,2.19-2.34,3.54-1.47,5.04,3.25,8.08,2.85,11.34-.41,3.24-3.24,3.6-6.32.39-11.33-.87-1.36-.11-3.2,1.47-3.54,5.87-1.27,7.73-3.7,7.73-8.31Z",
        scale: 1,
    },
    {
        path: "M37.125,65.229L37.125,65.229c-15.741,0-28.703-12.503-29.446-28.069c-0.036-0.764,0.554-1.41,1.319-1.41h0c13.733,0,23.525-12.282,21.813-25.908c-0.286-2.276,1.248-3.572,6.314-3.572h0c16.214,0,29.479,13.266,29.479,29.479v0C66.604,51.964,53.339,65.229,37.125,65.229z",
        scale: 1,
    },
    {
        path: "M34.22,57.8c1.02-2.65,4.78-2.65,5.8,0,1.27,3.3,2.95,5.35,5.03,5.35,10.75,0,19.47-12.27,19.47-27.4s-8.72-27.4-19.47-27.4c-2.08,0-3.75,2.05-5.03,5.35-1.02,2.65-4.78,2.65-5.8,0-1.27-3.3-2.95-5.35-5.03-5.35-10.75,0-19.47,12.27-19.47,27.4s8.72,27.4,19.47,27.4c2.08,0,3.75-2.05,5.03-5.35Z",
        scale: 1,
    },
    {
        path: "M22.49,67.02c-1.7,0-3.41-.38-4.98-1.2-3.22-1.7-5.3-4.79-5.61-8.39-.57-7.32-.88-14.63-.88-21.69s.32-14.38.88-21.69c.32-3.59,2.4-6.68,5.61-8.39,3.28-1.7,7.13-1.64,10.28.19,9.9,5.74,19.61,12.49,31.47,21.76,2.52,1.95,3.97,4.92,3.97,8.14s-1.45,6.18-3.97,8.14c-11.86,9.27-21.57,16.02-31.47,21.76-1.64.95-3.47,1.45-5.36,1.45h0l.06-.06Z",
        scale: 0.75,
    },
    {
        path: "M54.5,26.63c-4.49-.31-8.05-3.89-8.34-8.38-.74-11.26-2.91-14.58-9.08-14.58-6.18,0-8.35,3.19-9.08,14.54-.29,4.51-3.87,8.09-8.38,8.39-11.26.74-14.58,2.91-14.58,9.08,0,6.2,3.21,8.36,14.61,9.09,4.5.29,8.08,3.85,8.39,8.35.78,11.5,3.02,14.73,9.05,14.73,6.01,0,8.26-3.36,9.04-14.78.31-4.48,3.87-8.04,8.34-8.34,11.5-.78,14.73-3.02,14.73-9.05,0-6-3.34-8.25-14.7-9.04Z",
        scale: 1,
    },
    {
        path: "M2.2,19.41c0-1.9.42-3.8,1.34-5.56,1.9-3.59,5.35-5.92,9.37-6.27,8.17-.63,16.34-.99,24.23-.99s16.06.35,24.23.99c4.02.35,7.47,2.68,9.37,6.27,1.9,3.66,1.83,7.96-.21,11.48-6.41,11.06-13.95,21.91-24.3,35.15-2.18,2.82-5.49,4.44-9.09,4.44s-6.9-1.62-9.09-4.44C17.7,47.23,10.16,36.39,3.75,25.33c-1.06-1.83-1.62-3.87-1.62-5.99h0l.07.07Z",
        scale: 1,
    },
    {
        path: "M71.83,50.96c0,1.89-.42,3.78-1.33,5.53-1.89,3.57-5.32,5.88-9.31,6.23-8.12.63-16.24-11.82-24.08-11.82s-15.96,12.45-24.08,11.82c-3.99-.35-7.42-2.66-9.31-6.23-1.89-3.64-1.82-7.91.21-11.41,6.37-10.99,15.78-20.48,25.05-32.34,1.95-2.52,4.92-3.97,8.14-3.97s6.18,1.45,8.14,3.97c9.27,11.86,18.67,21.35,25.04,32.34,1.05,1.82,1.61,3.85,1.61,5.95h0l-.07-.07Z",
        scale: 0.85,
    },
    {
        path: "M66.77,35.75c.21-8.42-2.58-13.49-6.94-16.51-2.41-1.68-4.52-3.79-6.2-6.2-3.02-4.35-8.09-7.15-16.52-6.94-8.42-.21-13.49,2.58-16.51,6.94-1.68,2.41-3.79,4.52-6.2,6.2-4.35,3.02-7.15,8.1-6.94,16.52-.21,8.42,2.58,13.49,6.94,16.51,2.41,1.68,4.52,3.79,6.2,6.2,3.02,4.35,8.09,7.15,16.52,6.94,8.42.21,13.49-2.58,16.51-6.94,1.68-2.41,3.79-4.52,6.2-6.2,4.35-3.02,7.15-8.09,6.94-16.52Z",
        scale: 1,
    },
]

const SVG_NS = "http://www.w3.org/2000/svg"
const VIEW_BOX = "0 0 74.25 71.5"

/* ------------------------------------------------------------------ *
 *  Types                                                              *
 * ------------------------------------------------------------------ */

type Size = { width: number; height: number }
type Settings = { size: number; count: number }
type JetSide = "left" | "center" | "right"

type Particle = {
    el: SVGSVGElement
    x: number
    y: number
    vx: number
    vy: number
    rotation: number
    spin: number
    size: number
    mass: number
    isDragging: boolean
    /** Per-shape offset so the victory dance is not in lockstep. */
    phase: number
    lastTransform: string
}

type Target = {
    el: HTMLDivElement
    x: number
    y: number
    radius: number
    destroyed: boolean
    /**
     * A circle only counts hits once it has been empty at least once. Without
     * this, a circle that spawns over a piece scores itself on the next frame
     * — which is what made "play again" hand back most of the board.
     */
    armed: boolean
    blockedFrames: number
}

type Mode = {
    expanded: boolean
    gameActive: boolean
    targetsReady: boolean
    celebrating: boolean
    reducedMotion: boolean
}

type PointerSample = { x: number; y: number; t: number }

type Drag = {
    particle: Particle
    offsetX: number
    offsetY: number
    lastX: number
    samples: PointerSample[]
}

/* ------------------------------------------------------------------ *
 *  Pure helpers                                                       *
 * ------------------------------------------------------------------ */

const clamp = (value: number, min: number, max: number) =>
    value < min ? min : value > max ? max : value

function shuffle<T>(items: T[]): T[] {
    const out = items.slice()
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const swap = out[i]
        out[i] = out[j]
        out[j] = swap
    }
    return out
}

/** Shape size and how many fit, by viewport width and available area. */
function calculateSettings(
    bounds: Size,
    viewportWidth: number,
    expanded: boolean
): Settings {
    let size: number
    if (viewportWidth < 768) size = expanded ? 28 : 38
    else if (viewportWidth < 1024) size = expanded ? 38 : 52
    else if (viewportWidth < 1200) size = 52
    else if (viewportWidth < 1800) size = 65
    else size = 72

    let density: number
    if (viewportWidth >= 2400) density = 0.65
    else if (viewportWidth >= 1800) density = 0.6
    else if (viewportWidth >= 1200) density = 0.55
    else if (viewportWidth >= 768) density = 0.5
    else density = expanded ? 0.4 : 0.45

    const fit = Math.floor((bounds.width * bounds.height * density) / (size * size))
    return { size, count: clamp(fit, 10, 60) }
}

function createParticle(
    container: HTMLElement,
    shape: { path: string; scale: number },
    color: string,
    baseSize: number,
    bounds: Size,
    expanded: boolean
): Particle {
    const size = baseSize * shape.scale

    const svg = document.createElementNS(SVG_NS, "svg")
    svg.setAttribute("viewBox", VIEW_BOX)
    svg.setAttribute("class", "float-shape")
    svg.setAttribute("aria-hidden", "true")
    svg.style.width = `${size}px`
    svg.style.height = `${size}px`
    if (SHAPE_TRANSITION) svg.style.transition = SHAPE_TRANSITION

    const path = document.createElementNS(SVG_NS, "path")
    path.setAttribute("d", shape.path)
    path.setAttribute("fill", color)
    svg.appendChild(path)
    container.appendChild(svg)

    const padding = size * 0.5
    const maxX = bounds.width - size - padding
    const maxY = bounds.height - size - padding - 60

    return {
        el: svg,
        x: padding + Math.random() * Math.max(0, maxX - padding),
        y: padding + Math.random() * Math.max(0, maxY - padding),
        vx: 0,
        vy: 0,
        rotation: Math.random() * 360,
        spin: 0,
        size,
        mass: expanded ? PHYSICS.mass.expanded : PHYSICS.mass.idle,
        isDragging: false,
        phase: Math.random() * Math.PI * 2,
        lastTransform: "",
    }
}

function createParticles(
    container: HTMLElement,
    settings: Settings,
    bounds: Size,
    expanded: boolean
): Particle[] {
    const deck: Array<{ shape: (typeof SHAPES)[number]; color: string }> = []
    const rounds = Math.ceil(settings.count / SHAPES.length)
    for (let round = 0; round < rounds; round++) {
        for (const shape of SHAPES) {
            deck.push({
                shape,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
            })
        }
    }

    return shuffle(deck)
        .slice(0, settings.count)
        .map(({ shape, color }) =>
            createParticle(container, shape, color, settings.size, bounds, expanded)
        )
}

function destroyParticles(particles: Particle[]) {
    for (const particle of particles) particle.el.remove()
}

/** Shove everything the dragged shape is currently overlapping. */
function pushFromDragged(particles: Particle[], dragged: Particle) {
    for (const other of particles) {
        if (other === dragged || other.isDragging) continue

        const dx = other.x + other.size / 2 - (dragged.x + dragged.size / 2)
        const dy = other.y + other.size / 2 - (dragged.y + dragged.size / 2)
        const distance = Math.hypot(dx, dy)
        const safeDistance =
            (dragged.size + other.size) / 2 + PHYSICS.collisionGap

        if (distance < safeDistance && distance > 0) {
            const force = INTERACTION.dragPushForce / other.mass
            other.vx += (dx / distance) * force
            other.vy += (dy / distance) * force
        }
    }
}

/** A softer ripple outwards when the shape is let go. */
function pushOnRelease(particles: Particle[], released: Particle) {
    for (const other of particles) {
        if (other === released) continue

        const dx = other.x + other.size / 2 - (released.x + released.size / 2)
        const dy = other.y + other.size / 2 - (released.y + released.size / 2)
        const distance = Math.hypot(dx, dy)

        if (distance < INTERACTION.releaseRadius && distance > 0) {
            const force = INTERACTION.releaseForce / other.mass
            other.vx += (dx / distance) * force
            other.vy += (dy / distance) * force
        }
    }
}

/** Pull nearby shapes towards a point — the magnetic cursor and the tap. */
function attractTowards(
    particles: Particle[],
    x: number,
    y: number,
    radius: number,
    force: number,
    spinKick = 0
) {
    for (const particle of particles) {
        if (particle.isDragging) continue

        const dx = particle.x + particle.size / 2 - x
        const dy = particle.y + particle.size / 2 - y
        const distance = Math.hypot(dx, dy)

        if (distance > 0 && distance < radius) {
            particle.vx -= (dx / distance) * force
            particle.vy -= (dy / distance) * force
            if (spinKick) particle.spin += (Math.random() - 0.5) * spinKick
        }
    }
}

/**
 * One simulation step, in the units of a single 60fps frame — every constant
 * above is expressed in px/frame, so the numbers carry over from v0.1 as-is.
 */
function stepParticles(particles: Particle[], bounds: Size, mode: Mode) {
    const gravity = mode.expanded
        ? PHYSICS.gravity.expanded
        : PHYSICS.gravity.idle

    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i]

        // Held shapes are positioned by the pointer, not the simulation.
        if (particle.isDragging) {
            particle.rotation += particle.spin
            continue
        }

        if (mode.celebrating) {
            if (!mode.reducedMotion) particle.rotation += CELEBRATION.spin
            continue
        }

        particle.vy += gravity
        particle.vx *= PHYSICS.dampingX
        particle.vy *= PHYSICS.frictionY
        particle.spin *= PHYSICS.spinDamping

        const speed = Math.hypot(particle.vx, particle.vy)
        if (speed > PHYSICS.maxSpeed) {
            particle.vx = (particle.vx / speed) * PHYSICS.maxSpeed
            particle.vy = (particle.vy / speed) * PHYSICS.maxSpeed
        }

        // Let shapes come to a full stop instead of jittering forever.
        if (Math.abs(particle.vx) < PHYSICS.restSpeed) particle.vx = 0
        if (Math.abs(particle.vy) < PHYSICS.restSpeed) particle.vy = 0
        if (Math.abs(particle.spin) < PHYSICS.restSpin) particle.spin = 0

        particle.x += particle.vx
        particle.y += particle.vy
        particle.rotation += particle.spin

        const padding = particle.size * PHYSICS.edgePadding
        const maxX = bounds.width - particle.size - padding
        const maxY =
            bounds.height - particle.size - padding - PHYSICS.bottomMargin

        if (particle.x < padding) {
            particle.x = padding
            particle.vx *= -PHYSICS.bounce
        } else if (particle.x > maxX) {
            particle.x = maxX
            particle.vx *= -PHYSICS.bounce
        }

        if (particle.y < padding) {
            particle.y = padding
            particle.vy *= -PHYSICS.bounce
        } else if (particle.y > maxY) {
            particle.y = maxY
            particle.vy = 0
            particle.vx *= PHYSICS.groundFriction
        }

        resolveCollisions(particles, particle, i)
    }
}

/**
 * Positional separation plus an impulse, and only when the pair is actually
 * closing in (`closing < 0`). Never write a position for any other reason —
 * per-frame position forcing is what caused the old "cage suction" bug.
 */
function resolveCollisions(
    particles: Particle[],
    particle: Particle,
    index: number
) {
    for (let j = index + 1; j < particles.length; j++) {
        const other = particles[j]
        if (other.isDragging) continue

        const dx = other.x + other.size / 2 - (particle.x + particle.size / 2)
        const dy = other.y + other.size / 2 - (particle.y + particle.size / 2)
        const distance = Math.hypot(dx, dy)
        const minDistance =
            (particle.size + other.size) / 2 + PHYSICS.collisionGap

        if (distance >= minDistance || distance === 0) continue

        const overlap = minDistance - distance
        const separateX = (dx / distance) * overlap * 0.5
        const separateY = (dy / distance) * overlap * 0.5

        particle.x -= separateX
        particle.y -= separateY
        other.x += separateX
        other.y += separateY

        const closing =
            (particle.vx - other.vx) * dx + (particle.vy - other.vy) * dy
        if (closing >= 0) continue

        const totalMass = particle.mass + other.mass
        const impulse = (0.5 * closing) / (distance * distance * totalMass)
        const impulseX = dx * impulse * PHYSICS.bounce * PHYSICS.collisionImpulse
        const impulseY = dy * impulse * PHYSICS.bounce * PHYSICS.collisionImpulse

        particle.vx -= impulseX * other.mass
        particle.vy -= impulseY * other.mass
        other.vx += impulseX * particle.mass
        other.vy += impulseY * particle.mass

        particle.spin += impulseX * PHYSICS.spinFromImpulse
        other.spin -= impulseX * PHYSICS.spinFromImpulse
    }
}

/** The only place that touches the DOM per frame, and only when something moved. */
function renderParticles(
    particles: Particle[],
    mode: Mode,
    celebrationTime: number
) {
    const dancing = mode.celebrating && !mode.reducedMotion

    for (const particle of particles) {
        let y = particle.y
        let scale = 1

        if (particle.isDragging) {
            scale = INTERACTION.dragScale
        } else if (dancing) {
            // Rendered as an offset, so the dance never displaces the shape.
            y +=
                CELEBRATION.bob *
                (Math.cos(particle.phase) -
                    Math.cos(celebrationTime * 2 + particle.phase))
            scale =
                1 +
                Math.sin(celebrationTime * 3 + particle.phase) *
                    CELEBRATION.pulse
        }

        const transform =
            `translate3d(${particle.x.toFixed(2)}px, ${y.toFixed(2)}px, 0)` +
            ` rotate(${particle.rotation.toFixed(2)}deg)` +
            (scale === 1 ? "" : ` scale(${scale.toFixed(3)})`)

        if (transform !== particle.lastTransform) {
            particle.el.style.transform = transform
            particle.lastTransform = transform
        }
    }
}

/**
 * Place a target clear of the shapes already on the field, and of the targets
 * placed so far. Without this, "play again" can spawn a circle on top of a
 * piece and pop it on the very next frame.
 */
function pickTargetSpot(
    width: number,
    radius: number,
    particles: Particle[],
    placed: Target[]
) {
    const attempts = 12
    let best = { x: 0, y: 0, clearance: -Infinity }

    for (let attempt = 0; attempt < attempts; attempt++) {
        const x =
            width * TARGETS.spawn.xStart +
            Math.random() * width * TARGETS.spawn.xSpan
        const y = TARGETS.spawn.yStart + Math.random() * TARGETS.spawn.ySpan

        let clearance = Infinity
        for (const particle of particles) {
            const dx = particle.x + particle.size / 2 - x
            const dy = particle.y + particle.size / 2 - y
            clearance = Math.min(clearance, Math.hypot(dx, dy) - particle.size / 2)
        }
        for (const target of placed) {
            const gap =
                Math.hypot(target.x - x, target.y - y) - target.radius - radius
            clearance = Math.min(clearance, gap)
        }

        if (clearance > best.clearance) best = { x, y, clearance }
        if (best.clearance > radius) break
    }

    return best
}

function spawnTargets(
    container: HTMLElement,
    isMobile: boolean,
    animated: boolean,
    particles: Particle[]
): Target[] {
    const { count, radius } = isMobile ? TARGETS.mobile : TARGETS.desktop
    const width = container.clientWidth
    const targets: Target[] = []

    for (let i = 0; i < count; i++) {
        const { x, y } = pickTargetSpot(width, radius, particles, targets)

        const el = document.createElement("div")
        el.className = "float-target"
        el.style.left = `${x - radius}px`
        el.style.top = `${y - radius}px`
        el.style.width = `${radius * 2}px`
        el.style.height = `${radius * 2}px`

        if (animated) {
            el.style.opacity = "0"
            el.style.animation = `float-fade-in 0.5s ease ${
                (i * TARGETS.staggerMs) / 1000
            }s forwards`
        } else {
            el.style.opacity = "1"
        }

        container.appendChild(el)
        targets.push({
            el,
            x,
            y,
            radius,
            destroyed: false,
            armed: false,
            blockedFrames: 0,
        })
    }

    return targets
}

/* ------------------------------------------------------------------ *
 *  Hooks                                                              *
 * ------------------------------------------------------------------ */

/** SSR-safe media query. Framer renders these pages on the server too. */
function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => {
        if (typeof window === "undefined" || !window.matchMedia) return false
        return window.matchMedia(query).matches
    })

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) return

        const list = window.matchMedia(query)
        const sync = () => setMatches(list.matches)
        sync()

        if (list.addEventListener) {
            list.addEventListener("change", sync)
            return () => list.removeEventListener("change", sync)
        }
        // Safari < 14
        list.addListener(sync)
        return () => list.removeListener(sync)
    }, [query])

    return matches
}

/* ------------------------------------------------------------------ *
 *  Override                                                           *
 * ------------------------------------------------------------------ */

export function withPhysics<P extends object>(
    Component: ComponentType<P>
): ComponentType<P> {
    return function WithPhysics(props: P) {
        const containerRef = useRef<HTMLDivElement | null>(null)

        // Everything the animation loop touches lives in a ref — per-frame data
        // must never go through React state.
        const particlesRef = useRef<Particle[]>([])
        const targetsRef = useRef<Target[]>([])
        const boundsRef = useRef<Size>({ width: 0, height: 0 })
        const settingsRef = useRef<Settings>({ size: 0, count: 0 })
        const dragsRef = useRef<Map<number, Drag>>(new Map())
        const celebrationTimeRef = useRef(0)
        const dragCountRef = useRef(0)
        const victoryFiredRef = useRef(false)
        const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
        const rebuildRef = useRef<(() => void) | null>(null)

        const [isExpanded, setIsExpanded] = useState(false)
        const [showExpandButton, setShowExpandButton] = useState(false)
        const [targetsReady, setTargetsReady] = useState(false)
        const [gameActive, setGameActive] = useState(false)
        const [remainingTargets, setRemainingTargets] = useState(0)
        const [isCelebrating, setIsCelebrating] = useState(false)
        const [showVictory, setShowVictory] = useState(false)

        const isMobile = useMediaQuery(MOBILE_QUERY)
        const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY)

        // The loop reads game state from here, so it never has to be torn down
        // and rebuilt when a phase changes.
        const modeRef = useRef<Mode>({
            expanded: false,
            gameActive: false,
            targetsReady: false,
            celebrating: false,
            reducedMotion: false,
        })

        useEffect(() => {
            modeRef.current = {
                expanded: isExpanded,
                gameActive,
                targetsReady,
                celebrating: isCelebrating,
                reducedMotion,
            }
        }, [isExpanded, gameActive, targetsReady, isCelebrating, reducedMotion])

        const track = useCallback((fn: () => void, delay: number) => {
            const id = setTimeout(() => {
                timersRef.current.delete(id)
                fn()
            }, delay)
            timersRef.current.add(id)
            return id
        }, [])

        const clearTargets = useCallback(() => {
            for (const target of targetsRef.current) target.el.remove()
            targetsRef.current = []
            victoryFiredRef.current = false
        }, [])

        /* ---------------- simulation: mounted once, never rebuilt --------- */

        useEffect(() => {
            const container = containerRef.current
            if (!container) return

            const particles = () => particlesRef.current
            let rafId: number | null = null
            let lastTime = 0
            let accumulator = 0
            let inView = true
            let pageVisible =
                typeof document === "undefined" || !document.hidden

            const measure = () => {
                boundsRef.current = {
                    width: container.clientWidth,
                    height: container.clientHeight,
                }
                return boundsRef.current
            }

            /* --- particles ------------------------------------------------ */

            const build = () => {
                const bounds = measure()
                if (!bounds.width || !bounds.height) return

                const settings = calculateSettings(
                    bounds,
                    window.innerWidth,
                    modeRef.current.expanded
                )
                destroyParticles(particles())
                particlesRef.current = createParticles(
                    container,
                    settings,
                    bounds,
                    modeRef.current.expanded
                )
                settingsRef.current = settings
                attachDragHandlers()
            }

            /** Only rebuild when the layout changed enough to be worth it. */
            const rebuildIfNeeded = () => {
                const bounds = measure()
                if (!bounds.width || !bounds.height) return
                if (!particles().length) return build()

                const next = calculateSettings(
                    bounds,
                    window.innerWidth,
                    modeRef.current.expanded
                )
                const current = settingsRef.current
                if (
                    Math.abs(next.count - current.count) > 3 ||
                    Math.abs(next.size - current.size) > 10
                ) {
                    build()
                }
            }

            rebuildRef.current = rebuildIfNeeded

            /* --- dragging (pointer events: mouse, touch and pen alike) ---- */

            const drags = dragsRef.current

            const localPoint = (event: PointerEvent) => {
                const rect = container.getBoundingClientRect()
                return {
                    x: event.clientX - rect.left,
                    y: event.clientY - rect.top,
                    width: rect.width,
                    height: rect.height,
                }
            }

            const onShapePointerDown = (particle: Particle, event: PointerEvent) => {
                if (modeRef.current.expanded || particle.isDragging) return

                event.preventDefault()
                event.stopPropagation()

                const point = localPoint(event)
                particle.isDragging = true
                particle.vx = 0
                particle.vy = 0
                particle.spin = 0
                particle.el.dataset.dragging = "true"

                try {
                    particle.el.setPointerCapture(event.pointerId)
                } catch {
                    // Capture is a nicety; dragging still works without it.
                }

                drags.set(event.pointerId, {
                    particle,
                    offsetX: point.x - particle.x - particle.size / 2,
                    offsetY: point.y - particle.y - particle.size / 2,
                    lastX: point.x,
                    samples: [{ x: point.x, y: point.y, t: event.timeStamp }],
                })
            }

            const onShapePointerMove = (event: PointerEvent) => {
                const drag = drags.get(event.pointerId)
                if (!drag) return

                event.preventDefault()

                const point = localPoint(event)
                const particle = drag.particle
                const padding = particle.size * PHYSICS.edgePadding

                particle.spin =
                    (point.x - drag.lastX) * INTERACTION.dragSpinPerPixel
                drag.lastX = point.x

                particle.x = clamp(
                    point.x - drag.offsetX - particle.size / 2,
                    padding,
                    point.width - particle.size - padding
                )
                particle.y = clamp(
                    point.y - drag.offsetY - particle.size / 2,
                    padding,
                    point.height - particle.size - padding
                )

                drag.samples.push({ x: point.x, y: point.y, t: event.timeStamp })
                if (drag.samples.length > 6) drag.samples.shift()

                pushFromDragged(particles(), particle)
            }

            /** Flick velocity from the tail of the pointer trail. */
            const throwVelocity = (samples: PointerSample[]) => {
                const last = samples[samples.length - 1]
                let first = samples[0]
                for (let i = samples.length - 1; i >= 0; i--) {
                    if (last.t - samples[i].t > INTERACTION.throwSampleMs) break
                    first = samples[i]
                }

                const dt = last.t - first.t
                if (dt <= 0) return { vx: 0, vy: 0 }

                const scale = (STEP_MS / dt) * INTERACTION.throwScale
                const vx = (last.x - first.x) * scale
                const vy = (last.y - first.y) * scale
                const speed = Math.hypot(vx, vy)
                if (speed > INTERACTION.throwMaxSpeed) {
                    const k = INTERACTION.throwMaxSpeed / speed
                    return { vx: vx * k, vy: vy * k }
                }
                return { vx, vy }
            }

            const onShapePointerUp = (event: PointerEvent) => {
                const drag = drags.get(event.pointerId)
                if (!drag) return
                drags.delete(event.pointerId)

                const particle = drag.particle
                const thrown = throwVelocity(drag.samples)
                particle.vx = thrown.vx
                particle.vy = thrown.vy
                particle.isDragging = false
                delete particle.el.dataset.dragging

                pushOnRelease(particles(), particle)

                if (!modeRef.current.expanded) {
                    dragCountRef.current++
                    if (dragCountRef.current >= INTERACTION.dragsToReveal) {
                        setShowExpandButton(true)
                    }
                }
            }

            function attachDragHandlers() {
                for (const particle of particles()) {
                    particle.el.addEventListener("pointerdown", (event) =>
                        onShapePointerDown(particle, event)
                    )
                    particle.el.addEventListener("pointermove", onShapePointerMove)
                    particle.el.addEventListener("pointerup", onShapePointerUp)
                    particle.el.addEventListener("pointercancel", onShapePointerUp)
                }
            }

            /* --- container interactions ----------------------------------- */

            let tapStart = { x: 0, y: 0, t: 0 }

            const onContainerPointerDown = (event: PointerEvent) => {
                if (event.target !== container) return
                tapStart = { x: event.clientX, y: event.clientY, t: event.timeStamp }
            }

            const onContainerClick = (event: MouseEvent) => {
                if (event.target !== container || modeRef.current.expanded) return

                const held = event.timeStamp - tapStart.t
                const travel = Math.hypot(
                    event.clientX - tapStart.x,
                    event.clientY - tapStart.y
                )
                if (held > INTERACTION.tapMaxDuration) return
                if (travel > INTERACTION.tapMaxTravel) return

                const rect = container.getBoundingClientRect()
                attractTowards(
                    particles(),
                    event.clientX - rect.left,
                    event.clientY - rect.top,
                    INTERACTION.tapRadius,
                    INTERACTION.tapForce,
                    0.5
                )
            }

            // The magnetic cursor. Shapes are only ever pulled in, never repelled.
            const onContainerPointerMove = (event: PointerEvent) => {
                if (event.pointerType !== "mouse") return
                if (modeRef.current.expanded || modeRef.current.reducedMotion) return

                const rect = container.getBoundingClientRect()
                attractTowards(
                    particles(),
                    event.clientX - rect.left,
                    event.clientY - rect.top,
                    INTERACTION.hoverRadius,
                    INTERACTION.hoverForce
                )
            }

            /* --- targets --------------------------------------------------- */

            // Counts and destroys only: this must never touch particle physics.
            const checkTargets = () => {
                const mode = modeRef.current
                if (
                    !mode.expanded ||
                    !mode.gameActive ||
                    !mode.targetsReady ||
                    mode.celebrating
                ) {
                    return
                }

                const targets = targetsRef.current
                if (!targets.length) return

                let hit = false

                for (const target of targets) {
                    if (target.destroyed) continue

                    let occupied = false
                    for (const particle of particles()) {
                        const dx = particle.x + particle.size / 2 - target.x
                        const dy = particle.y + particle.size / 2 - target.y
                        if (Math.hypot(dx, dy) < target.radius) {
                            occupied = true
                            break
                        }
                    }

                    if (!target.armed) {
                        target.blockedFrames++
                        target.armed =
                            !occupied ||
                            target.blockedFrames > TARGETS.armTimeoutFrames
                        continue
                    }
                    if (!occupied) continue

                    target.destroyed = true
                    hit = true
                    target.el.style.animation =
                        "float-explode 0.3s ease-out forwards"
                    const el = target.el
                    track(() => el.remove(), TARGETS.explodeMs)
                }

                if (!hit) return

                const remaining = targets.filter((t) => !t.destroyed).length
                setRemainingTargets(remaining)

                if (remaining === 0 && !victoryFiredRef.current) {
                    victoryFiredRef.current = true
                    track(() => {
                        celebrationTimeRef.current = 0
                        setShowVictory(true)
                        setIsCelebrating(true)
                    }, TARGETS.victoryDelay)
                }
            }

            /* --- loop ------------------------------------------------------ */

            const frame = (now: number) => {
                rafId = requestAnimationFrame(frame)

                const bounds = boundsRef.current
                if (!bounds.width || !bounds.height) {
                    lastTime = now
                    return
                }

                if (!lastTime) lastTime = now
                accumulator += Math.min(now - lastTime, MAX_FRAME_MS)
                lastTime = now

                const mode = modeRef.current
                let steps = 0
                while (accumulator >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
                    if (mode.celebrating) {
                        celebrationTimeRef.current += CELEBRATION.timeStep
                    }
                    stepParticles(particles(), bounds, mode)
                    accumulator -= STEP_MS
                    steps++
                }
                if (steps === MAX_STEPS_PER_FRAME) accumulator = 0

                renderParticles(particles(), mode, celebrationTimeRef.current)
                if (steps > 0) checkTargets()
            }

            const start = () => {
                if (rafId !== null) return
                lastTime = 0
                accumulator = 0
                rafId = requestAnimationFrame(frame)
            }

            const stop = () => {
                if (rafId === null) return
                cancelAnimationFrame(rafId)
                rafId = null
            }

            // Don't burn frames on a hero nobody is looking at.
            const syncRunning = () => (inView && pageVisible ? start() : stop())

            const onVisibility = () => {
                pageVisible = !document.hidden
                syncRunning()
            }

            const viewObserver =
                typeof IntersectionObserver === "function"
                    ? new IntersectionObserver(
                          ([entry]) => {
                              inView = entry.isIntersecting
                              syncRunning()
                          },
                          { rootMargin: "100px" }
                      )
                    : null

            /* --- resize ---------------------------------------------------- */

            let resizeTimer: ReturnType<typeof setTimeout> | null = null

            const resizeObserver =
                typeof ResizeObserver === "function"
                    ? new ResizeObserver(() => {
                          const bounds = measure()
                          if (!particles().length && bounds.width && bounds.height) {
                              build()
                          }
                      })
                    : null

            const onResize = () => {
                if (resizeTimer) clearTimeout(resizeTimer)
                resizeTimer = setTimeout(rebuildIfNeeded, 300)
            }

            /* --- wire up --------------------------------------------------- */

            build()
            container.addEventListener("pointerdown", onContainerPointerDown)
            container.addEventListener("click", onContainerClick)
            container.addEventListener("pointermove", onContainerPointerMove)
            window.addEventListener("resize", onResize)
            document.addEventListener("visibilitychange", onVisibility)
            resizeObserver?.observe(container)
            viewObserver?.observe(container)
            start()

            return () => {
                stop()
                if (resizeTimer) clearTimeout(resizeTimer)
                resizeObserver?.disconnect()
                viewObserver?.disconnect()
                container.removeEventListener("pointerdown", onContainerPointerDown)
                container.removeEventListener("click", onContainerClick)
                container.removeEventListener("pointermove", onContainerPointerMove)
                window.removeEventListener("resize", onResize)
                document.removeEventListener("visibilitychange", onVisibility)
                drags.clear()
                destroyParticles(particlesRef.current)
                particlesRef.current = []
                rebuildRef.current = null
            }
        }, [track])

        /* ---------------- phase changes ---------------------------------- */

        // Shapes survive the expansion; only their mass is retuned.
        useEffect(() => {
            const mass = isExpanded
                ? PHYSICS.mass.expanded
                : PHYSICS.mass.idle
            for (const particle of particlesRef.current) particle.mass = mass
            rebuildRef.current?.()
        }, [isExpanded])

        useEffect(() => {
            if (!isExpanded) {
                clearTargets()
                setTargetsReady(false)
                setGameActive(false)
                return
            }

            const reveal = setTimeout(() => {
                const container = containerRef.current
                if (!container) return
                clearTargets()
                targetsRef.current = spawnTargets(
                    container,
                    isMobile,
                    true,
                    particlesRef.current
                )
                setRemainingTargets(targetsRef.current.length)
                setTargetsReady(true)
            }, TARGETS.revealDelay)

            const activate = setTimeout(
                () => setGameActive(true),
                TARGETS.activateDelay
            )

            return () => {
                clearTimeout(reveal)
                clearTimeout(activate)
            }
        }, [isExpanded, isMobile, clearTargets])

        // Every pending timeout, on unmount.
        useEffect(() => {
            const timers = timersRef.current
            return () => {
                for (const id of timers) clearTimeout(id)
                timers.clear()
                for (const target of targetsRef.current) target.el.remove()
                targetsRef.current = []
            }
        }, [])

        /* ---------------- actions ---------------------------------------- */

        const handleJet = useCallback((side: JetSide) => {
            const width = boundsRef.current.width
            if (!width) return

            for (const particle of particlesRef.current) {
                if (particle.isDragging) continue

                const center = particle.x + particle.size / 2
                const zone =
                    center < width * 0.33
                        ? "left"
                        : center < width * 0.66
                          ? "center"
                          : "right"
                if (zone !== side) continue

                particle.vx +=
                    side === "left" ? JET.sideX : side === "right" ? -JET.sideX : 0
                particle.vy += side === "center" ? JET.centerY : JET.sideY
                particle.spin += (Math.random() - 0.5) * JET.spin
            }
        }, [])

        const handleRestart = useCallback(() => {
            const container = containerRef.current
            if (!container) return

            setShowVictory(false)
            setIsCelebrating(false)
            celebrationTimeRef.current = 0

            setGameActive(false)
            clearTargets()

            for (const particle of particlesRef.current) {
                particle.vy = Math.random() * -2
                particle.vx = (Math.random() - 0.5) * 3
            }

            targetsRef.current = spawnTargets(
                container,
                isMobile,
                true,
                particlesRef.current
            )
            setRemainingTargets(targetsRef.current.length)
            track(() => setGameActive(true), TARGETS.restartGrace)
        }, [clearTargets, isMobile, track])

        const handleClose = useCallback(() => {
            setIsExpanded(false)
            setShowVictory(false)
            setShowExpandButton(false)
            setTargetsReady(false)
            setGameActive(false)
            setIsCelebrating(false)
            celebrationTimeRef.current = 0
            dragCountRef.current = 0
            clearTargets()
        }, [clearTargets])

        /* ---------------- render ------------------------------------------ */

        const jetsVisible = isExpanded && targetsReady

        return (
            <div style={styles.page}>
                <div
                    ref={containerRef}
                    style={{
                        ...styles.stage,
                        height: isExpanded ? `${LAYOUT.expandedHeight}px` : "100%",
                    }}
                >
                    <Component {...props} />

                    {jetsVisible && remainingTargets > 0 && (
                        <div
                            aria-hidden="true"
                            style={{
                                ...styles.counter,
                                fontSize: isMobile ? "200px" : "300px",
                            }}
                        >
                            {remainingTargets}
                        </div>
                    )}

                    {jetsVisible && <div style={styles.version}>{VERSION_LABEL}</div>}

                    {jetsVisible &&
                        (isMobile ? (
                            <div style={styles.mobileJets}>
                                {JET_SIDES.map((side) => (
                                    <JetButton
                                        key={side}
                                        side={side}
                                        onFire={handleJet}
                                        style={styles.mobileJet}
                                    />
                                ))}
                            </div>
                        ) : (
                            JET_SIDES.map((side, index) => (
                                <JetButton
                                    key={side}
                                    side={side}
                                    onFire={handleJet}
                                    style={{
                                        ...styles.desktopJet,
                                        left: `${25 * (index + 1)}%`,
                                    }}
                                />
                            ))
                        ))}

                    {showVictory && (
                        <div
                            role="status"
                            style={{
                                ...styles.victory,
                                padding: isMobile ? "32px 40px" : "40px 56px",
                                fontSize: isMobile ? "16px" : "18px",
                            }}
                        >
                            <div>🎉 zen achieved!</div>
                            <div style={styles.victoryActions}>
                                <button
                                    type="button"
                                    onClick={handleRestart}
                                    style={styles.playAgain}
                                >
                                    play again
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    style={styles.close}
                                >
                                    close
                                </button>
                            </div>
                        </div>
                    )}

                    {showExpandButton && !isExpanded && (
                        <button
                            type="button"
                            onClick={() => setIsExpanded(true)}
                            style={{
                                ...styles.expand,
                                padding: isMobile ? "18px 40px" : "24px 56px",
                                fontSize: isMobile ? "16px" : "20px",
                                minHeight: isMobile ? "56px" : "64px",
                            }}
                        >
                            Hey! You found me! Play more?
                        </button>
                    )}

                    <style>{CSS}</style>
                </div>
            </div>
        )
    }
}

/* ------------------------------------------------------------------ *
 *  Presentation                                                       *
 * ------------------------------------------------------------------ */

const JET_SIDES: JetSide[] = ["left", "center", "right"]

function JetButton({
    side,
    onFire,
    style,
}: {
    side: JetSide
    onFire: (side: JetSide) => void
    style: CSSProperties
}) {
    return (
        <button
            type="button"
            aria-label={`${side} water jet`}
            // pointerdown, so the jet fires the instant it is pressed.
            onPointerDown={(event) => {
                event.preventDefault()
                onFire(side)
            }}
            style={style}
        />
    )
}

const jetBase: CSSProperties = {
    height: "44px",
    minWidth: "44px",
    padding: 0,
    background: "#fff",
    borderRadius: "100px",
    cursor: "pointer",
    transition: "all 0.15s ease",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    touchAction: "manipulation",
}

const styles: Record<string, CSSProperties> = {
    page: {
        width: "100%",
        maxWidth: `${LAYOUT.maxWidth}px`,
        margin: "0 auto",
    },
    stage: {
        position: "relative",
        width: "100%",
        overflow: "hidden",
        borderRadius: `${LAYOUT.cornerRadius}px`,
        transition: `height ${LAYOUT.expandMs}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        background: "transparent",
    },
    counter: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        fontFamily: FONT,
        fontWeight: 400,
        color: "transparent",
        WebkitTextStroke: "1px #D1D1D1",
        pointerEvents: "none",
        zIndex: 1,
        lineHeight: 1,
        userSelect: "none",
    },
    version: {
        position: "absolute",
        bottom: "20px",
        right: "20px",
        fontSize: "11px",
        fontFamily: FONT,
        color: "#999",
        opacity: 0,
        animation: "float-fade-in 0.5s ease 2s forwards",
        zIndex: 100,
        userSelect: "none",
    },
    mobileJets: {
        position: "absolute",
        bottom: "30px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "20px",
        opacity: 0,
        animation: "float-fade-in 0.5s ease 0.5s forwards",
        zIndex: 100,
    },
    mobileJet: {
        ...jetBase,
        border: "none",
    },
    desktopJet: {
        ...jetBase,
        position: "absolute",
        bottom: "80px",
        transform: "translateX(-50%)",
        border: "3px solid #000",
        opacity: 0,
        animation: "float-fade-in 0.5s ease 0.5s forwards",
        zIndex: 100,
    },
    victory: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#37403E",
        color: "#fff",
        borderRadius: "16px",
        fontFamily: FONT,
        textAlign: "center",
        opacity: 0,
        animation:
            "float-pop-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        maxWidth: "90%",
    },
    victoryActions: {
        display: "flex",
        gap: "12px",
        justifyContent: "center",
        flexWrap: "wrap",
    },
    playAgain: {
        padding: "12px 28px",
        background: "#fff",
        color: "#37403E",
        border: "none",
        borderRadius: "100px",
        fontSize: "14px",
        fontFamily: FONT,
        cursor: "pointer",
        minHeight: "48px",
    },
    close: {
        padding: "12px 28px",
        background: "transparent",
        color: "#fff",
        border: "1px solid #fff",
        borderRadius: "100px",
        fontSize: "14px",
        fontFamily: FONT,
        cursor: "pointer",
        minHeight: "48px",
    },
    expand: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        background: "#fff",
        color: "#000",
        border: "2px solid #fff",
        outline: "2px solid #000",
        outlineOffset: "-4px",
        borderRadius: "100px",
        fontFamily: FONT,
        fontWeight: 500,
        cursor: "pointer",
        zIndex: 1000,
        animation: "float-fade-in 0.5s ease forwards",
        transition: "all 0.2s ease",
        maxWidth: "90%",
        whiteSpace: "nowrap",
    },
}

/** Keyframe names are prefixed so they can't collide with page-level CSS. */
const CSS = `
.float-shape {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: auto;
    cursor: grab;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    will-change: transform;
}
.float-shape[data-dragging="true"] { cursor: grabbing; }
.float-target {
    position: absolute;
    border: 2px solid #fff;
    outline: 2px solid #000;
    outline-offset: -4px;
    border-radius: 50%;
    pointer-events: none;
    z-index: 5;
}
@keyframes float-fade-in {
    to { opacity: 1; }
}
@keyframes float-pop-in {
    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
@keyframes float-explode {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(2); opacity: 0; }
}
`
