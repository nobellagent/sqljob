import { P as u, m as n, v as l, Q as y, S as L, x as p, G as f, l as x, L as g, U as h } from "./sqljob-DVwhCRYW.js";
import { R as m } from "./sqljob-B5gCIvHf.js";
const j = ({ children: t, className: e }) => {
  const { attributes: a, listeners: o } = u();
  return n.jsx("div", { className: l("select-none", e), "data-layout-drag-handle": "true", ...a, ...o, children: t });
}, C = ({ children: t }) => {
  const e = y(), { node: a } = e, o = L(), r = p(a), s = f((i) => i.layout), d = x.useMemo(() => s.findAncestorOfType(r, "grid"), [s, r]), c = e.containerType === "leaf" && e.parentContainerType === "grid";
  return !o && !d && !c ? null : t;
}, D = ({ node: t, path: e, parentContainerType: a, parentContainerId: o }) => n.jsx(g, { containerType: "leaf", node: t, path: e, parentContainerType: a, parentContainerId: o, children: n.jsx(h, { children: n.jsx(m, {}) }) }), b = {
  Root: D,
  Header: C,
  DragHandle: j
};
export {
  b as LeafLayout
};
