import { m as s, l as d, T as I, B as D, C as A, D as B, E as C, k as P, F as K, G as R, x as v, H as Z, I as q, J as g, K as w, M as z, N as f, O as m, A as G, L as H } from "./sqljob-BkqWDi1b.js";
import { R as J } from "./sqljob-DWdZHbu_.js";
const V = ({ tab: e, path: t }) => {
  const n = e.icon;
  return s.jsxs("span", { className: "flex items-center gap-1.5 truncate", children: [n && s.jsx(n, { className: "h-3.5 w-3.5 shrink-0 opacity-70" }), s.jsx("span", { className: "truncate", children: e.name })] });
};
/**
 * @license lucide-react v0.556.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const X = (e) => e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), Q = (e) => e.replace(
  /^([A-Z])|[\s-_]+(\w)/g,
  (t, n, o) => o ? o.toUpperCase() : n.toLowerCase()
), N = (e) => {
  const t = Q(e);
  return t.charAt(0).toUpperCase() + t.slice(1);
}, S = (...e) => e.filter((t, n, o) => !!t && t.trim() !== "" && o.indexOf(t) === n).join(" ").trim(), Y = (e) => {
  for (const t in e)
    if (t.startsWith("aria-") || t === "role" || t === "title")
      return !0;
};
/**
 * @license lucide-react v0.556.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
var ee = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};
/**
 * @license lucide-react v0.556.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const te = d.forwardRef(
  ({
    color: e = "currentColor",
    size: t = 24,
    strokeWidth: n = 2,
    absoluteStrokeWidth: o,
    className: a = "",
    children: i,
    iconNode: l,
    ...c
  }, b) => d.createElement(
    "svg",
    {
      ref: b,
      ...ee,
      width: t,
      height: t,
      stroke: e,
      strokeWidth: o ? Number(n) * 24 / Number(t) : n,
      className: S("lucide", a),
      ...!i && !Y(c) && { "aria-hidden": "true" },
      ...c
    },
    [
      ...l.map(([u, h]) => d.createElement(u, h)),
      ...Array.isArray(i) ? i : [i]
    ]
  )
);
/**
 * @license lucide-react v0.556.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const y = (e, t) => {
  const n = d.forwardRef(
    ({ className: o, ...a }, i) => d.createElement(te, {
      ref: i,
      iconNode: t,
      className: S(
        `lucide-${X(N(e))}`,
        `lucide-${e}`,
        o
      ),
      ...a
    })
  );
  return n.displayName = N(e), n;
};
/**
 * @license lucide-react v0.556.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ne = [
  ["path", { d: "m6 17 5-5-5-5", key: "xnjwq" }],
  ["path", { d: "m13 17 5-5-5-5", key: "17xmmf" }]
], k = y("chevrons-right", ne);
/**
 * @license lucide-react v0.556.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const se = [
  ["path", { d: "m17 11-5-5-5 5", key: "e8nh98" }],
  ["path", { d: "m17 18-5-5-5 5", key: "2avn1x" }]
], oe = y("chevrons-up", se);
/**
 * @license lucide-react v0.556.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ae = [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
], re = y("x", ae), ie = ({ onClick: e }) => s.jsxs(I, { children: [s.jsx(D, { asChild: !0, children: s.jsx(A, { variant: "ghost", size: "icon", className: "hover:bg-primary/10 h-7 w-7 shrink-0", onClick: e, "aria-label": "Collapse", children: s.jsx(re, { className: "h-3.5 w-3.5" }) }) }), s.jsx(B, { children: "Collapse" })] }), ce = ({ direction: e, onClick: t }) => {
  const n = e === "column" ? oe : k;
  return s.jsxs(I, { children: [s.jsx(D, { asChild: !0, children: s.jsx(A, { variant: "ghost", size: "icon", className: "hover:bg-primary/10 h-7 w-7 shrink-0", onClick: t, "aria-label": "Expand", children: s.jsx(n, { className: "h-3.5 w-3.5" }) }) }), s.jsx(B, { children: "Expand" })] });
}, le = () => {
  const { node: { id: e, collapsed: t }, parentDirection: n } = C(), { onCollapse: o, onExpand: a } = P(), i = d.useCallback(() => {
    o == null || o(e);
  }, [e, o]), l = d.useCallback(() => {
    a == null || a(e);
  }, [e, a]);
  return s.jsx(K, { delayDuration: 300, children: t ? s.jsx(ce, { direction: n, onClick: l }) : s.jsx(ie, { onClick: i }) });
};
function de() {
  const e = C(), { node: t } = e, n = R((a) => a.layout.panels);
  return d.useMemo(() => {
    const a = [];
    for (const i of t.children) {
      const l = v(i), { panelId: c, meta: b } = Z(i);
      if (!c)
        continue;
      const u = n[c], h = u ? q(u, {
        panelId: c,
        meta: b,
        layoutNode: e
      }) : null;
      a.push({
        id: l,
        name: (h == null ? void 0 : h.title) ?? c,
        icon: h == null ? void 0 : h.icon
      });
    }
    return a;
  }, [t.children, n, e]);
}
const he = ({ children: e, ...t }) => {
  const { onTabSelect: n, onTabClose: o, onTabReorder: a, onTabCreate: i, onExpand: l } = P(), { node: c, path: b } = C(), u = R((r) => r.layout.config), h = d.useMemo(() => {
    const r = g(u, c.id);
    return !(r != null && r.node) || !w(r.node) ? [] : z(f(r.node));
  }, [u, c.id]), T = d.useMemo(() => {
    const r = g(u, c.id);
    if (!(r != null && r.node) || !w(r.node))
      return;
    const x = f(r.node)[r.node.activeTabIndex];
    return x != null ? v(x) : void 0;
  }, [u, c.id]), p = c.id, E = c.collapsible, $ = de(), F = d.useCallback(() => {
    l == null || l(p), i == null || i(p);
  }, [p, i, l]), O = d.useCallback((r) => {
    const j = r.find((x) => !h.includes(x));
    j ? n == null || n(p, j) : a == null || a(p, r);
  }, [p, n, a, h]), U = d.useCallback((r) => {
    o == null || o(p, r);
  }, [p, o]), W = d.useCallback((r) => {
    l == null || l(p), n == null || n(p, r);
  }, [p, n, l]);
  return s.jsxs(m, { tabs: $, openTabs: h, selectedTabId: T, preventCloseLastTab: !0, closeable: !1, onSelect: W, onClose: U, onOpenTabsChange: O, onCreate: F, renderTabLabel: (r) => s.jsx(V, { tab: r, path: b }), ...t, children: [e, E && s.jsxs(s.Fragment, { children: [s.jsx("div", { className: "flex-1" }), s.jsx(le, {})] })] });
};
function ue() {
  const { node: e, path: t } = C(), o = d.useMemo(() => f(e), [e])[e.activeTabIndex] ?? null, a = o ? v(o) : null, i = a ? [...t, a] : null;
  return {
    container: e,
    node: o,
    path: i,
    id: a
  };
}
const M = ({ forceMount: e = !1 }) => {
  const { node: t, path: n } = ue(), { node: o, path: a } = C(), i = G(), l = d.useMemo(() => f(o), [o]);
  return !t || !n ? null : e ? s.jsx(s.Fragment, { children: l.map((c, b) => {
    const u = v(c), h = [...a, u], T = b === o.activeTabIndex;
    return s.jsx("div", { className: "min-h-0 flex-1 flex-col overflow-hidden", style: { display: T ? "flex" : "none" }, children: i({
      node: c,
      path: h,
      containerType: "tabs",
      containerId: o.id
    }) }, u);
  }) }) : i({
    node: t,
    path: n,
    containerType: "tabs",
    containerId: o.id
  });
}, _ = ({ children: e }) => {
  const { node: t } = C();
  return !t.children[t.activeTabIndex] || t.collapsed ? null : s.jsx("div", { className: "flex min-h-0 flex-1 flex-col overflow-hidden", children: e });
}, pe = ({ node: e, path: t, parentDirection: n }) => {
  const o = s.jsxs(s.Fragment, { children: [!e.hideTabStrip && s.jsx(L.TabStrip, { children: s.jsx(L.Tabs, {}) }), s.jsx(_, { children: s.jsx(M, {}) })] });
  return s.jsx(H, { containerType: "tabs", node: e, path: t, parentDirection: n, children: s.jsx("div", { className: "relative flex h-full w-full flex-col", children: s.jsx(J, { defaultComponent: o }) }) });
}, L = {
  Root: pe,
  TabStrip: he,
  TabContentContainer: _,
  TabContent: M,
  SearchDropdown: m.SearchDropdown,
  Tabs: m.Tabs,
  NewButton: m.NewButton
};
export {
  L as TabsLayout
};
