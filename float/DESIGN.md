# Float — design notes

Version label shown in-game: `Float Nov 2025 0.1`. Live at www.testa.studio.

## Game flow

1. **Idle (hero).** Shapes are draggable, no gravity. The cursor *attracts*
   nearby pieces (radius 150, force 0.5); a tap attracts within radius 200
   (force 3). Pieces never flee the cursor — deliberate.
2. **Discovery.** After 4 drags the expand button appears, centred and
   oversized: white pill, black text, black keyline.
3. **Expansion.** The stage animates to 600px. Gravity turns on (0.02). Targets
   spawn at 2.5s, scoring starts at 5s.
4. **Play.** Three 44px water-jet buttons launch the pieces in their third of
   the screen. Targets are keyline circles (white border, black outline); a
   piece entering one destroys it with a scale-up explode.
5. **Counter.** Giant outlined numeral behind the play field (Onest 400,
   `WebkitTextStroke 1px #D1D1D1`, transparent fill, 300px / 200px mobile).
6. **Victory.** "🎉 zen achieved!" card, and the pieces dance — sinusoidal bob,
   continuous spin at 8°/frame, scale pulse, per-piece random phase — until
   *play again* or *close*.
7. **Footer credit.** Bottom-right, 11px `#999`, fades in 2s after the targets.

## Physics — the zen tuning

All of it lives in the `PHYSICS` / `INTERACTION` / `JET` / `CELEBRATION` objects
at the top of `withPhysics.tsx`. Don't change these casually.

| Parameter | Value | Note |
|---|---|---|
| gravity | 0.02 expanded / 0 idle | Idle is zero-g; pieces drift upward, which `bottomMargin` compensates for |
| mass | 0.5 expanded / 1.5 idle | |
| friction (vy) | 0.995 | |
| damping (vx) | 0.998 | |
| bounce | 0.1 | Also scaled ×0.4 in the collision impulse |
| maxSpeed | 2 | Hard clamp — note this caps the jets too, so their raw −100/−120 impulses all arrive as the same top speed |
| groundFriction | 0.97 | |
| rotation damping | 0.995 | |
| bottomMargin | 80px | Mirrors the top spacing for equidistant framing |
| collision minDistance | (a+b)/2 + 8 | Positional separation, impulse only while closing |

**Water jets.** Centre `vy −120`, sides `vy −100` with `vx ±22` inward, rotation
kick ±3. Zones are horizontal thirds.

**Targets.** Desktop 10 @ radius 44, mobile 5 @ radius 30. Spawn band
x = 15–85% of the width, y = 80–330px, chosen from the emptiest of 12
candidate spots. Restart re-deals a fresh random layout.

**Mobile.** Breakpoint `< 768px`. Jets in a centred flex row, gap 20px, bottom
30px. Desktop jets at 25% / 50% / 75%, bottom 80px.

## Design language

- Buttons are solid white pills — keyline-only versions were unreadable in dark
  mode. Desktop jets and the expand button add a black keyline for definition.
- Victory card `#37403E`, white text.
- Palette: `#FF6B4A #5CB8A0 #F0B856 #4A8FE7 #4A92AB #B8805A #9B88C8`.
- 8 custom paths — flower, wedge, wave, play, cross-flower, shield, wing, gem.
  The play shape renders at ×0.75 and the wing at ×0.85 so they read the same
  weight as the rest.
- Shape sizes 28–72px, density 0.4–0.65 by viewport, count clamped 10–60.
- Type is Onest throughout.

## Ideas, not yet built

- Confetti burst on a hit (currently just scale + fade).
- Timer or move counter.
- Sound — a small pop on a hit, ambient during the celebration.
- Moving, ordered, or colour-matched targets.
- A touch equivalent of the magnetic hover for mobile idle mode.
- A fresh deal of the pieces on *play again* (see the trade-off in README).

## Playing notes (from driving it in a browser)

- Hammering the jets pins the whole field against the ceiling — max speed is
  clamped at 2px/frame and gravity is 0.02, so nothing comes back down while
  the bursts keep landing. Clearing the low circles wants hammering; clearing
  the high ones wants letting the field rain back down. Alternating the two is
  what actually finishes a board.
- Collision separation runs after the wall clamp, so a shape in a jam can be
  pushed a few pixels past the top edge for a frame. `overflow: hidden` clips
  it. Reordering would change the collision feel, so it stands.
