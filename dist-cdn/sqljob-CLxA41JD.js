import { c as u, j as n, d as l, b as y, e as L, f as p, h as f, i as x, L as g, k as h } from "./sqljob-DNXBxrVS.js";
import { R as m } from "./sqljob-BYXoOwpe.js";
const j = ({ children: t, className: e }) => {
  const { attributes: a, listeners: o } = u();
  return n.jsx("div", { className: l("select-none", e), "data-layout-drag-handle": "true", ...a, ...o, children: t });
}, b = ({ children: t }) => {
  const e = y(), { node: a } = e, o = L(), r = p(a), s = f((i) => i.layout), d = x.useMemo(() => s.findAncestorOfType(r, "grid"), [s, r]), c = e.containerType === "leaf" && e.parentContainerType === "grid";
  return !o && !d && !c ? null : t;
}, C = ({ node: t, path: e, parentContainerType: a, parentContainerId: o }) => n.jsx(g, { containerType: "leaf", node: t, path: e, parentContainerType: a, parentContainerId: o, children: n.jsx(h, { children: n.jsx(m, {}) }) }), H = {
  Root: C,
  Header: b,
  DragHandle: j
};
export {
  H as LeafLayout
};
