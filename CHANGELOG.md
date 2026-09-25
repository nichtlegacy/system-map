# Changelog

## [0.1.1](https://github.com/nichtlegacy/system-map/compare/system-map-v0.1.0...system-map-v0.1.1) (2026-09-25)


### Documentation

* rewrite the README around what a reader needs first ([#1](https://github.com/nichtlegacy/system-map/issues/1)) ([496049c](https://github.com/nichtlegacy/system-map/commit/496049c060165dba37adcf3d273c98c3b513e546))

## 0.1.0 (2026-09-25)

First public release.

### Added

- A React Flow renderer for hand-placed system maps with ten card kinds
  (`service`, `primaryService`, `external`, `storage`, `artefact`, `infra`,
  `cluster`, `lane`, `stat`, `bars`) and three wire kinds (`data`,
  `management`, `external`).
- A fictional example map on reserved documentation addresses, and a landing
  page drawn from it.
- Full-canvas PNG and SVG export at 1×, 2× or 3×, dark or light, filled or
  transparent, plus clipboard copy.
- Keyboard, trackpad and reduced-motion support; light and dark themes.
- Four layout audits: geometry (no browser, runs in CI), map, labels and
  mobile.
- A container image on GHCR for amd64 and arm64, and a hardened
  `compose.yaml`.
- A project page with a live demo for GitHub Pages, link previews and icons.
