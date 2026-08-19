# What changed in this pass

Refactor of the Nov 2025 production override. The game plays the same: same
physics constants, same flow, same visual design. Everything below is either a
bug fix, a performance fix, or structure.

## Bugs fixed

- **Two animation loops could run at once.** The first `requestAnimationFrame`
  id was never stored, so cleanup couldn't cancel it. A teardown before the
  first frame (any of the three effect dependencies changing quickly, or React
  StrictMode) left an orphan loop running — everything moved at double speed.
  The loop now owns its id and is started/stopped in one place.
- **The loop died if the container started at zero size.** `animate()` returned
  without rescheduling. It now keeps ticking and a `ResizeObserver` builds the
  shapes as soon as the hero has a size.
- **The expansion timers were never cleared.** Closing before the 5s mark still
  fired `setGameActive(true)` and spawned targets into a collapsed container.
  Every timeout is now tracked and cleared on unmount and on close.
- **Shapes stayed draggable in expanded mode.** `startDrag` captured
  `isExpanded` at creation time, and pieces are preserved across expansion, so
  the guard was reading a stale `false`. Phase now comes from a ref.
- **Throwing had no throw in it.** Release velocity was computed from the
  particle's own centre after it had been moved to the pointer, which is the
  grab offset — a constant, not a flick. Velocity now comes from the pointer
  trail of the last ~80ms.
- **The victory dance displaced the shapes.** The bob was integrated into `y`
  every frame, so pieces drifted from where they stopped. It is now a render
  offset (same amplitude, no drift).
- **`play again` re-won itself.** Fresh circles spawned on top of the pieces the
  dance left mid-field and popped on the next frame — sometimes the whole board.
  Circles are now placed in the clearest gaps, and a circle only counts a hit
  once it has been empty at least once (with a ~4s failsafe so a permanently
  blocked circle can't lock the board).
- **The shuffle was biased.** `sort(() => Math.random() - 0.5)` is not a
  shuffle; replaced with Fisher–Yates.
- **`fadeIn`, `popIn` and `explode` are global keyframe names** on a Framer
  page. Prefixed with `float-`.
- **Touch drags scrolled the page**, because the document-level `touchmove`
  listener never called `preventDefault`. Pointer capture handles this now.
- **`isMobile` was read once at render** from `window.innerWidth` with no
  listener, so rotating a phone kept the desktop layout. Now `matchMedia`.

## Performance

- **Fixed timestep.** The old loop advanced one step per frame, so a 120Hz
  display ran the game at double speed. Now it advances by elapsed time.
- **No forced reflow per frame.** `offsetWidth`/`offsetHeight` were read on
  every frame inside the loop; a `ResizeObserver` caches the size instead.
- **No wasted style writes.** Transforms are only written when they change, so
  a settled field costs nothing.
- **The loop pauses** when the tab is hidden or the hero is scrolled out of view.
- **Shape styles moved to a stylesheet class** instead of a `cssText` blob per
  element, and transforms use `translate3d`.
- **The simulation effect no longer tears down** on `isExpanded` / `gameActive` /
  `isCelebrating`, so listeners are bound once and the shapes are never rebuilt
  mid-game.

## Removed

- **Dark-mode detection.** `isDarkMode` was computed by a document-wide
  `MutationObserver` plus a resize listener and re-rendered the component, but
  the value was never read anywhere. Deleted; the git history has it if theme-
  aware colours are wanted later.
- **The chain-explosion block** in the loop. `isExploding` was only ever set
  inside the branch that required it to already be true — unreachable code.
- **The mobile/desktop branch in the water jets.** Both sides of the `if` were
  identical.

## One intentional change of feel

Shapes had `transition: transform 0.1s ease-out` while their transform was being
rewritten 60 times a second — the compositor was interpolating between physics
frames, which is 100ms of lag on every drag and a constant cost. It's off.
`SHAPE_TRANSITION` at the top of the file restores the old string if the
smoothing was wanted.

## Not changed

Every number in `PHYSICS`, `INTERACTION`, `JET`, `TARGETS`, `CELEBRATION`, the
palette, the 8 paths, the copy, and the button design are as they shipped.
