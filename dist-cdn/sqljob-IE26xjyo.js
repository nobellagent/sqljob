import { b as s, u as a, r as c, j as u } from "./sqljob-DMG-MJM3.js";
const i = ({ defaultComponent: t }) => {
  const n = s(), e = a(n.node), o = e == null ? void 0 : e.component;
  if (o) {
    const r = c(n.node);
    return r.panelId ? u.jsx(o, { panelInfo: e, ...r }) : t;
  }
  return t;
};
export {
  i as R
};
