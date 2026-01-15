// Verified Logic for Spawning Carbine (t148)
// 修复说明 (2025-01-16):
// 1. 发现实例数组被混淆为 'q' (原为 'instances')。
// 2. 玩家类型名称被混淆，改为通过行为 (ScrollTo) 或 实例数量/属性 启发式查找。
// 3. createInstance 可能混淆为 'TF'。

(function () {
    var runtime = window.cr_getC2Runtime();
    if (!runtime) {
        console.error("Construct 2 Runtime not found!");
        return;
    }

    console.log("=== 运行时诊断 (v2) ===");

    // Helper to get instances from a type regardless of obfuscation
    function getInstances(type) {
        if (!type) return [];
        return type.instances || type.q || [];
    }

    // 1. Find Player (查找玩家)
    var player = null;
    var playerType = null;

    // 策略 A: 查找带有 ScrollTo 行为的实例 (C2 游戏中玩家通常绑定 ScrollTo)
    // 行为实例通常在 behavior_insts, 可能混淆。
    // 我们遍历所有有实例的类型，检查其属性。
    console.log("正在查找玩家...");

    var potentialPlayers = [];

    for (var key in runtime.types) {
        var type = runtime.types[key];
        var instances = getInstances(type);

        if (instances.length > 0) {
            // 检查每个实例
            for (var i = 0; i < instances.length; i++) {
                var inst = instances[i];
                // 检查是否有 behavior_insts (或类似数组)
                // 混淆后很难直接通过名字找 behavior，但我们可以找 behavior_insts 的特征
                // 通常它是一个数组

                // 简单启发式：如果是单一实例且有 x, y，且不是背景(layer不为背景)
                if (instances.length === 1 && typeof inst.x === 'number' && typeof inst.y === 'number') {
                    // 记录下来
                    potentialPlayers.push({ inst: inst, key: key, score: 0 });
                }
            }
        }
    }

    // 筛选：通常玩家会有较多属性 (health, hunger等) 或者位于特定层
    // 让我们尝试通过 "可移动" 特征或 global var 关联。
    // 由于缺乏元数据，我们尝试只需找到 *一个* 看起来像主角的。
    // 如果 potentialPlayers 很多，我们取第一个有 'my_type' 属性或者 behavior 的。

    // 更新策略：直接搜索所有类型，找到 't148' (卡宾枪)，看能否生成。
    // 至于位置，如果找不到玩家，就生成在屏幕中心。

    if (potentialPlayers.length > 0) {
        // 假设第一个单例实体是玩家 (通常 MainHero 是单例)
        player = potentialPlayers[0].inst;
        console.log("推测玩家是类型:", potentialPlayers[0].key, "坐标:", player.x, player.y);
    } else {
        // Fallback: Use center of screen
        var layer = runtime.running_layout.layers[0];
        player = { x: runtime.width / 2, y: runtime.height / 2, layer: layer };
        console.warn("未找到玩家，将尝试在屏幕中心生成:", player.x, player.y);
    }

    // 2. Find Item Type (t148)
    var itemType = runtime.types["t148"];
    if (!itemType) {
        // Try searching by name in types_by_index if available (unlikely in this ver)
        console.error("Critical: Item 't148' not found in runtime.types.");
        return;
    }
    console.log("找到物品类型 t148");

    // 3. Find Layer (查找层) - Enhanced Debugging
    var layer = player.layer || player.l;

    if (!layer) {
        console.log("Player.layer/l is missing. Inspecting player keys for hidden layer ref:");
        // Dump player keys to help user identify layer prop
        var shortKeys = [];
        for (var k in player) {
            if (typeof player[k] === 'object' && player[k] !== null) shortKeys.push(k);
        }
        console.log("Player object keys (objects only):", shortKeys.join(", "));
    }

    if (!layer) {
        console.log("Trying to find global layer from layout...");
        var layoutObj = runtime.running_layout;

        if (!layoutObj && runtime.Fs && runtime.Xv) {
            layoutObj = runtime.Fs[runtime.Xv];
            console.log("Found layout via runtime.Fs[runtime.Xv]");
        }

        if (layoutObj) {
            console.log("Inspecting Layout Object Keys:");
            console.log(Object.keys(layoutObj).join(", "));

            // Heuristic: Layers is usually an array of objects
            // Scan for ANY array in layoutObj
            var candidateLayers = [];
            for (var k in layoutObj) {
                if (Array.isArray(layoutObj[k]) && layoutObj[k].length > 0) {
                    var first = layoutObj[k][0];
                    // Layer usually has 'name', 'index', 'visible', 'instances' (or obfuscated versions)
                    // If it has a reference to runtime, or instances array (q), it's likely a layer.
                    if (typeof first === 'object') {
                        console.log("Found array '" + k + "' with length " + layoutObj[k].length);
                        // Check if it looks like a layer
                        if (first.name || first.index !== undefined || first.instances || first.q) {
                            layer = first;
                            console.log("Guessed layer from array property: " + k);
                            break;
                        }
                        // Store as candidate
                        candidateLayers.push(layoutObj[k]);
                    }
                }
            }

            // If still no layer, just take the first array of objects found in layout
            if (!layer && candidateLayers.length > 0) {
                console.warn("Taking wild guess: using first array in layout as layers list.");
                var list = candidateLayers[0];
                if (list.length > 0) layer = list[0];
            }
        }
    }

    if (!layer) {
        console.error("CRITICAL: Still could not find Layer.");
        alert("错误：无法找到游戏层 (Layer)。请截图控制台日志给我。");
        // return; // Don't return, maybe we can spawn without layer if function allows? (Unlikely)
    } else {
        console.log("Using Layer:", layer);
    }

    // 4. Create Instance / Spawn

    // Safety check for layer object validity
    if (!layer) {
        console.error("Aborting spawn due to missing layer.");
        return;
    }

    // Attempt creation
    var created = false;

    // 1. runtime.createInstance
    if (typeof runtime.createInstance === 'function') {
        try {
            runtime.createInstance(itemType, layer, player.x, player.y);
            console.log("Called runtime.createInstance");
            created = true;
        } catch (e) { console.error("createInstance failed:", e); }
    }

    // 2. runtime.TF (常见混淆名)
    if (!created && typeof runtime.TF === 'function') {
        try {
            runtime.TF(itemType, layer, player.x, player.y);
            console.log("Called runtime.TF");
            created = true;
        } catch (e) { console.error("TF failed:", e); }
    }

    // 3. 暴力搜索 4 参数函数
    if (!created) {
        console.log("Searching for createInstance-like function...");
        for (var k in runtime) {
            if (typeof runtime[k] === 'function' && runtime[k].length === 4) {
                if (k === 'alert' || k === 'prompt' || k === 'console') continue;
                try {
                    if (k.length < 3) {
                        runtime[k](itemType, layer, player.x, player.y);
                        console.log("Tried function: " + k);
                        created = true;
                        break;
                    }
                } catch (e) { }
            }
        }
    }

    if (created) {
        console.log("生成指令已发送。请检查游戏内是否出现卡宾枪。");
        alert("尝试生成卡宾枪完成！\n位置: " + Math.round(player.x) + "," + Math.round(player.y));
    } else {
        alert("无法找到生成函数 (createInstance)。请检查控制台。");
    }

})();
