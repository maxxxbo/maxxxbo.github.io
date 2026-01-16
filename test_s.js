(() => {
  const rt = window.cr_getC2Runtime && window.cr_getC2Runtime();
  if (!rt || !rt.S) return { err: 'no runtime' };

  const typeName = 't45';
  const type = rt.S.find(t => t && t.name === typeName);
  if (!type) return { err: `no type ${typeName}` };

  const layer = rt.wa && rt.wa.ua
    ? rt.wa.ua.find(l => l && l.name === 'items_on_ground')
    : null;
  if (!layer) return { err: 'no layer items_on_ground' };

  const player = (() => {
    const candidates = [];
    for (const t of rt.S) {
      if (!t || !t.q || !t.q.length) continue;
      for (const inst of t.q) {
        if (inst && inst.C && inst.C.name === 'player') {
          candidates.push(inst);
        }
      }
    }
    if (!candidates.length) return null;

    const cx = rt.wa.scrollX;
    const cy = rt.wa.scrollY;
    candidates.sort((a, b) => {
      const da = (a.x - cx) ** 2 + (a.y - cy) ** 2;
      const db = (b.x - cx) ** 2 + (b.y - cy) ** 2;
      return da - db;
    });
    return candidates[0];
  })();

  if (!player) return { err: 'no player instance' };

  const x = player.x + 20;
  const y = player.y + 20;
  const inst = rt.Sg(type.be, layer, false, x, y, false);

  return {
    created: !!inst,
    uid: inst && inst.uid,
    x: inst && inst.x,
    y: inst && inst.y,
    itemCode: inst && inst.cc ? inst.cc[10] : null,
    itemId: inst && inst.cc ? inst.cc[16] : null,
  };
})();
