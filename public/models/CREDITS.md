# Models

## worker.glb

Source: **Kenney Mini Characters** — `character-male-e.glb`, decompressed for Roles (meshopt/quantization removed — those encodings corrupted skinned binds under AnimationMixer in the app’s three/r3f stack). WebP colormap retained.

- Author: Kenney (www.kenney.nl)
- License: Creative Commons CC0 1.0 Universal (see `KENNEY-LICENSE.txt`)
- Why this figure: The planned Quaternius “Worker” (poly.pizza / CC0) requires an authenticated API download that is not available in this environment. Kenney Mini Characters is the CC0 alternative that meets the same criteria: useGLTF-ready, stylized (not photoreal), prop-friendly bones (`arm-left`, `arm-right`, `head`), and readable at Roles panel size.
- Credit (optional per CC0): Kenney.nl

Hard-hat, tablet, and board props are Site Mark authored geometry (not part of the Kenney pack).

### Roles runtime simplification

At load, Roles uses the GLTF scene directly (no SkeletonUtils clone). Kenney colormap is kept — flat material remap broke this skinned mesh in the current three/r3f stack. Role difference is props + root yaw:

| Role | Props | Notes |
|------|-------|-------|
| planner | amber hard-hat + tablet (mark bar) | steel-adjacent read via prop |
| pm | amber hard-hat + board (mark path) | ink-adjacent read via prop |

Clips are not driven at runtime (bind pose only).
