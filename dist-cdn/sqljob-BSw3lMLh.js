import { u as n, a as d, j as e, L as c } from "./sqljob-DIBYpz5q.js";
import { R as l } from "./sqljob-XqoQaFky.js";
const m = ({ node: o, path: r, parentDirection: s }) => {
  const t = n(o), a = d(), i = e.jsxs("div", { className: "flex h-full w-full flex-col", "data-dock-id": o.id, children: [(t == null ? void 0 : t.title) && e.jsxs("div", { className: "border-border flex items-center gap-2 border-b px-3 py-2", children: [t.icon && e.jsx(t.icon, { className: "h-4 w-4" }), e.jsx("span", { className: "text-sm font-medium", children: t.title })] }), e.jsx("div", { className: "flex-1 overflow-hidden", children: a({
    node: o.root,
    path: [...r, o.id],
    containerType: "root",
    containerId: o.id
  }) })] });
  return e.jsx(c, { containerType: "dock", node: o, path: r, parentDirection: s, children: e.jsx(l, { defaultComponent: i }) });
}, u = {
  Root: m
};
export {
  u as DockLayout
};
