# Stringbed: tennis racket stringing simulator

Open `index.html` in a browser. No build step, no server, no runtime dependencies.

`npm test` runs the suite (jsdom is the only devDependency).

## What's in it

**No arrival pop-up.** The page opens on the Your racket tab, and the numbered tabs show
where to start. **Guided setup**, in the header, is a short wizard: the frame (pattern,
hole sets, optional head size) on one screen, then the machine and the kind of string,
then a summary to check over before it drops you into the step-by-step.

**Your racket** is a deck of four cards. Frame specs change between generations,
regions and Team or Lite versions, so the only reliable source is the frame in your
hands. You enter the three things on it that change the instructions:

- **Model**, optional. Picking one only changes the look of the drawings: that line's
  colors and hoop shape (the Yonex frames are isometric, wide, short and square). It
  never sets the pattern, hole sets or head size. "Not listed / skip" keeps the neutral
  graphite frame. The models live in `js/models.js`, grouped by brand.
- **String pattern**, printed on the frame: `16x19`, `16x20`, `18x19`, `18x20`, `16x18`
  or `18x16`.
- **Hole sets at the throat**, 3 or 4. 3 sets: the mains start at the throat. 4 sets:
  they start at the head. The drawing rings the sets you entered, and "Show me how to
  count" opens the throat view.
- **Head size**, optional. Only the drawing and the string length follow it. Not sure
  means a typical 98 sq in.

The racket is drawn by `makeFrame` in `js/frame.js`: the model's hoop and colors, or a
generic 98 in one neutral colorway, scaled to the head size. Change the pattern,
strings, gauges and tensions, and the bed redraws: spacing, string length, knot
positions and a stiffness estimate all follow. Export to SVG or PNG. Skips and tie-off
holes are not modeled. The guide tells you to check them on your own frame.

**String** is a deck of three cards: the kind of string, then thickness and tension,
then method and machine.

**Step-by-step** is an eight-step job generated from whatever is currently on the
bench: tools, mount (and cutting out the old strings), measure, read the throat, start
the first two mains, string the mains, weave the crosses, finish. The numbers differ
for a 16x19 and an 18x20. Each step has a checklist, and the preview shows the racket
at that stage. The mains and crosses steps can be replayed or walked one string at a
time.

Changing the pattern, hole sets, head size, method, string, gauge or tension starts a
*different* job, so the guide asks before clearing ticked checks. Changing the model
does not.

**Throat inspector**: "Show me how to count" tips the racket back (drag the slider from
flat-on to nearly horizontal) and shows a close-up of the yoke with the holes numbered
outward from the center line on each side. 3 sets: mains start at the bottom. 4 sets:
at the top. It shows the count you entered, and you can change it there.

**Knots**: the two knots a job actually uses, side by side. The *finishing tie-off* is a
zoomable five-frame diagram of the double half hitch. The *starting knot*, which anchors
a two-piece cross bunch, is a three-panel diagram of its five moves. Both are drawn in
the colors of the string currently selected.

**Tension and clamping**: a reference card. When to clamp on each machine type and
what it does to the stringbed, clamping rules, and what to expect after stringing.

**Machines**: buyer's guide to the three machine types, plus clamps and mounting.

## Files

| File | What it holds |
|---|---|
| `js/models.js` | Racket models for the drawing's look only: colors and hoop shape, plus the map from old saved racket ids. |
| `js/frame.js` | `makeFrame({ pattern, throatPairs, headSize, model })`: the frame, the patterns and head sizes on offer. |
| `js/strings.js` | The four kinds of string, with a typical thickness, stiffness and color each. Gauges and patterns. |
| `js/fmt.js` | Lengths, cut allowances and dates, rounded to where the confidence stops. |
| `js/geometry.js` | Superellipse hoop maths, stringbed layout, job stats. |
| `js/racketSvg.js` | Draws the racket and stringbed as SVG (millimeter units). |
| `js/steps.js` | `plan()`, the routing decision, and the step-by-step job built on it. |
| `js/throat.js` | The tilt-and-count throat inspector. |
| `js/knot.js` | The zoomable finishing tie-off diagram. |
| `js/startKnot.js` | The starting knot diagram, drawn from `knot.js`'s cord. |
| `js/machines.js` | Machine buyer's guide content. |
| `js/job.js` | Machines, modes, purposes, examples, glossary, progress and persistence. |
| `js/wizard.js` | Guided setup. Holds no state of its own. |
| `js/app.js` | State, wiring, theming, export. |
| `test/` | `npm test`: wording and arithmetic against the modules, behavior in jsdom. |

`Steps.plan()` is the spine: it decides which end each run starts and finishes at and
which side each knot lands on. Every caption, animation frame and knot marker reads it
rather than working the answer out again.

Every pattern is routed by the same parity rules in `plan()` (mains per side, number of
crosses), which is why 16x18 and 18x16 are offered alongside the four common ones.

### Old saves

Saves from before version 5 named a racket id (`blade98`). `Job.load` keeps a small
table of what every old id was, as pattern, hole sets and head size, and turns an old
save into that, in that racket's model colors. An unknown id comes back as 16x19,
3 sets, 98. Version 6 reordered the String deck and put Model in front of the Your
racket deck, and older saves are moved to the same card they were on.

## Note

Stiffness figures, string-length estimates and the tension model are approximations
for teaching the workflow, not lab measurements. Tie-off holes, skip holes and routing
shown in the diagrams are illustrative. The frame's own printed pattern is the
authority.
