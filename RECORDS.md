# Records

- Verified runtime item spawn via `rt.Sg(type.be, layer, false, x, y, false)` on layer `items_on_ground`.
- Inspected instance variables (`cc`) after spawn to identify item code/id.
- `t148` spawns M16A2 with `cc[10] == "m16"` and `cc[16] == 191`.
- Scanned all types for default instance vars (`be[3]`) containing "m4" or `158`.
- Found `t45` default vars include "m4" and `158`, confirming M4 Carbine.
- Implemented `test_s.js` to spawn `t45` near the player (closest instance on layer `player`).
