# A WebGL based Neon-filled loot-box experience

This tool can dynamically render arbitrarily shaped neon lights against a background with normal map, roughness map, and ambient occlusion map.
In addition to that, it contains a small particle effect system to demonstrate the dynamic nature of the technique.

All dynamic behaviour in the scene is attempted to be scriptable using State Machines.
The current scene however is a combination of generic functionality and ad-hoc embedded scripts.

## Open problems
Currently the resolution of the canvas is fixed to the browser's viewport, and resizing the browser will break the coordinate system.
A refresh will fix this.

## Assets
I am no sprite artist, and this tool could use better lamps and particles.
More importantly, it could benefit from an interestingly scripted scene.