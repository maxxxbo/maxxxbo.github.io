// Spawn one item (t148) on the items_on_ground layer near current camera.
(() => {
  const rt = window.cr_getC2Runtime && window.cr_getC2Runtime();
  if (!rt || !rt.S) return { err: 'no runtime' };
  const type = rt.S.find(t => t && t.name === 't148');
  if (!type) return { err: 'no type t148' };
  const layer = rt.wa && rt.wa.ua ? rt.wa.ua.find(l => l && l.name === 'items_on_ground') : null;
  if (!layer) return { err: 'no layer items_on_ground' };
  const x = rt.wa.scrollX;
  const y = rt.wa.scrollY;
  const inst = rt.Sg(type.be, layer, false, x, y, false);
  return { created: !!inst, typeCount: type.q ? type.q.length : null };
})();
