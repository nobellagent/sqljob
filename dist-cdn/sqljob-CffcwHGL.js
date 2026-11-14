import { Q as r, V as a, H as c, m as d } from "./sqljob-Cb4WZYKU.js";
const u = ({ defaultComponent: t }) => {
  const n = r(), e = a(n.node), o = e == null ? void 0 : e.component;
  if (o) {
    const s = c(n.node);
    return s.panelId ? d.jsx(o, { panelInfo: e, ...s }) : t;
  }
  return t;
};
export {
  u as R
};
