# FarmLand

React + TypeScript + SVG workspace for mapping an arecanut plantation.

## Current slice

The first screen is a field geometry desk. It provides:

- An agricultural satellite-style underlay for the first field draft.
- An editable SVG boundary polygon with draggable control points.
- Live relative area and perimeter readouts.
- Reset and underlay visibility controls.

The current underlay is procedural and local so the app works without external image files. Replace `SatelliteTexture` in `src/App.tsx` with the supplied satellite raster when its workspace path is available. The next planned layer is planting-row geometry anchored to this boundary.

## Run locally

```bash
npm install
npm run dev
```

The production check is `npm run build`.
