// Enhanced Logic for Spawning Item (Target: t145 - Deagle)
// Updated: 2026-01-15 - Robust Version

(function () {
    console.clear();
    var runtime = window.cr_getC2Runtime();
    if (!runtime) {
        console.error("Construct 2 Runtime not found!");
        return;
    }

    console.log("%c=== Mini Dayz Spawner DEBUG (v4) ===", "color: lime; font-weight: bold; font-size: 16px;");

    // Helper to get instances from a type
    function getInstances(type) {
        if (!type) return [];
        return type.instances || type.q || [];
    }

    // 1. Find Player (查找玩家)
    var player = null;
    var playerType = null;

    console.log("正在自动化搜索玩家和游戏图层...");

    // Heuristic 1: Look for survivability properties
    var survivabilityProps = ["hp", "hunger", "thirst", "blood", "temperature", "temp", "sanity", "isPlayer"];
    var bestMatch = null;
    var maxPropsFound = 0;

    for (var key in runtime.types) {
        var type = runtime.types[key];
        var instances = getInstances(type);
        if (instances.length === 1) {
            var inst = instances[0];
            var propsFound = survivabilityProps.filter(p => p in inst).length;

            if (propsFound > maxPropsFound) {
                maxPropsFound = propsFound;
                bestMatch = { inst: inst, key: key, score: propsFound };
            }
        }
    }

    if (bestMatch && bestMatch.score > 0) {
        player = bestMatch.inst;
        playerType = bestMatch.key;
        console.log(`%c[Player] Found via properties: ${playerType} (Score: ${bestMatch.score})`, "color: cyan");
    }

    // Heuristic 2: Look for behavior clues (ScrollTo is usually index 0 or has a specific property)
    if (!player) {
        for (var key in runtime.types) {
            var insts = getInstances(runtime.types[key]);
            if (insts.length === 1) {
                var inst = insts[0];
                // Check behaviors (usually an array like behavior_insts, b, or similar)
                var behaviors = inst.behavior_insts || inst.u || [];
                for (var b of behaviors) {
                    if (b.behavior && (b.behavior.name === "ScrollTo" || b.behavior.kd === "ScrollTo")) {
                        player = inst;
                        playerType = key;
                        console.log(`%c[Player] Found via ScrollTo: ${playerType}`, "color: cyan");
                        break;
                    }
                }
            }
            if (player) break;
        }
    }

    if (!player) {
        console.warn("未锁定玩家，请确保已进入地图环境。使用画面中心作为默认点。");
        player = { x: runtime.width / 2, y: runtime.height / 2 };
    } else {
        console.log(`%c[Status] Player at (${Math.round(player.x)}, ${Math.round(player.y)})`, "color: #33ccff");
    }

    // 2. Find Item Type (t145)
    var targetID = "t145";
    var itemType = runtime.types[targetID];
    if (!itemType) {
        console.error(`%c[Error] Target ID '${targetID}' not found in runtime.types. Check data.js.`, "color: red");
        return;
    }
    console.log(`%c[Item] Target Type identified: ${targetID}`, "color: yellow");

    // 3. Find Layer (查找层)
    var layer = null;
    var layout = runtime.running_layout || (runtime.Fs && runtime.Fs[runtime.Xv]);

    if (layout) {
        var layers = layout.layers || layout.nb || [];
        // Priority 1: Named "Game", "Objects", "Ground"
        for (var l of layers) {
            var lName = (l.name || "").toLowerCase();
            if (["game", "objects", "ground", "main"].includes(lName)) {
                layer = l;
                console.log(`%c[Layer] Found by name: ${l.name}`, "color: pink");
                break;
            }
        }

        // Priority 2: Use player's layer index if available
        if (!layer && player && player.layer) {
            layer = player.layer;
            console.log(`%c[Layer] Using player's layer: ${layer.name || "Unnamed"}`, "color: pink");
        }

        // Priority 3: First visible layer with instances
        if (!layer) {
            for (var l of layers) {
                if (l.visible && getInstances(l).length > 0) {
                    layer = l;
                    console.log(`%c[Layer] Using fallback visible layer: ${l.name || "Index " + l.index}`, "color: pink");
                    break;
                }
            }
        }
    }

    if (!layer) {
        console.error("%c[Error] Layout/Layer system not initialized or inaccessible.", "color: red");
        return;
    }

    // 4. Create Instance / Spawn
    var created = false;
    var spawnFuncs = ["createInstance", "TF", "XF", "mC", "vE"];

    console.log("正在尝试注入生成指令...");

    for (var fName of spawnFuncs) {
        if (typeof runtime[fName] === 'function') {
            try {
                // Construct 2 createInstance(type, layer, x, y)
                runtime[fName](itemType, layer, player.x, player.y);
                console.log(`%c[Success] Dispatched spawn call via: runtime.${fName}`, "color: #00ff00; font-weight: bold;");
                created = true;
                break;
            } catch (e) {
                // Silently try next
            }
        }
    }

    // Bruteforce search for function with 4 arguments
    if (!created) {
        console.log("主要方法失败，启动暴力搜索 (4-arg functions)...");
        for (var k in runtime) {
            if (typeof runtime[k] === 'function' && runtime[k].length === 4) {
                if (["alert", "prompt", "confirm", "scroll", "move", "XF"].includes(k)) continue;
                if (k.length > 5) continue;
                try {
                    runtime[k](itemType, layer, player.x, player.y);
                    console.log(`%c[Bruteforce] Triggered runtime.${k}`, "color: orange");
                    created = true;
                } catch (e) { }
            }
        }
    }

    if (created) {
        console.log("%c>>> 生成指令执行完毕。请在游戏内移动一下或查看角色脚下。 <<<", "color: #00ff00; font-size: 14px;");
        alert(`指令执行成功！\nID: ${targetID}\n位置: ${Math.round(player.x)}, ${Math.round(player.y)}`);
    } else {
        alert("无法找到匹配的生成函数。请检查 console 日志寻找线索。");
    }

})();
