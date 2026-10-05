# Stringbed — tennis racket stringing simulator

Open `index.html` in a browser. No build step, no server, no runtime dependencies.

`npm test` runs the suite (jsdom is the only devDependency).

## What's in it

**First run** — a dialog offers a three-question setup wizard or a straight trip to the
bench. The wizard asks for the frame (pattern, hole sets, optional head size) on one screen, then the machine and the kind of string, shows you the whole thing to check over, and drops you into the
step-by-step. It is skippable in one click and never reappears once dismissed.

**Your racket**: there is no racket list. Frame specs change between generations,
regions and Team or Lite versions, so the only reliable source is the frame in your
hands. You enter the three things on it that change the instructions:

- **String pattern**, printed on the frame: `16x19`, `16x20`, `18x19`, `18x20`, `16x18`
  or `18x16`.
- **Hole sets at the throat**, 3 or 4. 3 sets: the mains start at the throat. 4 sets:
  they start at the head. "Show me how to count" opens the throat view.
- **Head size**, optional. Only the drawing and the string length follow it. Not sure
  means a typical 98 sq in.

The racket is drawn from a generic frame (`makeFrame` in `js/frame.js`) in one neutral
colourway. Change the pattern, strings, gauges and tensions, and the bed redraws:
spacing, string length, knot positions and a stiffness estimate all follow. Export to
SVG or PNG. Skips and tie-off holes are not modelled: the guide tells you to check them
on your own frame.

**Step-by-step** — an eight-step job generated from whatever is currently on the bench:
tools, mount, measure, read the throat, choose the method, start the first two mains,
string the mains, weave the crosses, finish. The numbers differ for a 16x19 and an
18x20. Each step has a checklist, and the preview shows the racket at that stage — the
mains and crosses steps can be replayed or walked one string at a time.

Changing the pattern, hole sets, head size, method, string, gauge or tension starts a *different* job,
so the guide asks before clearing ticked checks.

**Throat inspector** — "Tilt the frame & count the holes" tips the racket back (drag the
slider from flat-on to nearly horizontal) and shows a close-up of the yoke with the hole
pairs numbered outward from the centre line. 3 pairs -> mains start at the bottom,
4 pairs -> at the top. It shows the count you entered, and you can change it there.

**Knots** — the two knots a job actually uses, side by side. The *finishing tie-off* is a
zoomable five-frame diagram of the double half hitch; the *starting knot*, which anchors
a two-piece cross bunch, is a three-panel diagram of its five moves. Both are drawn in
the colours of the string currently selected.

**Tension & clamping** — a reference card: when to clamp on each machine type and what
it does to the stringbed, clamping rules, and what to expect after stringing.

**Machines** — buyer's guide to the three machine types, plus clamps and mounting.

## Files

| File | What it holds |
|---|---|
| `js/frame.js` | `makeFrame({ pattern, throatPairs, headSize })`: the generic frame, the patterns and head sizes on offer. |
| `js/strings.js` | The four kinds of string, with a typical thickness, stiffness and colour each. Gauges and patterns. |
| `js/fmt.js` | Lengths, cut allowances and dates, rounded to where the confidence stops. |
| `js/geometry.js` | Superellipse hoop maths, stringbed layout, job stats. |
| `js/racketSvg.js` | Draws the racket + stringbed as SVG (millimetre units). |
| `js/steps.js` | `plan()` — the routing decision — and the step-by-step job built on it. |
| `js/throat.js` | The tilt-and-count throat inspector. |
| `js/knot.js` | The zoomable finishing-tie-off diagram. |
| `js/startKnot.js` | The starting-knot diagram, drawn from `knot.js`'s cord. |
| `js/machines.js` | Machine buyer's-guide content. |
| `js/job.js` | Machines, modes, purposes, examples, glossary, progress and persistence. |
| `js/wizard.js` | The beginner setup wizard. Holds no state of its own. |
| `js/app.js` | State, wiring, theming, export. |
| `test/` | `npm test` — wording and arithmetic against the modules, behaviour in jsdom. |

`Steps.plan()` is the spine: it decides which end each run starts and finishes at and
which side each knot lands on. Every caption, animation frame and knot marker reads it
rather than working the answer out again.

Every pattern is routed by the same parity rules in `plan()` (mains per side, number of
crosses), which is why 16x18 and 18x16 are offered alongside the four common ones.

### Old saves

Saves from before version 5 named a racket id (`blade98`). `Job.load` keeps a small
table of what every old id was, as pattern, hole sets and head size, and turns an old
save into that. An unknown id comes back as 16x19, 3 sets, 98.

## Note

Stiffness figures, string-length estimates and the tension model are approximations
for teaching the workflow, not lab measurements. Tie-off holes, skip holes and routing
shown in the diagrams are illustrative — the frame's own printed pattern is the
authority.
