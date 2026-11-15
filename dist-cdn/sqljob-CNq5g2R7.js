import { A as C, i as y, j as a, R as j, B as z, C as I, d as w, D as g, f as L, E as W, F as H, a as M, L as k } from "./sqljob-B2DhkBSq.js";
import { R as A } from "./sqljob-BuoOBxCZ.js";
function T(e, n) {
  n != null ? (e.resize(n), e.isCollapsed() && e.expand()) : e.expand();
}
const $ = "10%", G = ({ panelId: e, collapsed: n, collapsible: i, collapsedSize: r, defaultSize: o, minSize: s, maxSize: f, onResize: l, children: p }) => {
  const { onCollapse: u, onExpand: t } = C(), d = y.useRef(null);
  y.useEffect(() => {
    const c = d.current;
    c && (n && !c.isCollapsed() ? c.collapse() : !n && c.isCollapsed() && T(c, o));
  }, [n]);
  const S = y.useCallback((c, x, h) => {
    const b = d.current;
    !e || !b || (n && !b.isCollapsed() ? t == null || t(e) : !n && b.isCollapsed() && (u == null || u(e)), l == null || l(c, x, h));
  }, [e, n, t, u, l]), m = s ?? (i ? $ : void 0);
  return a.jsx(j, { id: e, panelRef: d, collapsible: i, collapsedSize: r ?? 0, defaultSize: o, minSize: m, maxSize: f, onResize: S, children: p });
};
function N(e) {
  return typeof e == "number" ? `${e}px` : e;
}
function B(e, n) {
  return n === "column" ? {
    height: e.defaultSize ?? "auto",
    minHeight: e.minSize,
    maxHeight: e.maxSize
  } : {
    width: e.defaultSize ?? "auto",
    minWidth: e.minSize,
    maxWidth: e.maxSize
  };
}
function D(e) {
  return z(e) ? {
    collapsible: !1
  } : {
    defaultSize: N(e.defaultSize),
    minSize: N(e.minSize),
    maxSize: N(e.maxSize),
    collapsedSize: N(e.collapsedSize),
    collapsible: e.collapsible ?? !1
  };
}
function R(e) {
  return z(e) ? !1 : e.collapsed === !0;
}
const v = ({ className: e, ...n }) => a.jsx(I, { className: w("bg-border hover:bg-primary/60 transition-colors", e), ...n }), E = ({ node: e, nodeIndex: n, handleComponent: i, children: r }) => {
  const { node: o } = g(), s = L(e), f = D(e), l = R(e), p = n === o.children.length - 1, u = o.resizable !== !1, t = i || a.jsx(v, { "data-layout-panel-handle-after": s, "data-layout-panel-collapsed": l ? "true" : "false" });
  return u ? f.collapsible ? a.jsxs(a.Fragment, { children: [a.jsx(G, { panelId: s, collapsed: l, ...f, children: r }), !p && t] }) : a.jsxs(a.Fragment, { children: [a.jsx(j, { id: s, ...f, children: r }), !p && t] }) : a.jsx("div", { className: "flex-1", style: B(f, o.direction), children: r });
};
function F(e) {
  if (typeof e != "number" && typeof e == "string") {
    const n = e.trim();
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)%?$/.test(n))
      return;
    const i = Number.parseFloat(n);
    return Number.isFinite(i) && i >= 0 && i <= 100 ? i : void 0;
  }
}
function U(e) {
  return typeof e == "number" ? !0 : typeof e == "string" && e.trim().length > 0 && F(e) === void 0;
}
function _(e) {
  if (e === void 0)
    return !1;
  if (typeof e == "number")
    return e !== 0;
  const n = Number.parseFloat(e.trim());
  return !Number.isFinite(n) || n !== 0;
}
function K(e) {
  if (e.length === 0)
    return;
  const n = e.map((t) => {
    const d = L(t), S = R(t), m = z(t), c = m ? void 0 : F(t.defaultSize), x = m ? !1 : U(t.defaultSize), h = m ? void 0 : t.collapsedSize;
    return { id: d, collapsed: S, percent: c, explicitNonPercentSize: x, collapsedSize: h };
  });
  if (n.some((t) => t.collapsed && _(t.collapsedSize)))
    return;
  const i = n.filter((t) => !t.collapsed);
  if (i.length === 0 || i.some((t) => t.explicitNonPercentSize))
    return;
  const r = i.reduce((t, d) => t + (d.percent ?? 0), 0), o = i.filter((t) => t.percent === void 0).length;
  if (o > 0 && r >= 100)
    return;
  const s = Math.max(0, 100 - r), f = o > 0 ? s / o : 0, l = /* @__PURE__ */ new Map();
  for (const t of n)
    t.collapsed ? l.set(t.id, 0) : l.set(t.id, t.percent ?? f);
  const p = i.reduce((t, d) => t + (l.get(d.id) ?? 0), 0), u = {};
  for (const t of n)
    t.collapsed ? u[t.id] = 0 : p > 0 ? u[t.id] = (l.get(t.id) ?? 0) / p * 100 : u[t.id] = 100 / i.length;
  return u;
}
function Z(e, n, i) {
  const r = Number(e.toFixed(4)), o = n === void 0 ? void 0 : Math.round(n);
  if (typeof i == "number")
    return o ?? i;
  if (typeof i == "string") {
    const s = i.trim();
    if (s.endsWith("%"))
      return `${r}%`;
    if (s.endsWith("px"))
      return o === void 0 ? i : `${o}px`;
  }
  return `${r}%`;
}
function q(e, n, i) {
  const r = Array.from((e == null ? void 0 : e.querySelectorAll("[data-panel]")) ?? []).find((o) => o.id === n);
  return i === "column" ? r == null ? void 0 : r.offsetHeight : r == null ? void 0 : r.offsetWidth;
}
function O(e, n) {
  return z(e) ? {
    type: "panel",
    id: e,
    panel: e,
    defaultSize: n
  } : e.defaultSize === n ? e : { ...e, defaultSize: n };
}
const J = ({ children: e }) => {
  const { node: n } = g(), { rootLayout: i, onLayoutChange: r } = C(), o = y.useRef(null), s = n.direction === "column" ? "vertical" : "horizontal", f = y.useMemo(() => K(n.children), [n.children]), l = y.useCallback((p, u) => {
    if (!u.isUserInteraction || !r)
      return;
    let t = i;
    for (const d of n.children) {
      const S = L(d), m = p[S];
      if (m === void 0)
        continue;
      const c = z(d) ? void 0 : d.defaultSize, x = q(o.current, S, n.direction), h = Z(m, x, c);
      t = W(t, S, (b) => O(b, h));
    }
    t !== i && r(t);
  }, [r, n.children, n.direction, i]);
  return a.jsx(H, { elementRef: o, orientation: s, defaultLayout: f, onLayoutChanged: l, children: e });
}, Q = ({ node: e }) => {
  const { node: n, path: i } = g();
  return M()({
    node: e,
    path: i,
    containerType: "split",
    containerId: n.id,
    parentDirection: n.direction
  });
}, V = ({ node: e, path: n }) => {
  const i = a.jsx("div", { className: "relative h-full w-full", "data-layout-split-id": e.id, children: a.jsx(P.PanelGroup, { children: e.children.map((r, o) => {
    const s = L(r);
    return a.jsx(P.Panel, { node: r, nodeIndex: o, children: a.jsx(P.PanelContent, { node: r }) }, s);
  }) }) });
  return a.jsx(k, { containerType: "split", node: e, path: n, children: a.jsx(A, { defaultComponent: i }) });
}, P = {
  Root: V,
  Panel: E,
  PanelGroup: J,
  PanelContent: Q,
  Handle: v
};
export {
  P as SplitLayout
};
