# Design system

This document records the rules implemented by the starter. Components should
use these tokens and patterns rather than adding isolated values.

## Colour

Every colour resolves through a semantic token in `app/globals.css`. The dark
and light themes define the same hierarchy:

| Token family | Use |
| --- | --- |
| `--color-canvas`, `--color-surface`, `--color-contrast` | Page and card layers |
| `--color-fg`, `--color-fg-2`, `--color-fg-3` | Text hierarchy |
| `--color-line`, `--color-line-2`, `--color-line-3` | Borders and connectors |
| `--color-accent` | Anything crossing the system boundary |
| `--color-success` | Running state |
| `--color-edge-*` | Data, management, and external flows |

Colour always has a second cue. Status includes text, edge flavours use
different dash patterns, and every bar prints its value.

## Type and spacing

Geist Sans carries prose and interface labels. Geist Mono marks operational
strings such as ports, paths, counts, and edge labels.

Page spacing follows the Tailwind scale. Map cards use fixed dimensions because
React Flow needs stable geometry before it can fit the initial viewport. A
normal card is 232 by 200 pixels. Compact cards are 232 by 116 pixels. The
primary card is 420 by 364 pixels.

## Node kinds

`components/map/elementTypes.ts` registers ten renderers. Each one has one job:

- `service`, `external`, and `storage` render standard cards with different
  boundary and capacity treatments.
- `primaryService` gives the map's main decision point more room.
- `infra` and `cluster` draw meaningful frames, not decoration.
- `lane` labels reading order.
- `stat` shows one derived result.
- `bars` compares ranked values and always includes their text values.
- `artefact` shows the output itself — a report, a render — on the normal
  232 by 200 plate, so no new card size enters the scale.

Frames group related nodes or provide an edge attachment point. They should not
wrap content merely to add another border.

## Edges

The map has three edge flavours:

- `data` for payloads and stored records;
- `management` for control, state, and health signals;
- `external` for a system-boundary crossing.

Labels sit beside the curve. `FlowEdge` computes the curve normal and supports a
side override or small nudge when the available corridor is narrow. Stage
numbers belong in workflow labels, not in separate decorative nodes.

## Motion and input

Motion explains flow or confirms interaction. It stops under
`prefers-reduced-motion`. The canvas supports pointer dragging, wheel and pinch
zoom, Shift-wheel panning, arrow-key panning, keyboard zoom, and keyboard fit.
Resize fitting stops after the visitor moves the viewport.

## Export

Export works from an off-screen clone of the whole React Flow viewport. This
keeps the live view still, captures nodes outside the current viewport, and
allows a light or dark result without changing the page theme. Transparent
exports use pre-composited edge tokens so lines keep their intended contrast.

## Geometry checks

`scripts/audit-geometry.mjs` reads the topology without a browser and rebuilds
every edge's bezier against every card, so a wire through a card fails before
the page is ever rendered. CI runs it on every push.

`scripts/audit-map.mjs` checks frame containment, card overlap, edge crossings,
label collisions, and clipped content in the rendered page.
`scripts/audit-labels.mjs` samples edge paths more densely, checks label
clearance from plates, ink spilling past a card, and responsive navigation.
`scripts/audit-mobile.mjs` fails when any page scrolls sideways on a phone.

Run the browser audits at 2560×1440, 1920×1080, and 1440×900 with `--vp`.
Straight wires are preferred: align handle centres by hand.

Positions remain hand-authored. The checks measure whether the result is sound;
they do not choose a layout.

## External references

The restrained token hierarchy and Geist typography were informed by
Vercel's published design guidance: <https://vercel.com/design.md>. This
repository does not copy or archive that document.
