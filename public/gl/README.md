# 3D building model

- **`waverly.glb`** — Draco-compressed GLB (~4 MB) used by the hero press-and-hold orbit.
- Source: Meshy AI export via WeTransfer (Aug 2026).
- The uncompressed export was ~129 MB; run `npx @gltf-transform/cli optimize` to regenerate if replaced.

Loaded lazily from `src/lib/building-viewer.ts` after the intro gate.
