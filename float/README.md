# Float — `withPhysics`

The hidden physics mini-game in the [testa.studio](https://www.testa.studio) hero.
Decorative SVG shapes float with zen water physics; after four drags a
"Hey! You found me! Play more?" button reveals an expanded mode where water jets
launch the pieces at floating bubble targets.

`withPhysics.tsx` is a single self-contained Framer code override. Paste it into
a Framer code file and apply `withPhysics` to the hero component — no
dependencies beyond React.

## Layout of the file

| Section | What lives there |
|---|---|
| **Tuning** | Every constant: `PHYSICS`, `INTERACTION`, `JET`, `TARGETS`, `CELEBRATION`, `LAYOUT`. Nothing else in the file hard-codes a number. |
| **Shapes / palette** | The 8 SVG paths with their per-shape size correction, and the 7 colours. |
| **Pure helpers** | Sizing, particle creation, the physics step, collision resolution, the render pass, target placement. All plain functions — no React, no closures over component state. |
| **Hooks** | `useMediaQuery` (SSR-safe). |
| **Override** | `withPhysics` — refs, effects, handlers, JSX. |
| **Presentation** | `styles`, the jet button, and the injected CSS. |

Per-frame data (particles, targets, drag state, the celebration clock) lives in
refs; React state is only for UI phases. Never move per-frame data into state.

## Architecture notes

- **The simulation effect mounts once and is never rebuilt.** Game phase is
  mirrored into `modeRef`, which the loop reads each frame. Adding a phase means
  adding a field there, not another effect dependency.
- **Fixed timestep.** The loop accumulates real elapsed time and runs whole
  1/60s steps, so every constant is still "per frame at 60fps" and the game runs
  at the same speed on a 120Hz display. Catch-up is capped at 5 steps.
- **One DOM write per shape per frame, and only when it moved.** Physics runs
  first, rendering second; a shape at rest writes nothing.
- **Pointer events only.** One code path for mouse, touch and pen, with pointer
  capture — so a drag survives leaving the element, multi-touch drags work, and
  the page no longer needs document-level touch listeners.
- **Targets are imperative DOM** tracked in `targetsRef`. `checkTargets()`
  counts and destroys; it must never modify particle physics.
- **The loop pauses** when the tab is hidden or the hero scrolls out of view.

## Bug history — don't reintroduce

1. **Cage suction.** The original "basket cage" force-corrected trapped pieces
   every frame, so everything teleported to one point and vibrated. Baskets were
   removed entirely. Any future containment must never write a position except
   to resolve an actual boundary crossing.
2. **Attraction-to-a-point regressions.** Caused by per-frame position forcing,
   collision early-returns, and a `dx`-used-twice typo in the click explosion.
   Interaction code applies velocity only, never position.
3. **Dark-mode legibility.** Keyline-only buttons vanish on dark backgrounds;
   interactive buttons are solid white.
4. **Vertical balance.** Zero-g idle drift pushes pieces up, so
   `PHYSICS.bottomMargin: 80` mirrors the top spacing.

## Verifying a change

`test/` drives the real game in headless Chromium — shapes spawn, four drags
reveal the button, targets spawn and explode, victory, restart, close, unmount.

```sh
cd float/test
npm install
npm test
```

## Known trade-off

After a won round the pieces are bunched wherever the jets left them, which is
usually the band where new targets spawn. "Play again" places circles in the
clearest gaps it can find and only counts a hit once a circle has been empty at
least once, so it no longer re-wins itself — but a couple of circles still pop
early if a piece drifts through them. Fully fixing it means a design call:
re-deal the pieces on restart, or move the spawn band.
