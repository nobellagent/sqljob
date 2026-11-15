import { B as bn, l as vn, X as qr, Y as wn, i as C, $ as Wt, a0 as le, a as zn, u as xn, A as On, Q as Sn, a1 as Rn, j as X, a2 as Dn, a3 as _n, L as En } from "./sqljob-B2DhkBSq.js";
import { R as Pn } from "./sqljob-BuoOBxCZ.js";
const Cn = {
  lg: 768,
  sm: 0
}, ar = { lg: 12, sm: 6 };
function _t(t) {
  return bn(t) ? t : t.id;
}
function jn(t, e) {
  return typeof t == "number" ? t : (t == null ? void 0 : t[e]) ?? ar[e] ?? (t == null ? void 0 : t.lg) ?? ar.lg;
}
function qn(t, e) {
  return Object.fromEntries(typeof t == "number" ? Object.keys(e).map((r) => [r, t]) : Object.keys(e).map((r) => [
    r,
    jn(t, r)
  ]));
}
function Mn(t, e, r) {
  const n = _t(t), o = Math.max(1, r), i = Math.min(3, o), s = 2;
  return {
    i: n,
    x: e * i % o,
    y: Math.floor(e * i / o) * s,
    w: i,
    h: s
  };
}
function Ln(t, e) {
  return Object.fromEntries(Object.entries(e).map(([r, n]) => [
    r,
    t.map((o, i) => Mn(o, i, n))
  ]));
}
var Mr = { exports: {} }, Le = {}, Et = { exports: {} };
(function(t, e) {
  (function(r, n) {
    n(e);
  })(vn, function(r) {
    function n(p) {
      return function(j, E, P, H, N, K, k) {
        return p(j, E, k);
      };
    }
    function o(p) {
      return function(j, E, P, H) {
        if (!j || !E || typeof j != "object" || typeof E != "object")
          return p(j, E, P, H);
        var N = H.get(j), K = H.get(E);
        if (N && K)
          return N === E && K === j;
        H.set(j, E), H.set(E, j);
        var k = p(j, E, P, H);
        return H.delete(j), H.delete(E), k;
      };
    }
    function i(p, y) {
      var j = {};
      for (var E in p)
        j[E] = p[E];
      for (var E in y)
        j[E] = y[E];
      return j;
    }
    function s(p) {
      return p.constructor === Object || p.constructor == null;
    }
    function l(p) {
      return typeof p.then == "function";
    }
    function a(p, y) {
      return p === y || p !== p && y !== y;
    }
    var u = "[object Arguments]", c = "[object Boolean]", f = "[object Date]", d = "[object RegExp]", h = "[object Map]", b = "[object Number]", S = "[object Object]", x = "[object Set]", m = "[object String]", D = Object.prototype.toString;
    function v(p) {
      var y = p.areArraysEqual, j = p.areDatesEqual, E = p.areMapsEqual, P = p.areObjectsEqual, H = p.areRegExpsEqual, N = p.areSetsEqual, K = p.createIsNestedEqual, k = K(te);
      function te(L, T, re) {
        if (L === T)
          return !0;
        if (!L || !T || typeof L != "object" || typeof T != "object")
          return L !== L && T !== T;
        if (s(L) && s(T))
          return P(L, T, k, re);
        var ir = Array.isArray(L), sr = Array.isArray(T);
        if (ir || sr)
          return ir === sr && y(L, T, k, re);
        var ne = D.call(L);
        return ne !== D.call(T) ? !1 : ne === f ? j(L, T, k, re) : ne === d ? H(L, T, k, re) : ne === h ? E(L, T, k, re) : ne === x ? N(L, T, k, re) : ne === S || ne === u ? l(L) || l(T) ? !1 : P(L, T, k, re) : ne === c || ne === b || ne === m ? a(L.valueOf(), T.valueOf()) : !1;
      }
      return te;
    }
    function M(p, y, j, E) {
      var P = p.length;
      if (y.length !== P)
        return !1;
      for (; P-- > 0; )
        if (!j(p[P], y[P], P, P, p, y, E))
          return !1;
      return !0;
    }
    var R = o(M);
    function A(p, y) {
      return a(p.valueOf(), y.valueOf());
    }
    function B(p, y, j, E) {
      var P = p.size === y.size;
      if (!P)
        return !1;
      if (!p.size)
        return !0;
      var H = {}, N = 0;
      return p.forEach(function(K, k) {
        if (P) {
          var te = !1, L = 0;
          y.forEach(function(T, re) {
            !te && !H[L] && (te = j(k, re, N, L, p, y, E) && j(K, T, k, re, p, y, E)) && (H[L] = !0), L++;
          }), N++, P = te;
        }
      }), P;
    }
    var V = o(B), at = "_owner", ue = Object.prototype.hasOwnProperty;
    function Pe(p, y, j, E) {
      var P = Object.keys(p), H = P.length;
      if (Object.keys(y).length !== H)
        return !1;
      for (var N; H-- > 0; ) {
        if (N = P[H], N === at) {
          var K = !!p.$$typeof, k = !!y.$$typeof;
          if ((K || k) && K !== k)
            return !1;
        }
        if (!ue.call(y, N) || !j(p[N], y[N], N, N, p, y, E))
          return !1;
      }
      return !0;
    }
    var lt = o(Pe);
    function Te(p, y) {
      return p.source === y.source && p.flags === y.flags;
    }
    function Ne(p, y, j, E) {
      var P = p.size === y.size;
      if (!P)
        return !1;
      if (!p.size)
        return !0;
      var H = {};
      return p.forEach(function(N, K) {
        if (P) {
          var k = !1, te = 0;
          y.forEach(function(L, T) {
            !k && !H[te] && (k = j(N, L, K, T, p, y, E)) && (H[te] = !0), te++;
          }), P = k;
        }
      }), P;
    }
    var ut = o(Ne), ve = Object.freeze({
      areArraysEqual: M,
      areDatesEqual: A,
      areMapsEqual: B,
      areObjectsEqual: Pe,
      areRegExpsEqual: Te,
      areSetsEqual: Ne,
      createIsNestedEqual: n
    }), we = Object.freeze({
      areArraysEqual: R,
      areDatesEqual: A,
      areMapsEqual: V,
      areObjectsEqual: lt,
      areRegExpsEqual: Te,
      areSetsEqual: ut,
      createIsNestedEqual: n
    }), ct = v(ve);
    function dt(p, y) {
      return ct(p, y, void 0);
    }
    var J = v(i(ve, { createIsNestedEqual: function() {
      return a;
    } }));
    function Y(p, y) {
      return J(p, y, void 0);
    }
    var F = v(we);
    function ee(p, y) {
      return F(p, y, /* @__PURE__ */ new WeakMap());
    }
    var ft = v(i(we, {
      createIsNestedEqual: function() {
        return a;
      }
    }));
    function gn(p, y) {
      return ft(p, y, /* @__PURE__ */ new WeakMap());
    }
    function mn(p) {
      return v(i(ve, p(ve)));
    }
    function yn(p) {
      var y = v(i(we, p(we)));
      return function(j, E, P) {
        return P === void 0 && (P = /* @__PURE__ */ new WeakMap()), y(j, E, P);
      };
    }
    r.circularDeepEqual = ee, r.circularShallowEqual = gn, r.createCustomCircularEqual = yn, r.createCustomEqual = mn, r.deepEqual = dt, r.sameValueZeroEqual = a, r.shallowEqual = Y, Object.defineProperty(r, "__esModule", { value: !0 });
  });
})(Et, Et.exports);
var $t = Et.exports;
const Ue = /* @__PURE__ */ qr(wn);
var O = {}, Hn = function(e, r, n) {
  return e === r ? !0 : e.className === r.className && n(e.style, r.style) && e.width === r.width && e.autoSize === r.autoSize && e.cols === r.cols && e.draggableCancel === r.draggableCancel && e.draggableHandle === r.draggableHandle && n(e.verticalCompact, r.verticalCompact) && n(e.compactType, r.compactType) && n(e.layout, r.layout) && n(e.margin, r.margin) && n(e.containerPadding, r.containerPadding) && e.rowHeight === r.rowHeight && e.maxRows === r.maxRows && e.isBounded === r.isBounded && e.isDraggable === r.isDraggable && e.isResizable === r.isResizable && e.allowOverlap === r.allowOverlap && e.preventCollision === r.preventCollision && e.useCSSTransforms === r.useCSSTransforms && e.transformScale === r.transformScale && e.isDroppable === r.isDroppable && n(e.resizeHandles, r.resizeHandles) && n(e.resizeHandle, r.resizeHandle) && e.onLayoutChange === r.onLayoutChange && e.onDragStart === r.onDragStart && e.onDrag === r.onDrag && e.onDragStop === r.onDragStop && e.onResizeStart === r.onResizeStart && e.onResize === r.onResize && e.onResizeStop === r.onResizeStop && e.onDrop === r.onDrop && n(e.droppingItem, r.droppingItem) && n(e.innerRef, r.innerRef);
};
Object.defineProperty(O, "__esModule", {
  value: !0
});
O.bottom = Ve;
O.childrenEqual = An;
O.cloneLayout = Lr;
O.cloneLayoutItem = me;
O.collides = Ke;
O.compact = kr;
O.compactItem = Tr;
O.compactType = to;
O.correctBounds = Nr;
O.fastPositionEqual = In;
O.fastRGLPropsEqual = void 0;
O.getAllCollisions = Wr;
O.getFirstCollision = he;
O.getLayoutItem = At;
O.getStatics = It;
O.modifyLayout = Hr;
O.moveElement = je;
O.moveElementAwayFromCollision = Ct;
O.noop = void 0;
O.perc = Bn;
O.resizeItemInDirection = Kn;
O.setTopLeft = Zn;
O.setTransform = Jn;
O.sortLayoutItems = Ut;
O.sortLayoutItemsByColRow = Br;
O.sortLayoutItemsByRowCol = Gr;
O.synchronizeLayoutWithChildren = Qn;
O.validateLayout = eo;
O.withLayoutItem = $n;
var lr = $t, Ce = kn(C);
function kn(t) {
  return t && t.__esModule ? t : { default: t };
}
function ur(t, e) {
  var r = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(t);
    e && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(t, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function Be(t) {
  for (var e = 1; e < arguments.length; e++) {
    var r = arguments[e] != null ? arguments[e] : {};
    e % 2 ? ur(Object(r), !0).forEach(function(n) {
      Tn(t, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(r)) : ur(Object(r)).forEach(function(n) {
      Object.defineProperty(t, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return t;
}
function Tn(t, e, r) {
  return (e = Nn(e)) in t ? Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }) : t[e] = r, t;
}
function Nn(t) {
  var e = Wn(t, "string");
  return typeof e == "symbol" ? e : e + "";
}
function Wn(t, e) {
  if (typeof t != "object" || !t) return t;
  var r = t[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(t, e);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
function Ve(t) {
  let e = 0, r;
  for (let n = 0, o = t.length; n < o; n++)
    r = t[n].y + t[n].h, r > e && (e = r);
  return e;
}
function Lr(t) {
  const e = Array(t.length);
  for (let r = 0, n = t.length; r < n; r++)
    e[r] = me(t[r]);
  return e;
}
function Hr(t, e) {
  const r = Array(t.length);
  for (let n = 0, o = t.length; n < o; n++)
    e.i === t[n].i ? r[n] = e : r[n] = t[n];
  return r;
}
function $n(t, e, r) {
  let n = At(t, e);
  return n ? (n = r(me(n)), t = Hr(t, n), [t, n]) : [t, null];
}
function me(t) {
  return {
    w: t.w,
    h: t.h,
    x: t.x,
    y: t.y,
    i: t.i,
    minW: t.minW,
    maxW: t.maxW,
    minH: t.minH,
    maxH: t.maxH,
    moved: !!t.moved,
    static: !!t.static,
    // These can be null/undefined
    isDraggable: t.isDraggable,
    isResizable: t.isResizable,
    resizeHandles: t.resizeHandles,
    isBounded: t.isBounded
  };
}
function An(t, e) {
  return (0, lr.deepEqual)(Ce.default.Children.map(t, (r) => r == null ? void 0 : r.key), Ce.default.Children.map(e, (r) => r == null ? void 0 : r.key)) && (0, lr.deepEqual)(Ce.default.Children.map(t, (r) => r == null ? void 0 : r.props["data-grid"]), Ce.default.Children.map(e, (r) => r == null ? void 0 : r.props["data-grid"]));
}
O.fastRGLPropsEqual = Hn;
function In(t, e) {
  return t.left === e.left && t.top === e.top && t.width === e.width && t.height === e.height;
}
function Ke(t, e) {
  return !(t.i === e.i || t.x + t.w <= e.x || t.x >= e.x + e.w || t.y + t.h <= e.y || t.y >= e.y + e.h);
}
function kr(t, e, r, n) {
  const o = It(t);
  let i = Ve(o);
  const s = Ut(t, e), l = Array(t.length);
  for (let a = 0, u = s.length; a < u; a++) {
    let c = me(s[a]);
    c.static || (c = Tr(o, c, e, r, s, n, i), i = Math.max(i, c.y + c.h), o.push(c)), l[t.indexOf(s[a])] = c, c.moved = !1;
  }
  return l;
}
const Gn = {
  x: "w",
  y: "h"
};
function Pt(t, e, r, n) {
  const o = Gn[n];
  e[n] += 1;
  const i = t.map((s) => s.i).indexOf(e.i);
  for (let s = i + 1; s < t.length; s++) {
    const l = t[s];
    if (!l.static) {
      if (l.y > e.y + e.h) break;
      Ke(e, l) && Pt(t, l, r + e[o], n);
    }
  }
  e[n] = r;
}
function Tr(t, e, r, n, o, i, s) {
  const l = r === "vertical", a = r === "horizontal";
  if (l)
    for (typeof s == "number" ? e.y = Math.min(s, e.y) : e.y = Math.min(Ve(t), e.y); e.y > 0 && !he(t, e); )
      e.y--;
  else if (a)
    for (; e.x > 0 && !he(t, e); )
      e.x--;
  let u;
  for (; (u = he(t, e)) && !(r === null && i); )
    if (a ? Pt(o, e, u.x + u.w, "x") : Pt(o, e, u.y + u.h, "y"), a && e.x + e.w > n)
      for (e.x = n - e.w, e.y++; e.x > 0 && !he(t, e); )
        e.x--;
  return e.y = Math.max(e.y, 0), e.x = Math.max(e.x, 0), e;
}
function Nr(t, e) {
  const r = It(t);
  for (let n = 0, o = t.length; n < o; n++) {
    const i = t[n];
    if (i.x + i.w > e.cols && (i.x = e.cols - i.w), i.x < 0 && (i.x = 0, i.w = e.cols), !i.static) r.push(i);
    else
      for (; he(r, i); )
        i.y++;
  }
  return t;
}
function At(t, e) {
  for (let r = 0, n = t.length; r < n; r++)
    if (t[r].i === e) return t[r];
}
function he(t, e) {
  for (let r = 0, n = t.length; r < n; r++)
    if (Ke(t[r], e)) return t[r];
}
function Wr(t, e) {
  return t.filter((r) => Ke(r, e));
}
function It(t) {
  return t.filter((e) => e.static);
}
function je(t, e, r, n, o, i, s, l, a) {
  if (e.static && e.isDraggable !== !0 || e.y === n && e.x === r) return t;
  "Moving element ".concat(e.i, " to [").concat(String(r), ",").concat(String(n), "] from [").concat(e.x, ",").concat(e.y, "]");
  const u = e.x, c = e.y;
  typeof r == "number" && (e.x = r), typeof n == "number" && (e.y = n), e.moved = !0;
  let f = Ut(t, s);
  (s === "vertical" && typeof n == "number" ? c >= n : s === "horizontal" && typeof r == "number" ? u >= r : !1) && (f = f.reverse());
  const h = Wr(f, e), b = h.length > 0;
  if (b && a)
    return Lr(t);
  if (b && i)
    return "Collision prevented on ".concat(e.i, ", reverting."), e.x = u, e.y = c, e.moved = !1, t;
  for (let S = 0, x = h.length; S < x; S++) {
    const m = h[S];
    "Resolving collision between ".concat(e.i, " at [").concat(e.x, ",").concat(e.y, "] and ").concat(m.i, " at [").concat(m.x, ",").concat(m.y, "]"), !m.moved && (m.static ? t = Ct(t, m, e, o, s) : t = Ct(t, e, m, o, s));
  }
  return t;
}
function Ct(t, e, r, n, o, i) {
  const s = o === "horizontal", l = o === "vertical", a = e.static;
  if (n) {
    n = !1;
    const f = {
      x: s ? Math.max(e.x - r.w, 0) : r.x,
      y: l ? Math.max(e.y - r.h, 0) : r.y,
      w: r.w,
      h: r.h,
      i: "-1"
    }, d = he(t, f), h = d && d.y + d.h > e.y, b = d && e.x + e.w > d.x;
    if (d) {
      if (h && l)
        return je(t, r, void 0, r.y + 1, n, a, o);
      if (h && o == null)
        return e.y = r.y, r.y = r.y + r.h, t;
      if (b && s)
        return je(t, e, r.x, void 0, n, a, o);
    } else return "Doing reverse collision on ".concat(r.i, " up to [").concat(f.x, ",").concat(f.y, "]."), je(t, r, s ? f.x : void 0, l ? f.y : void 0, n, a, o);
  }
  const u = s ? r.x + 1 : void 0, c = l ? r.y + 1 : void 0;
  return u == null && c == null ? t : je(t, r, s ? r.x + 1 : void 0, l ? r.y + 1 : void 0, n, a, o);
}
function Bn(t) {
  return t * 100 + "%";
}
const $r = (t, e, r, n) => t + r > n ? e : r, Ar = (t, e, r) => t < 0 ? e : r, Ir = (t) => Math.max(0, t), Gt = (t) => Math.max(0, t), Bt = (t, e, r) => {
  let {
    left: n,
    height: o,
    width: i
  } = e;
  const s = t.top - (o - t.height);
  return {
    left: n,
    width: i,
    height: Ar(s, t.height, o),
    top: Gt(s)
  };
}, Yt = (t, e, r) => {
  let {
    top: n,
    left: o,
    height: i,
    width: s
  } = e;
  return {
    top: n,
    height: i,
    width: $r(t.left, t.width, s, r),
    left: Ir(o)
  };
}, Xt = (t, e, r) => {
  let {
    top: n,
    height: o,
    width: i
  } = e;
  const s = t.left - (i - t.width);
  return {
    height: o,
    width: s < 0 ? t.width : $r(t.left, t.width, i, r),
    top: Gt(n),
    left: Ir(s)
  };
}, Ft = (t, e, r) => {
  let {
    top: n,
    left: o,
    height: i,
    width: s
  } = e;
  return {
    width: s,
    left: o,
    height: Ar(n, t.height, i),
    top: Gt(n)
  };
}, Yn = function() {
  return Bt(arguments.length <= 0 ? void 0 : arguments[0], Yt(...arguments));
}, Xn = function() {
  return Bt(arguments.length <= 0 ? void 0 : arguments[0], Xt(...arguments));
}, Fn = function() {
  return Ft(arguments.length <= 0 ? void 0 : arguments[0], Yt(...arguments));
}, Un = function() {
  return Ft(arguments.length <= 0 ? void 0 : arguments[0], Xt(...arguments));
}, Vn = {
  n: Bt,
  ne: Yn,
  e: Yt,
  se: Fn,
  s: Ft,
  sw: Un,
  w: Xt,
  nw: Xn
};
function Kn(t, e, r, n) {
  const o = Vn[t];
  return o ? o(e, Be(Be({}, e), r), n) : r;
}
function Jn(t) {
  let {
    top: e,
    left: r,
    width: n,
    height: o
  } = t;
  const i = "translate(".concat(r, "px,").concat(e, "px)");
  return {
    transform: i,
    WebkitTransform: i,
    MozTransform: i,
    msTransform: i,
    OTransform: i,
    width: "".concat(n, "px"),
    height: "".concat(o, "px"),
    position: "absolute"
  };
}
function Zn(t) {
  let {
    top: e,
    left: r,
    width: n,
    height: o
  } = t;
  return {
    top: "".concat(e, "px"),
    left: "".concat(r, "px"),
    width: "".concat(n, "px"),
    height: "".concat(o, "px"),
    position: "absolute"
  };
}
function Ut(t, e) {
  return e === "horizontal" ? Br(t) : e === "vertical" ? Gr(t) : t;
}
function Gr(t) {
  return t.slice(0).sort(function(e, r) {
    return e.y > r.y || e.y === r.y && e.x > r.x ? 1 : e.y === r.y && e.x === r.x ? 0 : -1;
  });
}
function Br(t) {
  return t.slice(0).sort(function(e, r) {
    return e.x > r.x || e.x === r.x && e.y > r.y ? 1 : -1;
  });
}
function Qn(t, e, r, n, o) {
  t = t || [];
  const i = [];
  Ce.default.Children.forEach(e, (l) => {
    if ((l == null ? void 0 : l.key) == null) return;
    const a = At(t, String(l.key)), u = l.props["data-grid"];
    a && u == null ? i.push(me(a)) : u ? i.push(me(Be(Be({}, u), {}, {
      i: l.key
    }))) : i.push(me({
      w: 1,
      h: 1,
      x: 0,
      y: Ve(i),
      i: String(l.key)
    }));
  });
  const s = Nr(i, {
    cols: r
  });
  return o ? s : kr(s, n, r);
}
function eo(t) {
  let e = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "Layout";
  const r = ["x", "y", "w", "h"];
  if (!Array.isArray(t)) throw new Error(e + " must be an array!");
  for (let n = 0, o = t.length; n < o; n++) {
    const i = t[n];
    for (let s = 0; s < r.length; s++) {
      const l = r[s], a = i[l];
      if (typeof a != "number" || Number.isNaN(a))
        throw new Error("ReactGridLayout: ".concat(e, "[").concat(n, "].").concat(l, " must be a number! Received: ").concat(a, " (").concat(typeof a, ")"));
    }
    if (typeof i.i < "u" && typeof i.i != "string")
      throw new Error("ReactGridLayout: ".concat(e, "[").concat(n, "].i must be a string! Received: ").concat(i.i, " (").concat(typeof i.i, ")"));
  }
}
function to(t) {
  const {
    verticalCompact: e,
    compactType: r
  } = t || {};
  return e === !1 ? null : r;
}
const ro = () => {
};
O.noop = ro;
var ie = {};
Object.defineProperty(ie, "__esModule", {
  value: !0
});
ie.calcGridColWidth = Je;
ie.calcGridItemPosition = no;
ie.calcGridItemWHPx = jt;
ie.calcWH = io;
ie.calcXY = oo;
ie.clamp = ge;
function Je(t) {
  const {
    margin: e,
    containerPadding: r,
    containerWidth: n,
    cols: o
  } = t;
  return (n - e[0] * (o - 1) - r[0] * 2) / o;
}
function jt(t, e, r) {
  return Number.isFinite(t) ? Math.round(e * t + Math.max(0, t - 1) * r) : t;
}
function no(t, e, r, n, o, i) {
  const {
    margin: s,
    containerPadding: l,
    rowHeight: a
  } = t, u = Je(t), c = {};
  return i && i.resizing ? (c.width = Math.round(i.resizing.width), c.height = Math.round(i.resizing.height)) : (c.width = jt(n, u, s[0]), c.height = jt(o, a, s[1])), i && i.dragging ? (c.top = Math.round(i.dragging.top), c.left = Math.round(i.dragging.left)) : i && i.resizing && typeof i.resizing.top == "number" && typeof i.resizing.left == "number" ? (c.top = Math.round(i.resizing.top), c.left = Math.round(i.resizing.left)) : (c.top = Math.round((a + s[1]) * r + l[1]), c.left = Math.round((u + s[0]) * e + l[0])), c;
}
function oo(t, e, r, n, o) {
  const {
    margin: i,
    containerPadding: s,
    cols: l,
    rowHeight: a,
    maxRows: u
  } = t, c = Je(t);
  let f = Math.round((r - s[0]) / (c + i[0])), d = Math.round((e - s[1]) / (a + i[1]));
  return f = ge(f, 0, l - n), d = ge(d, 0, u - o), {
    x: f,
    y: d
  };
}
function io(t, e, r, n, o, i) {
  const {
    margin: s,
    maxRows: l,
    cols: a,
    rowHeight: u
  } = t, c = Je(t);
  let f = Math.round((e + s[0]) / (c + s[0])), d = Math.round((r + s[1]) / (u + s[1])), h = ge(f, 0, a - n), b = ge(d, 0, l - o);
  return ["sw", "w", "nw"].indexOf(i) !== -1 && (h = ge(f, 0, a)), ["nw", "n", "ne"].indexOf(i) !== -1 && (b = ge(d, 0, l)), {
    w: h,
    h: b
  };
}
function ge(t, e, r) {
  return Math.max(Math.min(t, r), e);
}
var Ze = {}, Qe = { exports: {} }, so = {}, ao = Object.create, et = Object.defineProperty, lo = Object.getOwnPropertyDescriptor, uo = Object.getOwnPropertyNames, co = Object.getPrototypeOf, fo = Object.prototype.hasOwnProperty, po = (t, e) => {
  for (var r in e)
    et(t, r, { get: e[r], enumerable: !0 });
}, Yr = (t, e, r, n) => {
  if (e && typeof e == "object" || typeof e == "function")
    for (let o of uo(e))
      !fo.call(t, o) && o !== r && et(t, o, { get: () => e[o], enumerable: !(n = lo(e, o)) || n.enumerable });
  return t;
}, Ee = (t, e, r) => (r = t != null ? ao(co(t)) : {}, Yr(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  !t || !t.__esModule ? et(r, "default", { value: t, enumerable: !0 }) : r,
  t
)), ho = (t) => Yr(et({}, "__esModule", { value: !0 }), t), Xr = {};
po(Xr, {
  DraggableCore: () => ye,
  default: () => tt
});
var go = ho(Xr), We = Ee(C), q = Ee(le), mo = Ee(Wt), yo = Ue;
function qt(t, e) {
  for (let r = 0, n = t.length; r < n; r++)
    if (e.apply(e, [t[r], r, t])) return t[r];
}
function cr(t) {
  return typeof t == "function" || Object.prototype.toString.call(t) === "[object Function]";
}
function qe(t) {
  return typeof t == "number" && !isNaN(t);
}
function G(t) {
  return parseInt(t, 10);
}
function Re(t, e, r) {
  if (t[e])
    return new Error(`Invalid prop ${e} passed to ${r} - do not set this, set it on the child.`);
}
var pt = ["Moz", "Webkit", "O", "ms"];
function bo(t = "transform") {
  var e, r;
  if (typeof window > "u") return "";
  const n = (r = (e = window.document) == null ? void 0 : e.documentElement) == null ? void 0 : r.style;
  if (!n || t in n) return "";
  for (let o = 0; o < pt.length; o++)
    if (Fr(t, pt[o]) in n) return pt[o];
  return "";
}
function Fr(t, e) {
  return e ? `${e}${vo(t)}` : t;
}
function vo(t) {
  let e = "", r = !0;
  for (let n = 0; n < t.length; n++)
    r ? (e += t[n].toUpperCase(), r = !1) : t[n] === "-" ? r = !0 : e += t[n];
  return e;
}
var wo = bo(), ht = "";
function zo(t, e) {
  var r;
  ht || (ht = (r = qt([
    "matches",
    "webkitMatchesSelector",
    "mozMatchesSelector",
    "msMatchesSelector",
    "oMatchesSelector"
  ], function(o) {
    return cr(t[o]);
  })) != null ? r : "");
  const n = t[ht];
  return cr(n) ? !!n.call(t, e) : !1;
}
function dr(t, e, r) {
  let n = t;
  do {
    if (zo(n, e)) return !0;
    if (n === r) return !1;
    n = n.parentNode;
  } while (n);
  return !1;
}
function gt(t, e, r, n) {
  if (!t) return;
  const o = { capture: !0, ...n }, i = r;
  t.addEventListener ? t.addEventListener(e, i, o) : t.attachEvent ? t.attachEvent("on" + e, i) : t["on" + e] = i;
}
function ce(t, e, r, n) {
  if (!t) return;
  const o = { capture: !0, ...n }, i = r;
  t.removeEventListener ? t.removeEventListener(e, i, o) : t.detachEvent ? t.detachEvent("on" + e, i) : t["on" + e] = null;
}
function xo(t) {
  let e = t.clientHeight;
  const r = t.ownerDocument.defaultView.getComputedStyle(t);
  return e += G(r.borderTopWidth), e += G(r.borderBottomWidth), e;
}
function Oo(t) {
  let e = t.clientWidth;
  const r = t.ownerDocument.defaultView.getComputedStyle(t);
  return e += G(r.borderLeftWidth), e += G(r.borderRightWidth), e;
}
function So(t) {
  let e = t.clientHeight;
  const r = t.ownerDocument.defaultView.getComputedStyle(t);
  return e -= G(r.paddingTop), e -= G(r.paddingBottom), e;
}
function Ro(t) {
  let e = t.clientWidth;
  const r = t.ownerDocument.defaultView.getComputedStyle(t);
  return e -= G(r.paddingLeft), e -= G(r.paddingRight), e;
}
function Do(t, e, r) {
  const o = e === e.ownerDocument.body ? { left: 0, top: 0 } : e.getBoundingClientRect(), i = (t.clientX + e.scrollLeft - o.left) / r, s = (t.clientY + e.scrollTop - o.top) / r;
  return { x: i, y: s };
}
function _o(t, e) {
  const r = Ur(t, e, "px");
  return { [Fr("transform", wo)]: r };
}
function Eo(t, e) {
  return Ur(t, e, "");
}
function Ur({ x: t, y: e }, r, n) {
  let o = `translate(${t}${n},${e}${n})`;
  if (r) {
    const i = `${typeof r.x == "string" ? r.x : r.x + n}`, s = `${typeof r.y == "string" ? r.y : r.y + n}`;
    o = `translate(${i}, ${s})` + o;
  }
  return o;
}
function Po(t, e) {
  return t.targetTouches && qt(t.targetTouches, (r) => e === r.identifier) || t.changedTouches && qt(t.changedTouches, (r) => e === r.identifier);
}
function Co(t) {
  if (t.targetTouches && t.targetTouches[0]) return t.targetTouches[0].identifier;
  if (t.changedTouches && t.changedTouches[0]) return t.changedTouches[0].identifier;
}
function jo() {
  return typeof __webpack_nonce__ < "u" ? __webpack_nonce__ : void 0;
}
function qo(t, e) {
  if (!t) return;
  let r = t.getElementById("react-draggable-style-el");
  if (!r) {
    r = t.createElement("style"), r.type = "text/css", r.id = "react-draggable-style-el";
    const n = e ?? jo();
    n && r.setAttribute("nonce", n), r.innerHTML = `.react-draggable-transparent-selection *::-moz-selection {all: inherit;}
`, r.innerHTML += `.react-draggable-transparent-selection *::selection {all: inherit;}
`, t.getElementsByTagName("head")[0].appendChild(r);
  }
  t.body && Mo(t.body, "react-draggable-transparent-selection");
}
function fr(t) {
  window.requestAnimationFrame ? window.requestAnimationFrame(() => {
    pr(t);
  }) : pr(t);
}
function pr(t) {
  if (t)
    try {
      t.body && Lo(t.body, "react-draggable-transparent-selection");
      const e = t.selection;
      if (e)
        e.empty();
      else {
        const r = (t.defaultView || window).getSelection();
        r && r.type !== "Caret" && r.removeAllRanges();
      }
    } catch {
    }
}
function Mo(t, e) {
  t.classList ? t.classList.add(e) : t.className.match(new RegExp(`(?:^|\\s)${e}(?!\\S)`)) || (t.className += ` ${e}`);
}
function Lo(t, e) {
  t.classList ? t.classList.remove(e) : t.className = t.className.replace(new RegExp(`(?:^|\\s)${e}(?!\\S)`, "g"), "");
}
function Ho(t, e, r) {
  if (!t.props.bounds) return [e, r];
  let { bounds: n } = t.props;
  n = typeof n == "string" ? n : No(n);
  const o = Vt(t);
  if (typeof n == "string") {
    const { ownerDocument: i } = o, s = i.defaultView;
    if (!s)
      throw new Error("Cannot resolve the owner window of the draggable node.");
    let l;
    if (n === "parent" ? l = o.parentNode : l = o.getRootNode().querySelector(n), !(l instanceof s.HTMLElement))
      throw new Error('Bounds selector "' + n + '" could not find an element.');
    const a = l, u = s.getComputedStyle(o), c = s.getComputedStyle(a);
    n = {
      left: -o.offsetLeft + G(c.paddingLeft) + G(u.marginLeft),
      top: -o.offsetTop + G(c.paddingTop) + G(u.marginTop),
      right: Ro(a) - Oo(o) - o.offsetLeft + G(c.paddingRight) - G(u.marginRight),
      bottom: So(a) - xo(o) - o.offsetTop + G(c.paddingBottom) - G(u.marginBottom)
    };
  }
  return qe(n.right) && (e = Math.min(e, n.right)), qe(n.bottom) && (r = Math.min(r, n.bottom)), qe(n.left) && (e = Math.max(e, n.left)), qe(n.top) && (r = Math.max(r, n.top)), [e, r];
}
function hr(t, e, r) {
  const n = Math.round(e / t[0]) * t[0], o = Math.round(r / t[1]) * t[1];
  return [n, o];
}
function ko(t) {
  return t.props.axis === "both" || t.props.axis === "x";
}
function To(t) {
  return t.props.axis === "both" || t.props.axis === "y";
}
function mt(t, e, r) {
  const n = typeof e == "number" ? Po(t, e) : null;
  if (typeof e == "number" && !n) return null;
  const o = Vt(r), i = r.props.offsetParent || o.offsetParent || o.ownerDocument.body;
  return Do(n || t, i, r.props.scale);
}
function yt(t, e, r) {
  const n = !qe(t.lastX), o = Vt(t);
  return n ? {
    node: o,
    deltaX: 0,
    deltaY: 0,
    lastX: e,
    lastY: r,
    x: e,
    y: r
  } : {
    node: o,
    deltaX: e - t.lastX,
    deltaY: r - t.lastY,
    lastX: t.lastX,
    lastY: t.lastY,
    x: e,
    y: r
  };
}
function bt(t, e) {
  const r = t.props.scale;
  return {
    node: e.node,
    x: t.state.x + e.deltaX / r,
    y: t.state.y + e.deltaY / r,
    deltaX: e.deltaX / r,
    deltaY: e.deltaY / r,
    lastX: t.state.x,
    lastY: t.state.y
  };
}
function No(t) {
  return {
    left: t.left,
    top: t.top,
    right: t.right,
    bottom: t.bottom
  };
}
function Vt(t) {
  const e = t.findDOMNode();
  if (!e)
    throw new Error("<DraggableCore>: Unmounted during event!");
  return e;
}
var vt = Ee(C), I = Ee(le), Wo = Ee(Wt), $o = typeof process < "u" && so.DRAGGABLE_DEBUG ? console.log.bind(console) : function() {
}, oe = $o, Z = {
  touch: {
    start: "touchstart",
    move: "touchmove",
    stop: "touchend"
  },
  mouse: {
    start: "mousedown",
    move: "mousemove",
    stop: "mouseup"
  }
}, ae = Z.mouse, ye = class extends vt.Component {
  constructor() {
    super(...arguments), this.dragging = !1, this.lastX = NaN, this.lastY = NaN, this.touchIdentifier = null, this.mounted = !1, this.handleDragStart = (e) => {
      if (this.props.onMouseDown(e), !this.props.allowAnyClick && (typeof e.button == "number" && e.button !== 0 || e.ctrlKey)) return !1;
      const r = this.findDOMNode();
      if (!r || !r.ownerDocument || !r.ownerDocument.body)
        throw new Error("<DraggableCore> not mounted on DragStart!");
      const { ownerDocument: n } = r;
      if (this.props.disabled || !(e.target instanceof n.defaultView.Node) || this.props.handle && !dr(e.target, this.props.handle, r) || this.props.cancel && dr(e.target, this.props.cancel, r))
        return;
      e.type === "touchstart" && !this.props.allowMobileScroll && e.preventDefault();
      const o = Co(e);
      this.touchIdentifier = o;
      const i = mt(e, o, this);
      if (i == null) return;
      const { x: s, y: l } = i, a = yt(this, s, l);
      oe("DraggableCore: handleDragStart: %j", a), oe("calling", this.props.onStart), !(this.props.onStart(e, a) === !1 || this.mounted === !1) && (this.props.enableUserSelectHack && qo(n, this.props.nonce), this.dragging = !0, this.lastX = s, this.lastY = l, gt(n, ae.move, this.handleDrag), gt(n, ae.stop, this.handleDragStop));
    }, this.handleDrag = (e) => {
      const r = mt(e, this.touchIdentifier, this);
      if (r == null) return;
      let { x: n, y: o } = r;
      if (Array.isArray(this.props.grid)) {
        let l = n - this.lastX, a = o - this.lastY;
        if ([l, a] = hr(this.props.grid, l, a), !l && !a) return;
        n = this.lastX + l, o = this.lastY + a;
      }
      const i = yt(this, n, o);
      if (oe("DraggableCore: handleDrag: %j", i), this.props.onDrag(e, i) === !1 || this.mounted === !1) {
        try {
          this.handleDragStop(new MouseEvent("mouseup"));
        } catch {
          const l = document.createEvent("MouseEvents");
          l.initMouseEvent("mouseup", !0, !0, window, 0, 0, 0, 0, 0, !1, !1, !1, !1, 0, null), this.handleDragStop(l);
        }
        return;
      }
      this.lastX = n, this.lastY = o;
    }, this.handleDragStop = (e) => {
      if (!this.dragging) return;
      const r = mt(e, this.touchIdentifier, this);
      if (r == null) return;
      let { x: n, y: o } = r;
      if (Array.isArray(this.props.grid)) {
        let a = n - this.lastX || 0, u = o - this.lastY || 0;
        [a, u] = hr(this.props.grid, a, u), n = this.lastX + a, o = this.lastY + u;
      }
      const i = yt(this, n, o);
      if (this.props.onStop(e, i) === !1 || this.mounted === !1) return !1;
      const l = this.findDOMNode();
      l && this.props.enableUserSelectHack && fr(l.ownerDocument), oe("DraggableCore: handleDragStop: %j", i), this.dragging = !1, this.lastX = NaN, this.lastY = NaN, l && (oe("DraggableCore: Removing handlers"), ce(l.ownerDocument, ae.move, this.handleDrag), ce(l.ownerDocument, ae.stop, this.handleDragStop));
    }, this.onMouseDown = (e) => (ae = Z.mouse, this.handleDragStart(e)), this.onMouseUp = (e) => (ae = Z.mouse, this.handleDragStop(e)), this.onTouchStart = (e) => (ae = Z.touch, this.handleDragStart(e)), this.onTouchEnd = (e) => (ae = Z.touch, this.handleDragStop(e));
  }
  componentDidMount() {
    this.mounted = !0;
    const e = this.findDOMNode();
    e && gt(e, Z.touch.start, this.onTouchStart, { passive: !1 });
  }
  componentWillUnmount() {
    this.mounted = !1;
    const e = this.findDOMNode();
    if (e) {
      const { ownerDocument: r } = e;
      ce(r, Z.mouse.move, this.handleDrag), ce(r, Z.touch.move, this.handleDrag), ce(r, Z.mouse.stop, this.handleDragStop), ce(r, Z.touch.stop, this.handleDragStop), ce(e, Z.touch.start, this.onTouchStart, { passive: !1 }), this.props.enableUserSelectHack && fr(r);
    }
  }
  // React 19 removed ReactDOM.findDOMNode, so nodeRef is now required.
  // For backward compatibility with React 18 and earlier, we still support findDOMNode if available.
  findDOMNode() {
    var e;
    if ((e = this.props) != null && e.nodeRef)
      return this.props.nodeRef.current;
    const r = Wo.default;
    return typeof r.findDOMNode == "function" ? r.findDOMNode(this) : (oe(
      "react-draggable: ReactDOM.findDOMNode is not available in React 19+. You must provide a nodeRef prop. See: https://github.com/react-grid-layout/react-draggable#noderef"
    ), null);
  }
  render() {
    return vt.cloneElement(vt.Children.only(this.props.children), {
      // Note: mouseMove handler is attached to document so it will still function
      // when the user drags quickly and leaves the bounds of the element.
      onMouseDown: this.onMouseDown,
      onMouseUp: this.onMouseUp,
      // onTouchStart is added on `componentDidMount` so they can be added with
      // {passive: false}, which allows it to cancel. See
      // https://developers.google.com/web/updates/2017/01/scrolling-intervention
      onTouchEnd: this.onTouchEnd
    });
  }
};
ye.displayName = "DraggableCore";
ye.propTypes = {
  /**
   * `allowAnyClick` allows dragging using any mouse button.
   * By default, we only accept the left button.
   *
   * Defaults to `false`.
   */
  allowAnyClick: I.default.bool,
  /**
   * `allowMobileScroll` turns off cancellation of the 'touchstart' event
   * on mobile devices. Only enable this if you are having trouble with click
   * events. Prefer using 'handle' / 'cancel' instead.
   *
   * Defaults to `false`.
   */
  allowMobileScroll: I.default.bool,
  children: I.default.node.isRequired,
  /**
   * `disabled`, if true, stops the <Draggable> from dragging. All handlers,
   * with the exception of `onMouseDown`, will not fire.
   */
  disabled: I.default.bool,
  /**
   * By default, we add 'user-select:none' attributes to the document body
   * to prevent ugly text selection during drag. If this is causing problems
   * for your app, set this to `false`.
   */
  enableUserSelectHack: I.default.bool,
  /**
   * `offsetParent`, if set, uses the passed DOM node to compute drag offsets
   * instead of using the parent node.
   */
  offsetParent: function(t, e) {
    if (t[e] && t[e].nodeType !== 1)
      throw new Error("Draggable's offsetParent must be a DOM Node.");
  },
  /**
   * `grid` specifies the x and y that dragging should snap to.
   */
  grid: I.default.arrayOf(I.default.number),
  /**
   * `handle` specifies a selector to be used as the handle that initiates drag.
   *
   * Example:
   *
   * ```jsx
   *   let App = React.createClass({
   *       render: function () {
   *         return (
   *            <Draggable handle=".handle">
   *              <div>
   *                  <div className="handle">Click me to drag</div>
   *                  <div>This is some other content</div>
   *              </div>
   *           </Draggable>
   *         );
   *       }
   *   });
   * ```
   */
  handle: I.default.string,
  /**
   * `cancel` specifies a selector to be used to prevent drag initialization.
   *
   * Example:
   *
   * ```jsx
   *   let App = React.createClass({
   *       render: function () {
   *           return(
   *               <Draggable cancel=".cancel">
   *                   <div>
   *                     <div className="cancel">You can't drag from here</div>
   *                     <div>Dragging here works fine</div>
   *                   </div>
   *               </Draggable>
   *           );
   *       }
   *   });
   * ```
   */
  cancel: I.default.string,
  /* If running in React Strict mode, ReactDOM.findDOMNode() is deprecated.
   * Unfortunately, in order for <Draggable> to work properly, we need raw access
   * to the underlying DOM node. If you want to avoid the warning, pass a `nodeRef`
   * as in this example:
   *
   * function MyComponent() {
   *   const nodeRef = React.useRef(null);
   *   return (
   *     <Draggable nodeRef={nodeRef}>
   *       <div ref={nodeRef}>Example Target</div>
   *     </Draggable>
   *   );
   * }
   *
   * This can be used for arbitrarily nested components, so long as the ref ends up
   * pointing to the actual child DOM node and not a custom component.
   */
  nodeRef: I.default.object,
  /**
   * `nonce` is applied to the dynamically-injected <style> element used by the
   * user-select hack, so it isn't blocked under a strict Content Security
   * Policy (`style-src` without `'unsafe-inline'`). If omitted, webpack's
   * `__webpack_nonce__` global is used when available.
   */
  nonce: I.default.string,
  /**
   * Called when dragging starts.
   * If this function returns the boolean false, dragging will be canceled.
   */
  onStart: I.default.func,
  /**
   * Called while dragging.
   * If this function returns the boolean false, dragging will be canceled.
   */
  onDrag: I.default.func,
  /**
   * Called when dragging stops.
   * If this function returns the boolean false, the drag will remain active.
   */
  onStop: I.default.func,
  /**
   * A workaround option which can be passed if onMouseDown needs to be accessed,
   * since it'll always be blocked (as there is internal use of onMouseDown)
   */
  onMouseDown: I.default.func,
  /**
   * `scale`, if set, applies scaling while dragging an element
   */
  scale: I.default.number,
  /**
   * These properties should be defined on the child, not here.
   */
  className: Re,
  style: Re,
  transform: Re
};
ye.defaultProps = {
  allowAnyClick: !1,
  // by default only accept left click
  allowMobileScroll: !1,
  disabled: !1,
  enableUserSelectHack: !0,
  onStart: function() {
  },
  onDrag: function() {
  },
  onStop: function() {
  },
  onMouseDown: function() {
  },
  scale: 1
};
var tt = class extends We.Component {
  constructor(e) {
    super(e), this.onDragStart = (r, n) => {
      if (oe("Draggable: onDragStart: %j", n), this.props.onStart(r, bt(this, n)) === !1) return !1;
      this.setState({ dragging: !0, dragged: !0 });
    }, this.onDrag = (r, n) => {
      if (!this.state.dragging) return !1;
      oe("Draggable: onDrag: %j", n);
      const o = bt(this, n), i = {
        x: o.x,
        y: o.y,
        slackX: 0,
        slackY: 0
      };
      if (this.props.bounds) {
        const { x: l, y: a } = i;
        i.x += this.state.slackX, i.y += this.state.slackY;
        const [u, c] = Ho(this, i.x, i.y);
        i.x = u, i.y = c, i.slackX = this.state.slackX + (l - i.x), i.slackY = this.state.slackY + (a - i.y), o.x = i.x, o.y = i.y, o.deltaX = i.x - this.state.x, o.deltaY = i.y - this.state.y;
      }
      if (this.props.onDrag(r, o) === !1) return !1;
      this.setState(i);
    }, this.onDragStop = (r, n) => {
      if (!this.state.dragging || this.props.onStop(r, bt(this, n)) === !1) return !1;
      oe("Draggable: onDragStop: %j", n);
      const i = {
        dragging: !1,
        slackX: 0,
        slackY: 0
      };
      if (!!this.props.position) {
        const { x: l, y: a } = this.props.position;
        i.x = l, i.y = a;
      }
      this.setState(i);
    }, this.state = {
      // Whether or not we are currently dragging.
      dragging: !1,
      // Whether or not we have been dragged before.
      dragged: !1,
      // Current transform x and y.
      x: e.position ? e.position.x : e.defaultPosition.x,
      y: e.position ? e.position.y : e.defaultPosition.y,
      prevPropsPosition: { ...e.position },
      // Used for compensating for out-of-bounds drags
      slackX: 0,
      slackY: 0,
      // Can only determine if SVG after mounting
      isElementSVG: !1
    }, e.position && !(e.onDrag || e.onStop) && console.warn("A `position` was applied to this <Draggable>, without drag handlers. This will make this component effectively undraggable. Please attach `onDrag` or `onStop` handlers so you can adjust the `position` of this element.");
  }
  // React 16.3+
  // Arity (props, state)
  static getDerivedStateFromProps({ position: e }, { prevPropsPosition: r }) {
    return e && (!r || e.x !== r.x || e.y !== r.y) ? (oe("Draggable: getDerivedStateFromProps %j", { position: e, prevPropsPosition: r }), {
      x: e.x,
      y: e.y,
      prevPropsPosition: { ...e }
    }) : null;
  }
  componentDidMount() {
    typeof window.SVGElement < "u" && this.findDOMNode() instanceof window.SVGElement && this.setState({ isElementSVG: !0 });
  }
  componentWillUnmount() {
    this.state.dragging && this.setState({ dragging: !1 });
  }
  // React 19 removed ReactDOM.findDOMNode, so nodeRef is now required.
  // For backward compatibility with React 18 and earlier, we still support findDOMNode if available.
  findDOMNode() {
    var e;
    if ((e = this.props) != null && e.nodeRef)
      return this.props.nodeRef.current;
    const r = mo.default;
    return typeof r.findDOMNode == "function" ? r.findDOMNode(this) : null;
  }
  render() {
    const {
      axis: e,
      bounds: r,
      children: n,
      defaultPosition: o,
      defaultClassName: i,
      defaultClassNameDragging: s,
      defaultClassNameDragged: l,
      position: a,
      positionOffset: u,
      scale: c,
      ...f
    } = this.props;
    let d = {}, h = null;
    const S = !!!a || this.state.dragging, x = a || o, m = {
      // Set left if horizontal drag is enabled
      x: ko(this) && S ? this.state.x : x.x,
      // Set top if vertical drag is enabled
      y: To(this) && S ? this.state.y : x.y
    };
    this.state.isElementSVG ? h = Eo(m, u) : d = _o(m, u);
    const D = We.Children.only(n), v = (0, yo.clsx)(D.props.className || "", i, {
      [s]: this.state.dragging,
      [l]: this.state.dragged
    });
    return /* @__PURE__ */ We.createElement(ye, { ...f, onStart: this.onDragStart, onDrag: this.onDrag, onStop: this.onDragStop }, We.cloneElement(D, {
      className: v,
      style: { ...D.props.style, ...d },
      transform: h
    }));
  }
};
tt.displayName = "Draggable";
tt.propTypes = {
  // Accepts all props <DraggableCore> accepts.
  ...ye.propTypes,
  /**
   * `axis` determines which axis the draggable can move.
   *
   *  Note that all callbacks will still return data as normal. This only
   *  controls flushing to the DOM.
   *
   * 'both' allows movement horizontally and vertically.
   * 'x' limits movement to horizontal axis.
   * 'y' limits movement to vertical axis.
   * 'none' limits all movement.
   *
   * Defaults to 'both'.
   */
  axis: q.default.oneOf(["both", "x", "y", "none"]),
  /**
   * `bounds` determines the range of movement available to the element.
   * Available values are:
   *
   * 'parent' restricts movement within the Draggable's parent node.
   *
   * Alternatively, pass an object with the following properties, all of which are optional:
   *
   * {left: LEFT_BOUND, right: RIGHT_BOUND, bottom: BOTTOM_BOUND, top: TOP_BOUND}
   *
   * All values are in px.
   *
   * Example:
   *
   * ```jsx
   *   let App = React.createClass({
   *       render: function () {
   *         return (
   *            <Draggable bounds={{right: 300, bottom: 300}}>
   *              <div>Content</div>
   *           </Draggable>
   *         );
   *       }
   *   });
   * ```
   */
  bounds: q.default.oneOfType([
    q.default.shape({
      left: q.default.number,
      right: q.default.number,
      top: q.default.number,
      bottom: q.default.number
    }),
    q.default.string,
    q.default.oneOf([!1])
  ]),
  defaultClassName: q.default.string,
  defaultClassNameDragging: q.default.string,
  defaultClassNameDragged: q.default.string,
  /**
   * `defaultPosition` specifies the x and y that the dragged item should start at
   *
   * Example:
   *
   * ```jsx
   *      let App = React.createClass({
   *          render: function () {
   *              return (
   *                  <Draggable defaultPosition={{x: 25, y: 25}}>
   *                      <div>I start with transformX: 25px and transformY: 25px;</div>
   *                  </Draggable>
   *              );
   *          }
   *      });
   * ```
   */
  defaultPosition: q.default.shape({
    x: q.default.number,
    y: q.default.number
  }),
  positionOffset: q.default.shape({
    x: q.default.oneOfType([q.default.number, q.default.string]),
    y: q.default.oneOfType([q.default.number, q.default.string])
  }),
  /**
   * `position`, if present, defines the current position of the element.
   *
   *  This is similar to how form elements in React work - if no `position` is supplied, the component
   *  is uncontrolled.
   *
   * Example:
   *
   * ```jsx
   *      let App = React.createClass({
   *          render: function () {
   *              return (
   *                  <Draggable position={{x: 25, y: 25}}>
   *                      <div>I start with transformX: 25px and transformY: 25px;</div>
   *                  </Draggable>
   *              );
   *          }
   *      });
   * ```
   */
  position: q.default.shape({
    x: q.default.number,
    y: q.default.number
  }),
  /**
   * These properties should be defined on the child, not here.
   */
  className: Re,
  style: Re,
  transform: Re
};
tt.defaultProps = {
  ...ye.defaultProps,
  axis: "both",
  bounds: !1,
  defaultClassName: "react-draggable",
  defaultClassNameDragging: "react-draggable-dragging",
  defaultClassNameDragged: "react-draggable-dragged",
  defaultPosition: { x: 0, y: 0 },
  scale: 1
};
const Mt = go, Ao = Mt.DraggableCore, Vr = Mt.default || Mt;
Qe.exports = Vr;
Qe.exports.default = Vr;
Qe.exports.DraggableCore = Ao;
var Kr = Qe.exports, rt = { exports: {} }, He = {}, Kt = {};
Kt.__esModule = !0;
Kt.cloneElement = Fo;
var Io = Go(C);
function Go(t) {
  return t && t.__esModule ? t : { default: t };
}
function gr(t, e) {
  var r = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(t);
    e && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(t, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function mr(t) {
  for (var e = 1; e < arguments.length; e++) {
    var r = arguments[e] != null ? arguments[e] : {};
    e % 2 ? gr(Object(r), !0).forEach(function(n) {
      Bo(t, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(r)) : gr(Object(r)).forEach(function(n) {
      Object.defineProperty(t, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return t;
}
function Bo(t, e, r) {
  return (e = Yo(e)) in t ? Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }) : t[e] = r, t;
}
function Yo(t) {
  var e = Xo(t, "string");
  return typeof e == "symbol" ? e : e + "";
}
function Xo(t, e) {
  if (typeof t != "object" || !t) return t;
  var r = t[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(t, e);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
function Fo(t, e) {
  return e.style && t.props.style && (e.style = mr(mr({}, t.props.style), e.style)), e.className && t.props.className && (e.className = t.props.className + " " + e.className), /* @__PURE__ */ Io.default.cloneElement(t, e);
}
var ke = {};
ke.__esModule = !0;
ke.resizableProps = void 0;
var w = Uo(le);
function Uo(t) {
  return t && t.__esModule ? t : { default: t };
}
ke.resizableProps = {
  /*
  * Restricts resizing to a particular axis (default: 'both')
  * 'both' - allows resizing by width or height
  * 'x' - only allows the width to be changed
  * 'y' - only allows the height to be changed
  * 'none' - disables resizing altogether
  * */
  axis: w.default.oneOf(["both", "x", "y", "none"]),
  className: w.default.string,
  /*
  * Require that one and only one child be present.
  * */
  children: w.default.element.isRequired,
  /*
  * These will be passed wholesale to react-draggable's DraggableCore
  * */
  draggableOpts: w.default.shape({
    allowAnyClick: w.default.bool,
    cancel: w.default.string,
    children: w.default.node,
    disabled: w.default.bool,
    enableUserSelectHack: w.default.bool,
    // #251: Check for Element to support SSR environments where DOM globals don't exist
    offsetParent: typeof Element < "u" ? w.default.instanceOf(Element) : w.default.any,
    grid: w.default.arrayOf(w.default.number),
    handle: w.default.string,
    nodeRef: w.default.object,
    onStart: w.default.func,
    onDrag: w.default.func,
    onStop: w.default.func,
    onMouseDown: w.default.func,
    scale: w.default.number
  }),
  /*
  * Initial height
  * */
  height: function() {
    for (var t = arguments.length, e = new Array(t), r = 0; r < t; r++)
      e[r] = arguments[r];
    const n = e[0];
    return n.axis === "both" || n.axis === "y" ? w.default.number.isRequired(...e) : w.default.number(...e);
  },
  /*
  * Customize cursor resize handle
  * */
  handle: w.default.oneOfType([w.default.node, w.default.func]),
  /*
  * If you change this, be sure to update your css
  * */
  handleSize: w.default.arrayOf(w.default.number),
  lockAspectRatio: w.default.bool,
  /*
  * Max X & Y measure
  * */
  maxConstraints: w.default.arrayOf(w.default.number),
  /*
  * Min X & Y measure
  * */
  minConstraints: w.default.arrayOf(w.default.number),
  /*
  * Called on stop resize event
  * */
  onResizeStop: w.default.func,
  /*
  * Called on start resize event
  * */
  onResizeStart: w.default.func,
  /*
  * Called on resize event
  * */
  onResize: w.default.func,
  /*
  * Defines which resize handles should be rendered (default: 'se')
  * 's' - South handle (bottom-center)
  * 'w' - West handle (left-center)
  * 'e' - East handle (right-center)
  * 'n' - North handle (top-center)
  * 'sw' - Southwest handle (bottom-left)
  * 'nw' - Northwest handle (top-left)
  * 'se' - Southeast handle (bottom-right)
  * 'ne' - Northeast handle (top-center)
  * */
  resizeHandles: w.default.arrayOf(w.default.oneOf(["s", "w", "e", "n", "sw", "nw", "se", "ne"])),
  /*
  * If `transform: scale(n)` is set on the parent, this should be set to `n`.
  * */
  transformScale: w.default.number,
  /*
   * Initial width
   */
  width: function() {
    for (var t = arguments.length, e = new Array(t), r = 0; r < t; r++)
      e[r] = arguments[r];
    const n = e[0];
    return n.axis === "both" || n.axis === "x" ? w.default.number.isRequired(...e) : w.default.number(...e);
  }
};
He.__esModule = !0;
He.default = void 0;
var ze = Jr(C), Vo = Kr, Ko = Kt, Jo = ke;
const Zo = ["children", "className", "draggableOpts", "width", "height", "handle", "handleSize", "lockAspectRatio", "axis", "minConstraints", "maxConstraints", "onResize", "onResizeStop", "onResizeStart", "resizeHandles", "transformScale"];
function Jr(t, e) {
  if (typeof WeakMap == "function") var r = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap();
  return (Jr = function(o, i) {
    if (!i && o && o.__esModule) return o;
    var s, l, a = { __proto__: null, default: o };
    if (o === null || typeof o != "object" && typeof o != "function") return a;
    if (s = i ? n : r) {
      if (s.has(o)) return s.get(o);
      s.set(o, a);
    }
    for (const u in o) u !== "default" && {}.hasOwnProperty.call(o, u) && ((l = (s = Object.defineProperty) && Object.getOwnPropertyDescriptor(o, u)) && (l.get || l.set) ? s(a, u, l) : a[u] = o[u]);
    return a;
  })(t, e);
}
function Lt() {
  return Lt = Object.assign ? Object.assign.bind() : function(t) {
    for (var e = 1; e < arguments.length; e++) {
      var r = arguments[e];
      for (var n in r) ({}).hasOwnProperty.call(r, n) && (t[n] = r[n]);
    }
    return t;
  }, Lt.apply(null, arguments);
}
function Qo(t, e) {
  if (t == null) return {};
  var r = {};
  for (var n in t) if ({}.hasOwnProperty.call(t, n)) {
    if (e.indexOf(n) !== -1) continue;
    r[n] = t[n];
  }
  return r;
}
function yr(t, e) {
  var r = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(t);
    e && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(t, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function wt(t) {
  for (var e = 1; e < arguments.length; e++) {
    var r = arguments[e] != null ? arguments[e] : {};
    e % 2 ? yr(Object(r), !0).forEach(function(n) {
      ei(t, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(r)) : yr(Object(r)).forEach(function(n) {
      Object.defineProperty(t, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return t;
}
function ei(t, e, r) {
  return (e = ti(e)) in t ? Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }) : t[e] = r, t;
}
function ti(t) {
  var e = ri(t, "string");
  return typeof e == "symbol" ? e : e + "";
}
function ri(t, e) {
  if (typeof t != "object" || !t) return t;
  var r = t[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(t, e);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
class Jt extends ze.Component {
  constructor() {
    super(...arguments), this.handleRefs = {}, this.lastHandleRect = null, this.slack = null, this.lastSize = null;
  }
  componentWillUnmount() {
    this.resetData();
  }
  resetData() {
    this.lastHandleRect = this.slack = this.lastSize = null;
  }
  // Clamp width and height within provided constraints
  runConstraints(e, r) {
    const n = this.props, o = n.minConstraints, i = n.maxConstraints, s = n.lockAspectRatio;
    if (!o && !i && !s) return [e, r];
    if (s) {
      const d = this.props.width / this.props.height, h = e - this.props.width, b = r - this.props.height;
      Math.abs(h) > Math.abs(b * d) ? r = e / d : e = r * d;
    }
    const l = e, a = r;
    let u = this.slack || [0, 0], c = u[0], f = u[1];
    return e += c, r += f, o && (e = Math.max(o[0], e), r = Math.max(o[1], r)), i && (e = Math.min(i[0], e), r = Math.min(i[1], r)), this.slack = [c + (l - e), f + (a - r)], [e, r];
  }
  /**
   * Wrapper around drag events to provide more useful data.
   *
   * @param  {String} handlerName Handler name to wrap.
   * @return {Function}           Handler function.
   */
  resizeHandler(e, r) {
    return (n, o) => {
      var i, s, l, a;
      let u = o.node, c = o.deltaX, f = o.deltaY;
      e === "onResizeStart" && this.resetData();
      const d = (this.props.axis === "both" || this.props.axis === "x") && r !== "n" && r !== "s", h = (this.props.axis === "both" || this.props.axis === "y") && r !== "e" && r !== "w";
      if (!d && !h) return;
      const b = r[0], S = r[r.length - 1], x = u.getBoundingClientRect();
      if (this.lastHandleRect != null) {
        if (S === "w") {
          const ue = x.left - this.lastHandleRect.left;
          c += ue;
        }
        if (b === "n") {
          const ue = x.top - this.lastHandleRect.top;
          f += ue;
        }
      }
      this.lastHandleRect = x, S === "w" && (c = -c), b === "n" && (f = -f);
      const m = (i = (s = this.lastSize) == null ? void 0 : s.width) != null ? i : this.props.width, D = (l = (a = this.lastSize) == null ? void 0 : a.height) != null ? l : this.props.height;
      let v = m + (d ? c / this.props.transformScale : 0), M = D + (h ? f / this.props.transformScale : 0);
      var R = this.runConstraints(v, M);
      if (v = R[0], M = R[1], e === "onResizeStop" && this.lastSize) {
        var A = this.lastSize;
        v = A.width, M = A.height;
      }
      const B = v !== m || M !== D;
      e !== "onResizeStop" && (this.lastSize = {
        width: v,
        height: M
      });
      const V = typeof this.props[e] == "function" ? this.props[e] : null;
      V && !(e === "onResize" && !B) && (n.persist == null || n.persist(), V(n, {
        node: u,
        size: {
          width: v,
          height: M
        },
        handle: r
      })), e === "onResizeStop" && this.resetData();
    };
  }
  // Render a resize handle given an axis & DOM ref. Ref *must* be attached for
  // the underlying draggable library to work properly.
  renderResizeHandle(e, r) {
    const n = this.props.handle;
    if (!n)
      return /* @__PURE__ */ ze.createElement("span", {
        className: "react-resizable-handle react-resizable-handle-" + e,
        ref: r
      });
    if (typeof n == "function")
      return n(e, r);
    const o = typeof n.type == "string", i = wt({
      ref: r
    }, o ? {} : {
      handleAxis: e
    });
    return /* @__PURE__ */ ze.cloneElement(n, i);
  }
  render() {
    const e = this.props, r = e.children, n = e.className, o = e.draggableOpts;
    e.width, e.height, e.handle, e.handleSize, e.lockAspectRatio, e.axis, e.minConstraints, e.maxConstraints, e.onResize, e.onResizeStop, e.onResizeStart;
    const i = e.resizeHandles;
    e.transformScale;
    const s = Qo(e, Zo);
    return (0, Ko.cloneElement)(r, wt(wt({}, s), {}, {
      className: (n ? n + " " : "") + "react-resizable",
      children: [...ze.Children.toArray(r.props.children), ...i.map((l) => {
        var a;
        const u = (a = this.handleRefs[l]) != null ? a : this.handleRefs[l] = /* @__PURE__ */ ze.createRef();
        return /* @__PURE__ */ ze.createElement(Vo.DraggableCore, Lt({}, o, {
          nodeRef: u,
          key: "resizableHandle-" + l,
          onStop: this.resizeHandler("onResizeStop", l),
          onStart: this.resizeHandler("onResizeStart", l),
          onDrag: this.resizeHandler("onResize", l)
        }), this.renderResizeHandle(l, u));
      })]
    }));
  }
}
He.default = Jt;
Jt.propTypes = Jo.resizableProps;
Jt.defaultProps = {
  axis: "both",
  handleSize: [20, 20],
  lockAspectRatio: !1,
  minConstraints: [20, 20],
  maxConstraints: [1 / 0, 1 / 0],
  resizeHandles: ["se"],
  transformScale: 1
};
var nt = {};
nt.__esModule = !0;
nt.default = void 0;
var zt = Qr(C), ni = Zr(le), oi = Zr(He), ii = ke;
const si = ["handle", "handleSize", "onResize", "onResizeStart", "onResizeStop", "draggableOpts", "minConstraints", "maxConstraints", "lockAspectRatio", "axis", "width", "height", "resizeHandles", "style", "transformScale"];
function Zr(t) {
  return t && t.__esModule ? t : { default: t };
}
function Qr(t, e) {
  if (typeof WeakMap == "function") var r = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap();
  return (Qr = function(o, i) {
    if (!i && o && o.__esModule) return o;
    var s, l, a = { __proto__: null, default: o };
    if (o === null || typeof o != "object" && typeof o != "function") return a;
    if (s = i ? n : r) {
      if (s.has(o)) return s.get(o);
      s.set(o, a);
    }
    for (const u in o) u !== "default" && {}.hasOwnProperty.call(o, u) && ((l = (s = Object.defineProperty) && Object.getOwnPropertyDescriptor(o, u)) && (l.get || l.set) ? s(a, u, l) : a[u] = o[u]);
    return a;
  })(t, e);
}
function Ht() {
  return Ht = Object.assign ? Object.assign.bind() : function(t) {
    for (var e = 1; e < arguments.length; e++) {
      var r = arguments[e];
      for (var n in r) ({}).hasOwnProperty.call(r, n) && (t[n] = r[n]);
    }
    return t;
  }, Ht.apply(null, arguments);
}
function br(t, e) {
  var r = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(t);
    e && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(t, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function Ye(t) {
  for (var e = 1; e < arguments.length; e++) {
    var r = arguments[e] != null ? arguments[e] : {};
    e % 2 ? br(Object(r), !0).forEach(function(n) {
      ai(t, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(r)) : br(Object(r)).forEach(function(n) {
      Object.defineProperty(t, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return t;
}
function ai(t, e, r) {
  return (e = li(e)) in t ? Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }) : t[e] = r, t;
}
function li(t) {
  var e = ui(t, "string");
  return typeof e == "symbol" ? e : e + "";
}
function ui(t, e) {
  if (typeof t != "object" || !t) return t;
  var r = t[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(t, e);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
function ci(t, e) {
  if (t == null) return {};
  var r = {};
  for (var n in t) if ({}.hasOwnProperty.call(t, n)) {
    if (e.indexOf(n) !== -1) continue;
    r[n] = t[n];
  }
  return r;
}
class en extends zt.Component {
  constructor() {
    super(...arguments), this.state = {
      width: this.props.width,
      height: this.props.height,
      propsWidth: this.props.width,
      propsHeight: this.props.height
    }, this.onResize = (e, r) => {
      const n = r.size;
      this.props.onResize ? (e.persist == null || e.persist(), this.setState(n, () => this.props.onResize && this.props.onResize(e, r))) : this.setState(n);
    };
  }
  static getDerivedStateFromProps(e, r) {
    return r.propsWidth !== e.width || r.propsHeight !== e.height ? {
      width: e.width,
      height: e.height,
      propsWidth: e.width,
      propsHeight: e.height
    } : null;
  }
  render() {
    const e = this.props, r = e.handle, n = e.handleSize;
    e.onResize;
    const o = e.onResizeStart, i = e.onResizeStop, s = e.draggableOpts, l = e.minConstraints, a = e.maxConstraints, u = e.lockAspectRatio, c = e.axis;
    e.width, e.height;
    const f = e.resizeHandles, d = e.style, h = e.transformScale, b = ci(e, si);
    return /* @__PURE__ */ zt.createElement(oi.default, {
      axis: c,
      draggableOpts: s,
      handle: r,
      handleSize: n,
      height: this.state.height,
      lockAspectRatio: u,
      maxConstraints: a,
      minConstraints: l,
      onResizeStart: o,
      onResize: this.onResize,
      onResizeStop: i,
      resizeHandles: f,
      transformScale: h,
      width: this.state.width
    }, /* @__PURE__ */ zt.createElement("div", Ht({}, b, {
      style: Ye(Ye({}, d), {}, {
        width: this.state.width + "px",
        height: this.state.height + "px"
      })
    })));
  }
}
nt.default = en;
en.propTypes = Ye(Ye({}, ii.resizableProps), {}, {
  children: ni.default.element
});
rt.exports = function() {
  throw new Error("Don't instantiate Resizable directly! Use require('react-resizable').Resizable");
};
rt.exports.Resizable = He.default;
rt.exports.ResizableBox = nt.default;
var di = rt.exports, se = {};
Object.defineProperty(se, "__esModule", {
  value: !0
});
se.resizeHandleType = se.resizeHandleAxesType = se.default = void 0;
var z = tn(le), fi = tn(C);
function tn(t) {
  return t && t.__esModule ? t : { default: t };
}
const pi = se.resizeHandleAxesType = z.default.arrayOf(z.default.oneOf(["s", "w", "e", "n", "sw", "nw", "se", "ne"])), hi = se.resizeHandleType = z.default.oneOfType([z.default.node, z.default.func]);
se.default = {
  //
  // Basic props
  //
  className: z.default.string,
  style: z.default.object,
  // This can be set explicitly. If it is not set, it will automatically
  // be set to the container width. Note that resizes will *not* cause this to adjust.
  // If you need that behavior, use WidthProvider.
  width: z.default.number,
  // If true, the container height swells and contracts to fit contents
  autoSize: z.default.bool,
  // # of cols.
  cols: z.default.number,
  // A selector that will not be draggable.
  draggableCancel: z.default.string,
  // A selector for the draggable handler
  draggableHandle: z.default.string,
  // Deprecated
  verticalCompact: function(t) {
    t.verticalCompact;
  },
  // Choose vertical or hotizontal compaction
  compactType: z.default.oneOf(["vertical", "horizontal"]),
  // layout is an array of object with the format:
  // {x: Number, y: Number, w: Number, h: Number, i: String}
  layout: function(t) {
    var e = t.layout;
    e !== void 0 && O.validateLayout(e, "layout");
  },
  //
  // Grid Dimensions
  //
  // Margin between items [x, y] in px
  margin: z.default.arrayOf(z.default.number),
  // Padding inside the container [x, y] in px
  containerPadding: z.default.arrayOf(z.default.number),
  // Rows have a static height, but you can change this based on breakpoints if you like
  rowHeight: z.default.number,
  // Default Infinity, but you can specify a max here if you like.
  // Note that this isn't fully fleshed out and won't error if you specify a layout that
  // extends beyond the row capacity. It will, however, not allow users to drag/resize
  // an item past the barrier. They can push items beyond the barrier, though.
  // Intentionally not documented for this reason.
  maxRows: z.default.number,
  //
  // Flags
  //
  isBounded: z.default.bool,
  isDraggable: z.default.bool,
  isResizable: z.default.bool,
  // If true, grid can be placed one over the other.
  allowOverlap: z.default.bool,
  // If true, grid items won't change position when being dragged over.
  preventCollision: z.default.bool,
  // Use CSS transforms instead of top/left
  useCSSTransforms: z.default.bool,
  // parent layout transform scale
  transformScale: z.default.number,
  // If true, an external element can trigger onDrop callback with a specific grid position as a parameter
  isDroppable: z.default.bool,
  // Resize handle options
  resizeHandles: pi,
  resizeHandle: hi,
  //
  // Callbacks
  //
  // Callback so you can save the layout. Calls after each drag & resize stops.
  onLayoutChange: z.default.func,
  // Calls when drag starts. Callback is of the signature (layout, oldItem, newItem, placeholder, e, ?node).
  // All callbacks below have the same signature. 'start' and 'stop' callbacks omit the 'placeholder'.
  onDragStart: z.default.func,
  // Calls on each drag movement.
  onDrag: z.default.func,
  // Calls when drag is complete.
  onDragStop: z.default.func,
  //Calls when resize starts.
  onResizeStart: z.default.func,
  // Calls when resize movement happens.
  onResize: z.default.func,
  // Calls when resize is complete.
  onResizeStop: z.default.func,
  // Calls when some element is dropped.
  onDrop: z.default.func,
  //
  // Other validations
  //
  droppingItem: z.default.shape({
    i: z.default.string.isRequired,
    w: z.default.number.isRequired,
    h: z.default.number.isRequired
  }),
  // Children must not have duplicate keys.
  children: function(t, e) {
    const r = t[e], n = {};
    fi.default.Children.forEach(r, function(o) {
      if ((o == null ? void 0 : o.key) != null) {
        if (n[o.key])
          throw new Error('Duplicate child key "' + o.key + '" found! This will cause problems in ReactGridLayout.');
        n[o.key] = !0;
      }
    });
  },
  // Optional ref for getting a reference for the wrapping div.
  innerRef: z.default.any
};
Object.defineProperty(Ze, "__esModule", {
  value: !0
});
Ze.default = void 0;
var xe = Zt(C), vr = Wt, _ = Zt(le), gi = Kr, mi = di, Oe = O, W = ie, wr = se, yi = Zt(Ue);
function Zt(t) {
  return t && t.__esModule ? t : { default: t };
}
function zr(t, e) {
  var r = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(t);
    e && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(t, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function xt(t) {
  for (var e = 1; e < arguments.length; e++) {
    var r = arguments[e] != null ? arguments[e] : {};
    e % 2 ? zr(Object(r), !0).forEach(function(n) {
      Q(t, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(r)) : zr(Object(r)).forEach(function(n) {
      Object.defineProperty(t, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return t;
}
function Q(t, e, r) {
  return (e = bi(e)) in t ? Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }) : t[e] = r, t;
}
function bi(t) {
  var e = vi(t, "string");
  return typeof e == "symbol" ? e : e + "";
}
function vi(t, e) {
  if (typeof t != "object" || !t) return t;
  var r = t[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(t, e);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
class Qt extends xe.default.Component {
  constructor() {
    super(...arguments), Q(this, "state", {
      resizing: null,
      dragging: null,
      className: ""
    }), Q(this, "elementRef", /* @__PURE__ */ xe.default.createRef()), Q(this, "onDragStart", (e, r) => {
      let {
        node: n
      } = r;
      const {
        onDragStart: o,
        transformScale: i
      } = this.props;
      if (!o) return;
      const s = {
        top: 0,
        left: 0
      }, {
        offsetParent: l
      } = n;
      if (!l) return;
      const a = l.getBoundingClientRect(), u = n.getBoundingClientRect(), c = u.left / i, f = a.left / i, d = u.top / i, h = a.top / i;
      s.left = c - f + l.scrollLeft, s.top = d - h + l.scrollTop, this.setState({
        dragging: s
      });
      const {
        x: b,
        y: S
      } = (0, W.calcXY)(this.getPositionParams(), s.top, s.left, this.props.w, this.props.h);
      return o.call(this, this.props.i, b, S, {
        e,
        node: n,
        newPosition: s
      });
    }), Q(this, "onDrag", (e, r, n) => {
      let {
        node: o,
        deltaX: i,
        deltaY: s
      } = r;
      const {
        onDrag: l
      } = this.props;
      if (!l) return;
      if (!this.state.dragging)
        throw new Error("onDrag called before onDragStart.");
      let a = this.state.dragging.top + s, u = this.state.dragging.left + i;
      const {
        isBounded: c,
        i: f,
        w: d,
        h,
        containerWidth: b
      } = this.props, S = this.getPositionParams();
      if (c) {
        const {
          offsetParent: v
        } = o;
        if (v) {
          const {
            margin: M,
            rowHeight: R
          } = this.props, A = v.clientHeight - (0, W.calcGridItemWHPx)(h, R, M[1]);
          a = (0, W.clamp)(a, 0, A);
          const B = (0, W.calcGridColWidth)(S), V = b - (0, W.calcGridItemWHPx)(d, B, M[0]);
          u = (0, W.clamp)(u, 0, V);
        }
      }
      const x = {
        top: a,
        left: u
      };
      n ? this.setState({
        dragging: x
      }) : (0, vr.flushSync)(() => {
        this.setState({
          dragging: x
        });
      });
      const {
        x: m,
        y: D
      } = (0, W.calcXY)(S, a, u, d, h);
      return l.call(this, f, m, D, {
        e,
        node: o,
        newPosition: x
      });
    }), Q(this, "onDragStop", (e, r) => {
      let {
        node: n
      } = r;
      const {
        onDragStop: o
      } = this.props;
      if (!o) return;
      if (!this.state.dragging)
        throw new Error("onDragEnd called before onDragStart.");
      const {
        w: i,
        h: s,
        i: l
      } = this.props, {
        left: a,
        top: u
      } = this.state.dragging, c = {
        top: u,
        left: a
      };
      this.setState({
        dragging: null
      });
      const {
        x: f,
        y: d
      } = (0, W.calcXY)(this.getPositionParams(), u, a, i, s);
      return o.call(this, l, f, d, {
        e,
        node: n,
        newPosition: c
      });
    }), Q(this, "onResizeStop", (e, r, n) => this.onResizeHandler(e, r, n, "onResizeStop")), Q(this, "onResizeStart", (e, r, n) => this.onResizeHandler(e, r, n, "onResizeStart")), Q(this, "onResize", (e, r, n) => this.onResizeHandler(e, r, n, "onResize"));
  }
  shouldComponentUpdate(e, r) {
    if (this.props.children !== e.children || this.props.droppingPosition !== e.droppingPosition) return !0;
    const n = (0, W.calcGridItemPosition)(this.getPositionParams(this.props), this.props.x, this.props.y, this.props.w, this.props.h, this.state), o = (0, W.calcGridItemPosition)(this.getPositionParams(e), e.x, e.y, e.w, e.h, r);
    return !(0, Oe.fastPositionEqual)(n, o) || this.props.useCSSTransforms !== e.useCSSTransforms;
  }
  componentDidMount() {
    this.moveDroppingItem({});
  }
  componentDidUpdate(e) {
    this.moveDroppingItem(e);
  }
  // When a droppingPosition is present, this means we should fire a move event, as if we had moved
  // this element by `x, y` pixels.
  moveDroppingItem(e) {
    const {
      droppingPosition: r
    } = this.props;
    if (!r) return;
    const n = this.elementRef.current;
    if (!n) return;
    const o = e.droppingPosition || {
      left: 0,
      top: 0
    }, {
      dragging: i
    } = this.state, s = i && r.left !== o.left || r.top !== o.top;
    if (!i)
      this.onDragStart(r.e, {
        node: n,
        deltaX: r.left,
        deltaY: r.top
      });
    else if (s) {
      const l = r.left - i.left, a = r.top - i.top;
      this.onDrag(
        r.e,
        {
          node: n,
          deltaX: l,
          deltaY: a
        },
        !0
        // dontFLush: avoid flushSync to temper warnings
      );
    }
  }
  getPositionParams() {
    let e = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : this.props;
    return {
      cols: e.cols,
      containerPadding: e.containerPadding,
      containerWidth: e.containerWidth,
      margin: e.margin,
      maxRows: e.maxRows,
      rowHeight: e.rowHeight
    };
  }
  /**
   * This is where we set the grid item's absolute placement. It gets a little tricky because we want to do it
   * well when server rendering, and the only way to do that properly is to use percentage width/left because
   * we don't know exactly what the browser viewport is.
   * Unfortunately, CSS Transforms, which are great for performance, break in this instance because a percentage
   * left is relative to the item itself, not its container! So we cannot use them on the server rendering pass.
   *
   * @param  {Object} pos Position object with width, height, left, top.
   * @return {Object}     Style object.
   */
  createStyle(e) {
    const {
      usePercentages: r,
      containerWidth: n,
      useCSSTransforms: o
    } = this.props;
    let i;
    return o ? i = (0, Oe.setTransform)(e) : (i = (0, Oe.setTopLeft)(e), r && (i.left = (0, Oe.perc)(e.left / n), i.width = (0, Oe.perc)(e.width / n))), i;
  }
  /**
   * Mix a Draggable instance into a child.
   * @param  {Element} child    Child element.
   * @return {Element}          Child wrapped in Draggable.
   */
  mixinDraggable(e, r) {
    return /* @__PURE__ */ xe.default.createElement(gi.DraggableCore, {
      disabled: !r,
      onStart: this.onDragStart,
      onDrag: this.onDrag,
      onStop: this.onDragStop,
      handle: this.props.handle,
      cancel: ".react-resizable-handle" + (this.props.cancel ? "," + this.props.cancel : ""),
      scale: this.props.transformScale,
      nodeRef: this.elementRef
    }, e);
  }
  /**
   * Utility function to setup callback handler definitions for
   * similarily structured resize events.
   */
  curryResizeHandler(e, r) {
    return (n, o) => (
      /*: Function*/
      r(n, o, e)
    );
  }
  /**
   * Mix a Resizable instance into a child.
   * @param  {Element} child    Child element.
   * @param  {Object} position  Position object (pixel values)
   * @return {Element}          Child wrapped in Resizable.
   */
  mixinResizable(e, r, n) {
    const {
      cols: o,
      minW: i,
      minH: s,
      maxW: l,
      maxH: a,
      transformScale: u,
      resizeHandles: c,
      resizeHandle: f
    } = this.props, d = this.getPositionParams(), h = (0, W.calcGridItemPosition)(d, 0, 0, o, 0).width, b = (0, W.calcGridItemPosition)(d, 0, 0, i, s), S = (0, W.calcGridItemPosition)(d, 0, 0, l, a), x = [b.width, b.height], m = [Math.min(S.width, h), Math.min(S.height, 1 / 0)];
    return /* @__PURE__ */ xe.default.createElement(
      mi.Resizable,
      {
        draggableOpts: {
          disabled: !n
        },
        className: n ? void 0 : "react-resizable-hide",
        width: r.width,
        height: r.height,
        minConstraints: x,
        maxConstraints: m,
        onResizeStop: this.curryResizeHandler(r, this.onResizeStop),
        onResizeStart: this.curryResizeHandler(r, this.onResizeStart),
        onResize: this.curryResizeHandler(r, this.onResize),
        transformScale: u,
        resizeHandles: c,
        handle: f
      },
      e
    );
  }
  /**
   * Wrapper around resize events to provide more useful data.
   */
  onResizeHandler(e, r, n, o) {
    let {
      node: i,
      size: s,
      handle: l
    } = r;
    const a = this.props[o];
    if (!a) return;
    const {
      x: u,
      y: c,
      i: f,
      maxH: d,
      minH: h,
      containerWidth: b
    } = this.props, {
      minW: S,
      maxW: x
    } = this.props;
    let m = s;
    i && (m = (0, Oe.resizeItemInDirection)(l, n, s, b), (0, vr.flushSync)(() => {
      this.setState({
        resizing: o === "onResizeStop" ? null : m
      });
    }));
    let {
      w: D,
      h: v
    } = (0, W.calcWH)(this.getPositionParams(), m.width, m.height, u, c, l);
    D = (0, W.clamp)(D, Math.max(S, 1), x), v = (0, W.clamp)(v, h, d), a.call(this, f, D, v, {
      e,
      node: i,
      size: m,
      handle: l
    });
  }
  render() {
    const {
      x: e,
      y: r,
      w: n,
      h: o,
      isDraggable: i,
      isResizable: s,
      droppingPosition: l,
      useCSSTransforms: a
    } = this.props, u = (0, W.calcGridItemPosition)(this.getPositionParams(), e, r, n, o, this.state), c = xe.default.Children.only(this.props.children);
    let f = /* @__PURE__ */ xe.default.cloneElement(c, {
      ref: this.elementRef,
      className: (0, yi.default)("react-grid-item", c.props.className, this.props.className, {
        static: this.props.static,
        resizing: !!this.state.resizing,
        "react-draggable": i,
        "react-draggable-dragging": !!this.state.dragging,
        dropping: !!l,
        cssTransforms: a
      }),
      // We can set the width and height on the child, but unfortunately we can't set the position.
      style: xt(xt(xt({}, this.props.style), c.props.style), this.createStyle(u))
    });
    return f = this.mixinResizable(f, u, s), f = this.mixinDraggable(f, i), f;
  }
}
Ze.default = Qt;
Q(Qt, "propTypes", {
  // Children must be only a single element
  children: _.default.element,
  // General grid attributes
  cols: _.default.number.isRequired,
  containerWidth: _.default.number.isRequired,
  rowHeight: _.default.number.isRequired,
  margin: _.default.array.isRequired,
  maxRows: _.default.number.isRequired,
  containerPadding: _.default.array.isRequired,
  // These are all in grid units
  x: _.default.number.isRequired,
  y: _.default.number.isRequired,
  w: _.default.number.isRequired,
  h: _.default.number.isRequired,
  // All optional
  minW: function(t, e) {
    const r = t[e];
    if (typeof r != "number") return new Error("minWidth not Number");
    if (r > t.w || r > t.maxW) return new Error("minWidth larger than item width/maxWidth");
  },
  maxW: function(t, e) {
    const r = t[e];
    if (typeof r != "number") return new Error("maxWidth not Number");
    if (r < t.w || r < t.minW) return new Error("maxWidth smaller than item width/minWidth");
  },
  minH: function(t, e) {
    const r = t[e];
    if (typeof r != "number") return new Error("minHeight not Number");
    if (r > t.h || r > t.maxH) return new Error("minHeight larger than item height/maxHeight");
  },
  maxH: function(t, e) {
    const r = t[e];
    if (typeof r != "number") return new Error("maxHeight not Number");
    if (r < t.h || r < t.minH) return new Error("maxHeight smaller than item height/minHeight");
  },
  // ID is nice to have for callbacks
  i: _.default.string.isRequired,
  // Resize handle options
  resizeHandles: wr.resizeHandleAxesType,
  resizeHandle: wr.resizeHandleType,
  // Functions
  onDragStop: _.default.func,
  onDragStart: _.default.func,
  onDrag: _.default.func,
  onResizeStop: _.default.func,
  onResizeStart: _.default.func,
  onResize: _.default.func,
  // Flags
  isDraggable: _.default.bool.isRequired,
  isResizable: _.default.bool.isRequired,
  isBounded: _.default.bool.isRequired,
  static: _.default.bool,
  // Use CSS transforms instead of top/left
  useCSSTransforms: _.default.bool.isRequired,
  transformScale: _.default.number,
  // Others
  className: _.default.string,
  // Selector for draggable handle
  handle: _.default.string,
  // Selector for draggable cancel (see react-draggable)
  cancel: _.default.string,
  // Current position of a dropping element
  droppingPosition: _.default.shape({
    e: _.default.object.isRequired,
    left: _.default.number.isRequired,
    top: _.default.number.isRequired
  })
});
Q(Qt, "defaultProps", {
  className: "",
  cancel: "",
  handle: "",
  minH: 1,
  minW: 1,
  maxH: 1 / 0,
  maxW: 1 / 0,
  transformScale: 1
});
Object.defineProperty(Le, "__esModule", {
  value: !0
});
Le.default = void 0;
var de = rn(C), Ot = $t, wi = er(Ue), g = O, zi = ie, xr = er(Ze), xi = er(se);
function er(t) {
  return t && t.__esModule ? t : { default: t };
}
function rn(t, e) {
  if (typeof WeakMap == "function") var r = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap();
  return (rn = function(o, i) {
    if (!i && o && o.__esModule) return o;
    var s, l, a = { __proto__: null, default: o };
    if (o === null || typeof o != "object" && typeof o != "function") return a;
    if (s = i ? n : r) {
      if (s.has(o)) return s.get(o);
      s.set(o, a);
    }
    for (const u in o) u !== "default" && {}.hasOwnProperty.call(o, u) && ((l = (s = Object.defineProperty) && Object.getOwnPropertyDescriptor(o, u)) && (l.get || l.set) ? s(a, u, l) : a[u] = o[u]);
    return a;
  })(t, e);
}
function Or(t, e) {
  var r = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(t);
    e && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(t, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function fe(t) {
  for (var e = 1; e < arguments.length; e++) {
    var r = arguments[e] != null ? arguments[e] : {};
    e % 2 ? Or(Object(r), !0).forEach(function(n) {
      $(t, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(r)) : Or(Object(r)).forEach(function(n) {
      Object.defineProperty(t, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return t;
}
function $(t, e, r) {
  return (e = Oi(e)) in t ? Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }) : t[e] = r, t;
}
function Oi(t) {
  var e = Si(t, "string");
  return typeof e == "symbol" ? e : e + "";
}
function Si(t, e) {
  if (typeof t != "object" || !t) return t;
  var r = t[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(t, e);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
const Sr = "react-grid-layout";
let nn = !1;
try {
  nn = /firefox/i.test(navigator.userAgent);
} catch {
}
class ot extends de.Component {
  constructor() {
    super(...arguments), $(this, "state", {
      activeDrag: null,
      layout: (0, g.synchronizeLayoutWithChildren)(
        this.props.layout,
        this.props.children,
        this.props.cols,
        // Legacy support for verticalCompact: false
        (0, g.compactType)(this.props),
        this.props.allowOverlap
      ),
      mounted: !1,
      oldDragItem: null,
      oldLayout: null,
      oldResizeItem: null,
      resizing: !1,
      droppingDOMNode: null,
      children: []
    }), $(this, "dragEnterCounter", 0), $(this, "onDragStart", (e, r, n, o) => {
      let {
        e: i,
        node: s
      } = o;
      const {
        layout: l
      } = this.state, a = (0, g.getLayoutItem)(l, e);
      if (!a) return;
      const u = {
        w: a.w,
        h: a.h,
        x: a.x,
        y: a.y,
        placeholder: !0,
        i: e
      };
      return this.setState({
        oldDragItem: (0, g.cloneLayoutItem)(a),
        oldLayout: l,
        activeDrag: u
      }), this.props.onDragStart(l, a, a, null, i, s);
    }), $(this, "onDrag", (e, r, n, o) => {
      let {
        e: i,
        node: s
      } = o;
      const {
        oldDragItem: l
      } = this.state;
      let {
        layout: a
      } = this.state;
      const {
        cols: u,
        allowOverlap: c,
        preventCollision: f
      } = this.props, d = (0, g.getLayoutItem)(a, e);
      if (!d) return;
      const h = {
        w: d.w,
        h: d.h,
        x: d.x,
        y: d.y,
        placeholder: !0,
        i: e
      };
      a = (0, g.moveElement)(a, d, r, n, !0, f, (0, g.compactType)(this.props), u, c), this.props.onDrag(a, l, d, h, i, s), this.setState({
        layout: c ? a : (0, g.compact)(a, (0, g.compactType)(this.props), u),
        activeDrag: h
      });
    }), $(this, "onDragStop", (e, r, n, o) => {
      let {
        e: i,
        node: s
      } = o;
      if (!this.state.activeDrag) return;
      const {
        oldDragItem: l
      } = this.state;
      let {
        layout: a
      } = this.state;
      const {
        cols: u,
        preventCollision: c,
        allowOverlap: f
      } = this.props, d = (0, g.getLayoutItem)(a, e);
      if (!d) return;
      a = (0, g.moveElement)(a, d, r, n, !0, c, (0, g.compactType)(this.props), u, f);
      const b = f ? a : (0, g.compact)(a, (0, g.compactType)(this.props), u);
      this.props.onDragStop(b, l, d, null, i, s);
      const {
        oldLayout: S
      } = this.state;
      this.setState({
        activeDrag: null,
        layout: b,
        oldDragItem: null,
        oldLayout: null
      }), this.onLayoutMaybeChanged(b, S);
    }), $(this, "onResizeStart", (e, r, n, o) => {
      let {
        e: i,
        node: s
      } = o;
      const {
        layout: l
      } = this.state, a = (0, g.getLayoutItem)(l, e);
      a && (this.setState({
        oldResizeItem: (0, g.cloneLayoutItem)(a),
        oldLayout: this.state.layout,
        resizing: !0
      }), this.props.onResizeStart(l, a, a, null, i, s));
    }), $(this, "onResize", (e, r, n, o) => {
      let {
        e: i,
        node: s,
        size: l,
        handle: a
      } = o;
      const {
        oldResizeItem: u
      } = this.state, {
        layout: c
      } = this.state, {
        cols: f,
        preventCollision: d,
        allowOverlap: h
      } = this.props;
      let b = !1, S, x, m;
      const [D, v] = (0, g.withLayoutItem)(c, e, (R) => {
        let A;
        return x = R.x, m = R.y, ["sw", "w", "nw", "n", "ne"].indexOf(a) !== -1 && (["sw", "nw", "w"].indexOf(a) !== -1 && (x = R.x + (R.w - r), r = R.x !== x && x < 0 ? R.w : r, x = x < 0 ? 0 : x), ["ne", "n", "nw"].indexOf(a) !== -1 && (m = R.y + (R.h - n), n = R.y !== m && m < 0 ? R.h : n, m = m < 0 ? 0 : m), b = !0), d && !h && (A = (0, g.getAllCollisions)(c, fe(fe({}, R), {}, {
          w: r,
          h: n,
          x,
          y: m
        })).filter((V) => V.i !== R.i).length > 0, A && (m = R.y, n = R.h, x = R.x, r = R.w, b = !1)), R.w = r, R.h = n, R;
      });
      if (!v) return;
      S = D, b && (S = (0, g.moveElement)(D, v, x, m, !0, this.props.preventCollision, (0, g.compactType)(this.props), f, h));
      const M = {
        w: v.w,
        h: v.h,
        x: v.x,
        y: v.y,
        static: !0,
        i: e
      };
      this.props.onResize(S, u, v, M, i, s), this.setState({
        layout: h ? S : (0, g.compact)(S, (0, g.compactType)(this.props), f),
        activeDrag: M
      });
    }), $(this, "onResizeStop", (e, r, n, o) => {
      let {
        e: i,
        node: s
      } = o;
      const {
        layout: l,
        oldResizeItem: a
      } = this.state, {
        cols: u,
        allowOverlap: c
      } = this.props, f = (0, g.getLayoutItem)(l, e), d = c ? l : (0, g.compact)(l, (0, g.compactType)(this.props), u);
      this.props.onResizeStop(d, a, f, null, i, s);
      const {
        oldLayout: h
      } = this.state;
      this.setState({
        activeDrag: null,
        layout: d,
        oldResizeItem: null,
        oldLayout: null,
        resizing: !1
      }), this.onLayoutMaybeChanged(d, h);
    }), $(this, "onDragOver", (e) => {
      var r;
      if (e.preventDefault(), e.stopPropagation(), nn && // $FlowIgnore can't figure this out
      !((r = e.nativeEvent.target) !== null && r !== void 0 && r.classList.contains(Sr)))
        return !1;
      const {
        droppingItem: n,
        onDropDragOver: o,
        margin: i,
        cols: s,
        rowHeight: l,
        maxRows: a,
        width: u,
        containerPadding: c,
        transformScale: f
      } = this.props, d = o == null ? void 0 : o(e);
      if (d === !1)
        return this.state.droppingDOMNode && this.removeDroppingPlaceholder(), !1;
      const h = fe(fe({}, n), d), {
        layout: b
      } = this.state, S = e.currentTarget.getBoundingClientRect(), x = e.clientX - S.left, m = e.clientY - S.top, D = {
        left: x / f,
        top: m / f,
        e
      };
      if (this.state.droppingDOMNode) {
        if (this.state.droppingPosition) {
          const {
            left: v,
            top: M
          } = this.state.droppingPosition;
          (v != x || M != m) && this.setState({
            droppingPosition: D
          });
        }
      } else {
        const v = {
          cols: s,
          margin: i,
          maxRows: a,
          rowHeight: l,
          containerWidth: u,
          containerPadding: c || i
        }, M = (0, zi.calcXY)(v, m, x, h.w, h.h);
        this.setState({
          droppingDOMNode: /* @__PURE__ */ de.createElement("div", {
            key: h.i
          }),
          droppingPosition: D,
          layout: [...b, fe(fe({}, h), {}, {
            x: M.x,
            y: M.y,
            static: !1,
            isDraggable: !0
          })]
        });
      }
    }), $(this, "removeDroppingPlaceholder", () => {
      const {
        droppingItem: e,
        cols: r
      } = this.props, {
        layout: n
      } = this.state, o = (0, g.compact)(n.filter((i) => i.i !== e.i), (0, g.compactType)(this.props), r, this.props.allowOverlap);
      this.setState({
        layout: o,
        droppingDOMNode: null,
        activeDrag: null,
        droppingPosition: void 0
      });
    }), $(this, "onDragLeave", (e) => {
      e.preventDefault(), e.stopPropagation(), this.dragEnterCounter--, this.dragEnterCounter === 0 && this.removeDroppingPlaceholder();
    }), $(this, "onDragEnter", (e) => {
      e.preventDefault(), e.stopPropagation(), this.dragEnterCounter++;
    }), $(this, "onDrop", (e) => {
      e.preventDefault(), e.stopPropagation();
      const {
        droppingItem: r
      } = this.props, {
        layout: n
      } = this.state, o = n.find((i) => i.i === r.i);
      this.dragEnterCounter = 0, this.removeDroppingPlaceholder(), this.props.onDrop(n, o, e);
    });
  }
  componentDidMount() {
    this.setState({
      mounted: !0
    }), this.onLayoutMaybeChanged(this.state.layout, this.props.layout);
  }
  static getDerivedStateFromProps(e, r) {
    let n;
    return r.activeDrag ? null : (!(0, Ot.deepEqual)(e.layout, r.propsLayout) || e.compactType !== r.compactType ? n = e.layout : (0, g.childrenEqual)(e.children, r.children) || (n = r.layout), n ? {
      layout: (0, g.synchronizeLayoutWithChildren)(n, e.children, e.cols, (0, g.compactType)(e), e.allowOverlap),
      // We need to save these props to state for using
      // getDerivedStateFromProps instead of componentDidMount (in which we would get extra rerender)
      compactType: e.compactType,
      children: e.children,
      propsLayout: e.layout
    } : null);
  }
  shouldComponentUpdate(e, r) {
    return (
      // NOTE: this is almost always unequal. Therefore the only way to get better performance
      // from SCU is if the user intentionally memoizes children. If they do, and they can
      // handle changes properly, performance will increase.
      this.props.children !== e.children || !(0, g.fastRGLPropsEqual)(this.props, e, Ot.deepEqual) || this.state.activeDrag !== r.activeDrag || this.state.mounted !== r.mounted || this.state.droppingPosition !== r.droppingPosition
    );
  }
  componentDidUpdate(e, r) {
    if (!this.state.activeDrag) {
      const n = this.state.layout, o = r.layout;
      this.onLayoutMaybeChanged(n, o);
    }
  }
  /**
   * Calculates a pixel value for the container.
   * @return {String} Container height in pixels.
   */
  containerHeight() {
    if (!this.props.autoSize) return;
    const e = (0, g.bottom)(this.state.layout), r = this.props.containerPadding ? this.props.containerPadding[1] : this.props.margin[1];
    return e * this.props.rowHeight + (e - 1) * this.props.margin[1] + r * 2 + "px";
  }
  onLayoutMaybeChanged(e, r) {
    r || (r = this.state.layout), (0, Ot.deepEqual)(r, e) || this.props.onLayoutChange(e);
  }
  /**
   * Create a placeholder object.
   * @return {Element} Placeholder div.
   */
  placeholder() {
    const {
      activeDrag: e
    } = this.state;
    if (!e) return null;
    const {
      width: r,
      cols: n,
      margin: o,
      containerPadding: i,
      rowHeight: s,
      maxRows: l,
      useCSSTransforms: a,
      transformScale: u
    } = this.props;
    return /* @__PURE__ */ de.createElement(xr.default, {
      w: e.w,
      h: e.h,
      x: e.x,
      y: e.y,
      i: e.i,
      className: "react-grid-placeholder ".concat(this.state.resizing ? "placeholder-resizing" : ""),
      containerWidth: r,
      cols: n,
      margin: o,
      containerPadding: i || o,
      maxRows: l,
      rowHeight: s,
      isDraggable: !1,
      isResizable: !1,
      isBounded: !1,
      useCSSTransforms: a,
      transformScale: u
    }, /* @__PURE__ */ de.createElement("div", null));
  }
  /**
   * Given a grid item, set its style attributes & surround in a <Draggable>.
   * @param  {Element} child React element.
   * @return {Element}       Element wrapped in draggable and properly placed.
   */
  processGridItem(e, r) {
    if (!e || !e.key) return;
    const n = (0, g.getLayoutItem)(this.state.layout, String(e.key));
    if (!n) return null;
    const {
      width: o,
      cols: i,
      margin: s,
      containerPadding: l,
      rowHeight: a,
      maxRows: u,
      isDraggable: c,
      isResizable: f,
      isBounded: d,
      useCSSTransforms: h,
      transformScale: b,
      draggableCancel: S,
      draggableHandle: x,
      resizeHandles: m,
      resizeHandle: D
    } = this.props, {
      mounted: v,
      droppingPosition: M
    } = this.state, R = typeof n.isDraggable == "boolean" ? n.isDraggable : !n.static && c, A = typeof n.isResizable == "boolean" ? n.isResizable : !n.static && f, B = n.resizeHandles || m, V = R && d && n.isBounded !== !1;
    return /* @__PURE__ */ de.createElement(xr.default, {
      containerWidth: o,
      cols: i,
      margin: s,
      containerPadding: l || s,
      maxRows: u,
      rowHeight: a,
      cancel: S,
      handle: x,
      onDragStop: this.onDragStop,
      onDragStart: this.onDragStart,
      onDrag: this.onDrag,
      onResizeStart: this.onResizeStart,
      onResize: this.onResize,
      onResizeStop: this.onResizeStop,
      isDraggable: R,
      isResizable: A,
      isBounded: V,
      useCSSTransforms: h && v,
      usePercentages: !v,
      transformScale: b,
      w: n.w,
      h: n.h,
      x: n.x,
      y: n.y,
      i: n.i,
      minH: n.minH,
      minW: n.minW,
      maxH: n.maxH,
      maxW: n.maxW,
      static: n.static,
      droppingPosition: r ? M : void 0,
      resizeHandles: B,
      resizeHandle: D
    }, e);
  }
  render() {
    const {
      className: e,
      style: r,
      isDroppable: n,
      innerRef: o
    } = this.props, i = (0, wi.default)(Sr, e), s = fe({
      height: this.containerHeight()
    }, r);
    return /* @__PURE__ */ de.createElement("div", {
      ref: o,
      className: i,
      style: s,
      onDrop: n ? this.onDrop : g.noop,
      onDragLeave: n ? this.onDragLeave : g.noop,
      onDragEnter: n ? this.onDragEnter : g.noop,
      onDragOver: n ? this.onDragOver : g.noop
    }, de.Children.map(this.props.children, (l) => this.processGridItem(l)), n && this.state.droppingDOMNode && this.processGridItem(this.state.droppingDOMNode, !0), this.placeholder());
  }
}
Le.default = ot;
$(ot, "displayName", "ReactGridLayout");
$(ot, "propTypes", xi.default);
$(ot, "defaultProps", {
  autoSize: !0,
  cols: 12,
  className: "",
  style: {},
  draggableHandle: "",
  draggableCancel: "",
  containerPadding: null,
  rowHeight: 150,
  maxRows: 1 / 0,
  // infinite vertical growth
  layout: [],
  margin: [10, 10],
  isBounded: !1,
  isDraggable: !0,
  isResizable: !0,
  allowOverlap: !1,
  isDroppable: !1,
  useCSSTransforms: !0,
  transformScale: 1,
  verticalCompact: !0,
  compactType: "vertical",
  preventCollision: !1,
  droppingItem: {
    i: "__dropping-elem__",
    h: 1,
    w: 1
  },
  resizeHandles: ["se"],
  onLayoutChange: g.noop,
  onDragStart: g.noop,
  onDrag: g.noop,
  onDragStop: g.noop,
  onResizeStart: g.noop,
  onResize: g.noop,
  onResizeStop: g.noop,
  onDrop: g.noop,
  onDropDragOver: g.noop
});
var it = {}, be = {};
Object.defineProperty(be, "__esModule", {
  value: !0
});
be.findOrGenerateResponsiveLayout = _i;
be.getBreakpointFromWidth = Ri;
be.getColsFromBreakpoint = Di;
be.sortBreakpoints = tr;
var $e = O;
function Ri(t, e) {
  const r = tr(t);
  let n = r[0];
  for (let o = 1, i = r.length; o < i; o++) {
    const s = r[o];
    e > t[s] && (n = s);
  }
  return n;
}
function Di(t, e) {
  if (!e[t])
    throw new Error("ResponsiveReactGridLayout: `cols` entry for breakpoint " + t + " is missing!");
  return e[t];
}
function _i(t, e, r, n, o, i) {
  if (t[r]) return (0, $e.cloneLayout)(t[r]);
  let s = t[n];
  const l = tr(e), a = l.slice(l.indexOf(r));
  for (let u = 0, c = a.length; u < c; u++) {
    const f = a[u];
    if (t[f]) {
      s = t[f];
      break;
    }
  }
  return s = (0, $e.cloneLayout)(s || []), (0, $e.compact)((0, $e.correctBounds)(s, {
    cols: o
  }), i, o);
}
function tr(t) {
  return Object.keys(t).sort(function(r, n) {
    return t[r] - t[n];
  });
}
Object.defineProperty(it, "__esModule", {
  value: !0
});
it.default = void 0;
var Rr = sn(C), U = on(le), St = $t, De = O, pe = be, Ei = on(Le);
const Pi = ["breakpoint", "breakpoints", "cols", "layouts", "margin", "containerPadding", "onBreakpointChange", "onLayoutChange", "onWidthChange"];
function on(t) {
  return t && t.__esModule ? t : { default: t };
}
function sn(t, e) {
  if (typeof WeakMap == "function") var r = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap();
  return (sn = function(o, i) {
    if (!i && o && o.__esModule) return o;
    var s, l, a = { __proto__: null, default: o };
    if (o === null || typeof o != "object" && typeof o != "function") return a;
    if (s = i ? n : r) {
      if (s.has(o)) return s.get(o);
      s.set(o, a);
    }
    for (const u in o) u !== "default" && {}.hasOwnProperty.call(o, u) && ((l = (s = Object.defineProperty) && Object.getOwnPropertyDescriptor(o, u)) && (l.get || l.set) ? s(a, u, l) : a[u] = o[u]);
    return a;
  })(t, e);
}
function kt() {
  return kt = Object.assign ? Object.assign.bind() : function(t) {
    for (var e = 1; e < arguments.length; e++) {
      var r = arguments[e];
      for (var n in r) ({}).hasOwnProperty.call(r, n) && (t[n] = r[n]);
    }
    return t;
  }, kt.apply(null, arguments);
}
function Ci(t, e) {
  if (t == null) return {};
  var r, n, o = ji(t, e);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(t);
    for (n = 0; n < i.length; n++) r = i[n], e.indexOf(r) === -1 && {}.propertyIsEnumerable.call(t, r) && (o[r] = t[r]);
  }
  return o;
}
function ji(t, e) {
  if (t == null) return {};
  var r = {};
  for (var n in t) if ({}.hasOwnProperty.call(t, n)) {
    if (e.indexOf(n) !== -1) continue;
    r[n] = t[n];
  }
  return r;
}
function Dr(t, e) {
  var r = Object.keys(t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(t);
    e && (n = n.filter(function(o) {
      return Object.getOwnPropertyDescriptor(t, o).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function Rt(t) {
  for (var e = 1; e < arguments.length; e++) {
    var r = arguments[e] != null ? arguments[e] : {};
    e % 2 ? Dr(Object(r), !0).forEach(function(n) {
      Me(t, n, r[n]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(t, Object.getOwnPropertyDescriptors(r)) : Dr(Object(r)).forEach(function(n) {
      Object.defineProperty(t, n, Object.getOwnPropertyDescriptor(r, n));
    });
  }
  return t;
}
function Me(t, e, r) {
  return (e = qi(e)) in t ? Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }) : t[e] = r, t;
}
function qi(t) {
  var e = Mi(t, "string");
  return typeof e == "symbol" ? e : e + "";
}
function Mi(t, e) {
  if (typeof t != "object" || !t) return t;
  var r = t[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(t, e);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
const _r = (t) => Object.prototype.toString.call(t);
function Ae(t, e) {
  return t == null ? null : Array.isArray(t) ? t : t[e];
}
class rr extends Rr.Component {
  constructor() {
    super(...arguments), Me(this, "state", this.generateInitialState()), Me(this, "onLayoutChange", (e) => {
      this.props.onLayoutChange(e, Rt(Rt({}, this.props.layouts), {}, {
        [this.state.breakpoint]: e
      }));
    });
  }
  generateInitialState() {
    const {
      width: e,
      breakpoints: r,
      layouts: n,
      cols: o
    } = this.props, i = (0, pe.getBreakpointFromWidth)(r, e), s = (0, pe.getColsFromBreakpoint)(i, o), l = this.props.verticalCompact === !1 ? null : this.props.compactType;
    return {
      layout: (0, pe.findOrGenerateResponsiveLayout)(n, r, i, i, s, l),
      breakpoint: i,
      cols: s
    };
  }
  static getDerivedStateFromProps(e, r) {
    if (!(0, St.deepEqual)(e.layouts, r.layouts)) {
      const {
        breakpoint: n,
        cols: o
      } = r;
      return {
        layout: (0, pe.findOrGenerateResponsiveLayout)(e.layouts, e.breakpoints, n, n, o, e.compactType),
        layouts: e.layouts
      };
    }
    return null;
  }
  componentDidUpdate(e) {
    (this.props.width != e.width || this.props.breakpoint !== e.breakpoint || !(0, St.deepEqual)(this.props.breakpoints, e.breakpoints) || !(0, St.deepEqual)(this.props.cols, e.cols)) && this.onWidthChange(e);
  }
  /**
   * When the width changes work through breakpoints and reset state with the new width & breakpoint.
   * Width changes are necessary to figure out the widget widths.
   */
  onWidthChange(e) {
    const {
      breakpoints: r,
      cols: n,
      layouts: o,
      compactType: i
    } = this.props, s = this.props.breakpoint || (0, pe.getBreakpointFromWidth)(this.props.breakpoints, this.props.width), l = this.state.breakpoint, a = (0, pe.getColsFromBreakpoint)(s, n), u = Rt({}, o);
    if (l !== s || e.breakpoints !== r || e.cols !== n) {
      l in u || (u[l] = (0, De.cloneLayout)(this.state.layout));
      let d = (0, pe.findOrGenerateResponsiveLayout)(u, r, s, l, a, i);
      d = (0, De.synchronizeLayoutWithChildren)(d, this.props.children, a, i, this.props.allowOverlap), u[s] = d, this.props.onBreakpointChange(s, a), this.props.onLayoutChange(d, u), this.setState({
        breakpoint: s,
        layout: d,
        cols: a
      });
    }
    const c = Ae(this.props.margin, s), f = Ae(this.props.containerPadding, s);
    this.props.onWidthChange(this.props.width, c, a, f);
  }
  render() {
    const e = this.props, {
      breakpoint: r,
      breakpoints: n,
      cols: o,
      layouts: i,
      margin: s,
      containerPadding: l,
      onBreakpointChange: a,
      onLayoutChange: u,
      onWidthChange: c
    } = e, f = Ci(e, Pi);
    return /* @__PURE__ */ Rr.createElement(Ei.default, kt({}, f, {
      // $FlowIgnore should allow nullable here due to DefaultProps
      margin: Ae(s, this.state.breakpoint),
      containerPadding: Ae(l, this.state.breakpoint),
      onLayoutChange: this.onLayoutChange,
      layout: this.state.layout,
      cols: this.state.cols
    }));
  }
}
it.default = rr;
Me(rr, "propTypes", {
  //
  // Basic props
  //
  // Optional, but if you are managing width yourself you may want to set the breakpoint
  // yourself as well.
  breakpoint: U.default.string,
  // {name: pxVal}, e.g. {lg: 1200, md: 996, sm: 768, xs: 480}
  breakpoints: U.default.object,
  allowOverlap: U.default.bool,
  // # of cols. This is a breakpoint -> cols map
  cols: U.default.object,
  // # of margin. This is a breakpoint -> margin map
  // e.g. { lg: [5, 5], md: [10, 10], sm: [15, 15] }
  // Margin between items [x, y] in px
  // e.g. [10, 10]
  margin: U.default.oneOfType([U.default.array, U.default.object]),
  // # of containerPadding. This is a breakpoint -> containerPadding map
  // e.g. { lg: [5, 5], md: [10, 10], sm: [15, 15] }
  // Padding inside the container [x, y] in px
  // e.g. [10, 10]
  containerPadding: U.default.oneOfType([U.default.array, U.default.object]),
  // layouts is an object mapping breakpoints to layouts.
  // e.g. {lg: Layout, md: Layout, ...}
  layouts(t, e) {
    if (_r(t[e]) !== "[object Object]")
      throw new Error("Layout property must be an object. Received: " + _r(t[e]));
    Object.keys(t[e]).forEach((r) => {
      if (!(r in t.breakpoints))
        throw new Error("Each key in layouts must align with a key in breakpoints.");
      (0, De.validateLayout)(t.layouts[r], "layouts." + r);
    });
  },
  // The width of this component.
  // Required in this propTypes stanza because generateInitialState() will fail without it.
  width: U.default.number.isRequired,
  //
  // Callbacks
  //
  // Calls back with breakpoint and new # cols
  onBreakpointChange: U.default.func,
  // Callback so you can save the layout.
  // Calls back with (currentLayout, allLayouts). allLayouts are keyed by breakpoint.
  onLayoutChange: U.default.func,
  // Calls back with (containerWidth, margin, cols, containerPadding)
  onWidthChange: U.default.func
});
Me(rr, "defaultProps", {
  breakpoints: {
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
    xxs: 0
  },
  cols: {
    lg: 12,
    md: 10,
    sm: 6,
    xs: 4,
    xxs: 2
  },
  containerPadding: {
    lg: null,
    md: null,
    sm: null,
    xs: null,
    xxs: null
  },
  layouts: {},
  margin: [10, 10],
  allowOverlap: !1,
  onBreakpointChange: De.noop,
  onLayoutChange: De.noop,
  onWidthChange: De.noop
});
var nr = {}, an = function() {
  if (typeof Map < "u")
    return Map;
  function t(e, r) {
    var n = -1;
    return e.some(function(o, i) {
      return o[0] === r ? (n = i, !0) : !1;
    }), n;
  }
  return (
    /** @class */
    function() {
      function e() {
        this.__entries__ = [];
      }
      return Object.defineProperty(e.prototype, "size", {
        /**
         * @returns {boolean}
         */
        get: function() {
          return this.__entries__.length;
        },
        enumerable: !0,
        configurable: !0
      }), e.prototype.get = function(r) {
        var n = t(this.__entries__, r), o = this.__entries__[n];
        return o && o[1];
      }, e.prototype.set = function(r, n) {
        var o = t(this.__entries__, r);
        ~o ? this.__entries__[o][1] = n : this.__entries__.push([r, n]);
      }, e.prototype.delete = function(r) {
        var n = this.__entries__, o = t(n, r);
        ~o && n.splice(o, 1);
      }, e.prototype.has = function(r) {
        return !!~t(this.__entries__, r);
      }, e.prototype.clear = function() {
        this.__entries__.splice(0);
      }, e.prototype.forEach = function(r, n) {
        n === void 0 && (n = null);
        for (var o = 0, i = this.__entries__; o < i.length; o++) {
          var s = i[o];
          r.call(n, s[1], s[0]);
        }
      }, e;
    }()
  );
}(), Tt = typeof window < "u" && typeof document < "u" && window.document === document, Xe = function() {
  return typeof global < "u" && global.Math === Math ? global : typeof self < "u" && self.Math === Math ? self : typeof window < "u" && window.Math === Math ? window : Function("return this")();
}(), Li = function() {
  return typeof requestAnimationFrame == "function" ? requestAnimationFrame.bind(Xe) : function(t) {
    return setTimeout(function() {
      return t(Date.now());
    }, 1e3 / 60);
  };
}(), Hi = 2;
function ki(t, e) {
  var r = !1, n = !1, o = 0;
  function i() {
    r && (r = !1, t()), n && l();
  }
  function s() {
    Li(i);
  }
  function l() {
    var a = Date.now();
    if (r) {
      if (a - o < Hi)
        return;
      n = !0;
    } else
      r = !0, n = !1, setTimeout(s, e);
    o = a;
  }
  return l;
}
var Ti = 20, Ni = ["top", "right", "bottom", "left", "width", "height", "size", "weight"], Wi = typeof MutationObserver < "u", $i = (
  /** @class */
  function() {
    function t() {
      this.connected_ = !1, this.mutationEventsAdded_ = !1, this.mutationsObserver_ = null, this.observers_ = [], this.onTransitionEnd_ = this.onTransitionEnd_.bind(this), this.refresh = ki(this.refresh.bind(this), Ti);
    }
    return t.prototype.addObserver = function(e) {
      ~this.observers_.indexOf(e) || this.observers_.push(e), this.connected_ || this.connect_();
    }, t.prototype.removeObserver = function(e) {
      var r = this.observers_, n = r.indexOf(e);
      ~n && r.splice(n, 1), !r.length && this.connected_ && this.disconnect_();
    }, t.prototype.refresh = function() {
      var e = this.updateObservers_();
      e && this.refresh();
    }, t.prototype.updateObservers_ = function() {
      var e = this.observers_.filter(function(r) {
        return r.gatherActive(), r.hasActive();
      });
      return e.forEach(function(r) {
        return r.broadcastActive();
      }), e.length > 0;
    }, t.prototype.connect_ = function() {
      !Tt || this.connected_ || (document.addEventListener("transitionend", this.onTransitionEnd_), window.addEventListener("resize", this.refresh), Wi ? (this.mutationsObserver_ = new MutationObserver(this.refresh), this.mutationsObserver_.observe(document, {
        attributes: !0,
        childList: !0,
        characterData: !0,
        subtree: !0
      })) : (document.addEventListener("DOMSubtreeModified", this.refresh), this.mutationEventsAdded_ = !0), this.connected_ = !0);
    }, t.prototype.disconnect_ = function() {
      !Tt || !this.connected_ || (document.removeEventListener("transitionend", this.onTransitionEnd_), window.removeEventListener("resize", this.refresh), this.mutationsObserver_ && this.mutationsObserver_.disconnect(), this.mutationEventsAdded_ && document.removeEventListener("DOMSubtreeModified", this.refresh), this.mutationsObserver_ = null, this.mutationEventsAdded_ = !1, this.connected_ = !1);
    }, t.prototype.onTransitionEnd_ = function(e) {
      var r = e.propertyName, n = r === void 0 ? "" : r, o = Ni.some(function(i) {
        return !!~n.indexOf(i);
      });
      o && this.refresh();
    }, t.getInstance = function() {
      return this.instance_ || (this.instance_ = new t()), this.instance_;
    }, t.instance_ = null, t;
  }()
), ln = function(t, e) {
  for (var r = 0, n = Object.keys(e); r < n.length; r++) {
    var o = n[r];
    Object.defineProperty(t, o, {
      value: e[o],
      enumerable: !1,
      writable: !1,
      configurable: !0
    });
  }
  return t;
}, _e = function(t) {
  var e = t && t.ownerDocument && t.ownerDocument.defaultView;
  return e || Xe;
}, un = st(0, 0, 0, 0);
function Fe(t) {
  return parseFloat(t) || 0;
}
function Er(t) {
  for (var e = [], r = 1; r < arguments.length; r++)
    e[r - 1] = arguments[r];
  return e.reduce(function(n, o) {
    var i = t["border-" + o + "-width"];
    return n + Fe(i);
  }, 0);
}
function Ai(t) {
  for (var e = ["top", "right", "bottom", "left"], r = {}, n = 0, o = e; n < o.length; n++) {
    var i = o[n], s = t["padding-" + i];
    r[i] = Fe(s);
  }
  return r;
}
function Ii(t) {
  var e = t.getBBox();
  return st(0, 0, e.width, e.height);
}
function Gi(t) {
  var e = t.clientWidth, r = t.clientHeight;
  if (!e && !r)
    return un;
  var n = _e(t).getComputedStyle(t), o = Ai(n), i = o.left + o.right, s = o.top + o.bottom, l = Fe(n.width), a = Fe(n.height);
  if (n.boxSizing === "border-box" && (Math.round(l + i) !== e && (l -= Er(n, "left", "right") + i), Math.round(a + s) !== r && (a -= Er(n, "top", "bottom") + s)), !Yi(t)) {
    var u = Math.round(l + i) - e, c = Math.round(a + s) - r;
    Math.abs(u) !== 1 && (l -= u), Math.abs(c) !== 1 && (a -= c);
  }
  return st(o.left, o.top, l, a);
}
var Bi = /* @__PURE__ */ function() {
  return typeof SVGGraphicsElement < "u" ? function(t) {
    return t instanceof _e(t).SVGGraphicsElement;
  } : function(t) {
    return t instanceof _e(t).SVGElement && typeof t.getBBox == "function";
  };
}();
function Yi(t) {
  return t === _e(t).document.documentElement;
}
function Xi(t) {
  return Tt ? Bi(t) ? Ii(t) : Gi(t) : un;
}
function Fi(t) {
  var e = t.x, r = t.y, n = t.width, o = t.height, i = typeof DOMRectReadOnly < "u" ? DOMRectReadOnly : Object, s = Object.create(i.prototype);
  return ln(s, {
    x: e,
    y: r,
    width: n,
    height: o,
    top: r,
    right: e + n,
    bottom: o + r,
    left: e
  }), s;
}
function st(t, e, r, n) {
  return { x: t, y: e, width: r, height: n };
}
var Ui = (
  /** @class */
  function() {
    function t(e) {
      this.broadcastWidth = 0, this.broadcastHeight = 0, this.contentRect_ = st(0, 0, 0, 0), this.target = e;
    }
    return t.prototype.isActive = function() {
      var e = Xi(this.target);
      return this.contentRect_ = e, e.width !== this.broadcastWidth || e.height !== this.broadcastHeight;
    }, t.prototype.broadcastRect = function() {
      var e = this.contentRect_;
      return this.broadcastWidth = e.width, this.broadcastHeight = e.height, e;
    }, t;
  }()
), Vi = (
  /** @class */
  /* @__PURE__ */ function() {
    function t(e, r) {
      var n = Fi(r);
      ln(this, { target: e, contentRect: n });
    }
    return t;
  }()
), Ki = (
  /** @class */
  function() {
    function t(e, r, n) {
      if (this.activeObservations_ = [], this.observations_ = new an(), typeof e != "function")
        throw new TypeError("The callback provided as parameter 1 is not a function.");
      this.callback_ = e, this.controller_ = r, this.callbackCtx_ = n;
    }
    return t.prototype.observe = function(e) {
      if (!arguments.length)
        throw new TypeError("1 argument required, but only 0 present.");
      if (!(typeof Element > "u" || !(Element instanceof Object))) {
        if (!(e instanceof _e(e).Element))
          throw new TypeError('parameter 1 is not of type "Element".');
        var r = this.observations_;
        r.has(e) || (r.set(e, new Ui(e)), this.controller_.addObserver(this), this.controller_.refresh());
      }
    }, t.prototype.unobserve = function(e) {
      if (!arguments.length)
        throw new TypeError("1 argument required, but only 0 present.");
      if (!(typeof Element > "u" || !(Element instanceof Object))) {
        if (!(e instanceof _e(e).Element))
          throw new TypeError('parameter 1 is not of type "Element".');
        var r = this.observations_;
        r.has(e) && (r.delete(e), r.size || this.controller_.removeObserver(this));
      }
    }, t.prototype.disconnect = function() {
      this.clearActive(), this.observations_.clear(), this.controller_.removeObserver(this);
    }, t.prototype.gatherActive = function() {
      var e = this;
      this.clearActive(), this.observations_.forEach(function(r) {
        r.isActive() && e.activeObservations_.push(r);
      });
    }, t.prototype.broadcastActive = function() {
      if (this.hasActive()) {
        var e = this.callbackCtx_, r = this.activeObservations_.map(function(n) {
          return new Vi(n.target, n.broadcastRect());
        });
        this.callback_.call(e, r, e), this.clearActive();
      }
    }, t.prototype.clearActive = function() {
      this.activeObservations_.splice(0);
    }, t.prototype.hasActive = function() {
      return this.activeObservations_.length > 0;
    }, t;
  }()
), cn = typeof WeakMap < "u" ? /* @__PURE__ */ new WeakMap() : new an(), dn = (
  /** @class */
  /* @__PURE__ */ function() {
    function t(e) {
      if (!(this instanceof t))
        throw new TypeError("Cannot call a class as a function.");
      if (!arguments.length)
        throw new TypeError("1 argument required, but only 0 present.");
      var r = $i.getInstance(), n = new Ki(e, r, this);
      cn.set(this, n);
    }
    return t;
  }()
);
[
  "observe",
  "unobserve",
  "disconnect"
].forEach(function(t) {
  dn.prototype[t] = function() {
    var e;
    return (e = cn.get(this))[t].apply(e, arguments);
  };
});
var Ji = function() {
  return typeof Xe.ResizeObserver < "u" ? Xe.ResizeObserver : dn;
}();
const Zi = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Ji
}, Symbol.toStringTag, { value: "Module" })), Qi = /* @__PURE__ */ qr(Zi);
Object.defineProperty(nr, "__esModule", {
  value: !0
});
nr.default = us;
var Ie = fn(C), es = or(le), ts = or(Qi), rs = or(Ue);
const ns = ["measureBeforeMount"];
function or(t) {
  return t && t.__esModule ? t : { default: t };
}
function fn(t, e) {
  if (typeof WeakMap == "function") var r = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap();
  return (fn = function(o, i) {
    if (!i && o && o.__esModule) return o;
    var s, l, a = { __proto__: null, default: o };
    if (o === null || typeof o != "object" && typeof o != "function") return a;
    if (s = i ? n : r) {
      if (s.has(o)) return s.get(o);
      s.set(o, a);
    }
    for (const u in o) u !== "default" && {}.hasOwnProperty.call(o, u) && ((l = (s = Object.defineProperty) && Object.getOwnPropertyDescriptor(o, u)) && (l.get || l.set) ? s(a, u, l) : a[u] = o[u]);
    return a;
  })(t, e);
}
function Nt() {
  return Nt = Object.assign ? Object.assign.bind() : function(t) {
    for (var e = 1; e < arguments.length; e++) {
      var r = arguments[e];
      for (var n in r) ({}).hasOwnProperty.call(r, n) && (t[n] = r[n]);
    }
    return t;
  }, Nt.apply(null, arguments);
}
function os(t, e) {
  if (t == null) return {};
  var r, n, o = is(t, e);
  if (Object.getOwnPropertySymbols) {
    var i = Object.getOwnPropertySymbols(t);
    for (n = 0; n < i.length; n++) r = i[n], e.indexOf(r) === -1 && {}.propertyIsEnumerable.call(t, r) && (o[r] = t[r]);
  }
  return o;
}
function is(t, e) {
  if (t == null) return {};
  var r = {};
  for (var n in t) if ({}.hasOwnProperty.call(t, n)) {
    if (e.indexOf(n) !== -1) continue;
    r[n] = t[n];
  }
  return r;
}
function Se(t, e, r) {
  return (e = ss(e)) in t ? Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }) : t[e] = r, t;
}
function ss(t) {
  var e = as(t, "string");
  return typeof e == "symbol" ? e : e + "";
}
function as(t, e) {
  if (typeof t != "object" || !t) return t;
  var r = t[Symbol.toPrimitive];
  if (r !== void 0) {
    var n = r.call(t, e);
    if (typeof n != "object") return n;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (e === "string" ? String : Number)(t);
}
const ls = "react-grid-layout";
function us(t) {
  var e;
  return e = class extends Ie.Component {
    constructor() {
      super(...arguments), Se(this, "state", {
        width: 1280
      }), Se(this, "elementRef", /* @__PURE__ */ Ie.createRef()), Se(this, "mounted", !1), Se(this, "resizeObserver", void 0);
    }
    componentDidMount() {
      this.mounted = !0, this.resizeObserver = new ts.default((o) => {
        if (this.elementRef.current instanceof HTMLElement) {
          const s = o[0].contentRect.width;
          this.setState({
            width: s
          });
        }
      });
      const n = this.elementRef.current;
      n instanceof HTMLElement && this.resizeObserver.observe(n);
    }
    componentWillUnmount() {
      this.mounted = !1;
      const n = this.elementRef.current;
      n instanceof HTMLElement && this.resizeObserver.unobserve(n), this.resizeObserver.disconnect();
    }
    render() {
      const n = this.props, {
        measureBeforeMount: o
      } = n, i = os(n, ns);
      return o && !this.mounted ? /* @__PURE__ */ Ie.createElement("div", {
        className: (0, rs.default)(this.props.className, ls),
        style: this.props.style,
        ref: this.elementRef
      }) : /* @__PURE__ */ Ie.createElement(t, Nt({
        innerRef: this.elementRef
      }, i, this.state));
    }
  }, Se(e, "defaultProps", {
    measureBeforeMount: !1
  }), Se(e, "propTypes", {
    // If true, will not render children until mounted. Useful for getting the exact width before
    // rendering, to prevent any unsightly resizing.
    measureBeforeMount: es.default.bool
  }), e;
}
(function(t) {
  t.exports = Le.default, t.exports.utils = O, t.exports.calculateUtils = ie, t.exports.Responsive = it.default, t.exports.Responsive.utils = be, t.exports.WidthProvider = nr.default;
})(Mr);
var Pr = Mr.exports;
const Dt = /* @__PURE__ */ new Map(), Ge = /* @__PURE__ */ new Map();
function cs(t, e) {
  return t.querySelector(`[data-layout-grid-item-id="${CSS.escape(e)}"]`) ?? void 0;
}
function ds(t, e) {
  const r = cs(t, e);
  if (!r)
    return !1;
  const n = t.getBoundingClientRect(), o = r.getBoundingClientRect();
  return o.bottom <= n.bottom || t.scrollTo({
    top: t.scrollTop + o.bottom - n.bottom,
    behavior: "smooth"
  }), !0;
}
function fs(t, e, r) {
  const n = C.useRef(null);
  return C.useEffect(() => () => {
    Dt.delete(t), Ge.delete(t);
  }, [t]), C.useEffect(() => {
    const o = Dt.get(t);
    if (Dt.set(t, e), !o)
      return;
    const i = new Set(o), s = e.find((c) => !i.has(c));
    s && Ge.set(t, s);
    const l = Ge.get(t);
    if (!l)
      return;
    let a;
    const u = window.requestAnimationFrame(() => {
      a = window.requestAnimationFrame(() => {
        const c = n.current;
        c && ds(c, l) && Ge.delete(t);
      });
    });
    return () => {
      window.cancelAnimationFrame(u), a != null && window.cancelAnimationFrame(a);
    };
  }, [e, r, t]), n;
}
const ps = Pr.WidthProvider(Pr.Responsive), pn = [
  "n",
  "e",
  "s",
  "w",
  "se",
  "sw",
  "nw",
  "ne"
], hs = pn, gs = [12, 12], ms = [0, 0], ys = `
.sqlrooms-grid-layout .react-grid-item {
  overflow: visible;
  transition: none;
}

.sqlrooms-grid-layout .react-grid-item.react-draggable-dragging {
  opacity: 1;
}

.sqlrooms-grid-layout.sqlrooms-grid-layout-interacting,
.sqlrooms-grid-layout.sqlrooms-grid-layout-interacting * {
  -webkit-user-select: none !important;
  user-select: none !important;
}

.sqlrooms-grid-layout .react-grid-item.react-grid-placeholder {
  background: hsl(var(--primary) / 0.18);
  border: 1px solid hsl(var(--primary) / 0.35);
  opacity: 1;
  transition: none;
}

.sqlrooms-grid-layout .react-grid-item.react-grid-placeholder.placeholder-resizing {
  transition: none;
}

.sqlrooms-grid-layout .react-grid-item.sqlrooms-grid-resize-follow-preview {
  height: var(--sqlrooms-grid-preview-height) !important;
  transform: translate(
    var(--sqlrooms-grid-preview-left),
    var(--sqlrooms-grid-preview-top)
  ) !important;
  transition: none;
  width: var(--sqlrooms-grid-preview-width) !important;
}

.sqlrooms-grid-resize-size {
  background: hsl(var(--background) / 0.92);
  border: 1px solid hsl(var(--primary) / 0.28);
  border-radius: 9999px;
  color: hsl(var(--foreground));
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  padding: 4px 7px;
  pointer-events: none;
  position: absolute;
  right: 8px;
  top: 8px;
  z-index: 30;
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle {
  background-image: none;
  box-sizing: border-box;
  opacity: 0;
  padding: 0;
  transform: none;
  transition:
    background-color 120ms ease,
    opacity 120ms ease;
  z-index: 20;
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle::after {
  content: none;
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle:hover,
.sqlrooms-grid-layout.sqlrooms-grid-layout-resizing-e .react-grid-item.resizing > .react-resizable-handle-e,
.sqlrooms-grid-layout.sqlrooms-grid-layout-resizing-s .react-grid-item.resizing > .react-resizable-handle-s,
.sqlrooms-grid-layout.sqlrooms-grid-layout-resizing-w .react-grid-item.resizing > .react-resizable-handle-w,
.sqlrooms-grid-layout.sqlrooms-grid-layout-resizing-n .react-grid-item.resizing > .react-resizable-handle-n,
.sqlrooms-grid-layout.sqlrooms-grid-layout-resizing-se .react-grid-item.resizing > .react-resizable-handle-se,
.sqlrooms-grid-layout.sqlrooms-grid-layout-resizing-sw .react-grid-item.resizing > .react-resizable-handle-sw,
.sqlrooms-grid-layout.sqlrooms-grid-layout-resizing-nw .react-grid-item.resizing > .react-resizable-handle-nw,
.sqlrooms-grid-layout.sqlrooms-grid-layout-resizing-ne .react-grid-item.resizing > .react-resizable-handle-ne {
  opacity: 1;
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-e {
  bottom: 0;
  cursor: ew-resize;
  height: 100%;
  margin-top: 0;
  right: -4px;
  top: 0;
  width: 12px;
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-w {
  bottom: 0;
  cursor: ew-resize;
  height: 100%;
  left: -4px;
  margin-top: 0;
  top: 0;
  width: 12px;
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-e::before,
.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-w::before {
  background: transparent;
  content: "";
  height: 100%;
  left: 5px;
  position: absolute;
  top: 0;
  width: 2px;
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-e:hover::before,
.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-w:hover::before,
.sqlrooms-grid-layout.sqlrooms-grid-layout-resizing-e .react-grid-item.resizing > .react-resizable-handle-e::before,
.sqlrooms-grid-layout.sqlrooms-grid-layout-resizing-w .react-grid-item.resizing > .react-resizable-handle-w::before {
  background: hsl(var(--primary));
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-s {
  bottom: -4px;
  cursor: ns-resize;
  height: 12px;
  left: 0;
  margin-left: 0;
  width: 100%;
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-n {
  cursor: ns-resize;
  height: 12px;
  left: 0;
  margin-left: 0;
  top: -4px;
  width: 100%;
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-s::before,
.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-n::before {
  align-self: center;
  background: transparent;
  content: "";
  height: 2px;
  left: 0;
  position: absolute;
  top: 5px;
  width: 100%;
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-s:hover::before,
.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-n:hover::before,
.sqlrooms-grid-layout.sqlrooms-grid-layout-resizing-s .react-grid-item.resizing > .react-resizable-handle-s::before,
.sqlrooms-grid-layout.sqlrooms-grid-layout-resizing-n .react-grid-item.resizing > .react-resizable-handle-n::before {
  background: hsl(var(--primary));
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-se {
  bottom: -4px;
  cursor: nwse-resize;
  height: 16px;
  margin-left: 0;
  right: -4px;
  width: 16px;
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-sw {
  bottom: -4px;
  cursor: nesw-resize;
  height: 16px;
  left: -4px;
  margin-left: 0;
  width: 16px;
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-nw {
  cursor: nwse-resize;
  height: 16px;
  left: -4px;
  margin-left: 0;
  top: -4px;
  width: 16px;
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-ne {
  cursor: nesw-resize;
  height: 16px;
  margin-left: 0;
  right: -4px;
  top: -4px;
  width: 16px;
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-se::before {
  background: transparent;
  border-bottom: 2px solid transparent;
  border-right: 2px solid transparent;
  bottom: 5px;
  content: "";
  height: 8px;
  position: absolute;
  right: 5px;
  width: 8px;
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-sw::before {
  background: transparent;
  border-bottom: 2px solid transparent;
  border-left: 2px solid transparent;
  bottom: 5px;
  content: "";
  height: 8px;
  left: 5px;
  position: absolute;
  width: 8px;
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-nw::before {
  background: transparent;
  border-left: 2px solid transparent;
  border-top: 2px solid transparent;
  content: "";
  height: 8px;
  left: 5px;
  position: absolute;
  top: 5px;
  width: 8px;
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-ne::before {
  background: transparent;
  border-right: 2px solid transparent;
  border-top: 2px solid transparent;
  content: "";
  height: 8px;
  position: absolute;
  right: 5px;
  top: 5px;
  width: 8px;
}

.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-se:hover::before,
.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-sw:hover::before,
.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-nw:hover::before,
.sqlrooms-grid-layout .react-grid-item > .sqlrooms-grid-resize-handle.react-resizable-handle-ne:hover::before,
.sqlrooms-grid-layout.sqlrooms-grid-layout-resizing-se .react-grid-item.resizing > .react-resizable-handle-se::before,
.sqlrooms-grid-layout.sqlrooms-grid-layout-resizing-sw .react-grid-item.resizing > .react-resizable-handle-sw::before,
.sqlrooms-grid-layout.sqlrooms-grid-layout-resizing-nw .react-grid-item.resizing > .react-resizable-handle-nw::before,
.sqlrooms-grid-layout.sqlrooms-grid-layout-resizing-ne .react-grid-item.resizing > .react-resizable-handle-ne::before {
  border-color: hsl(var(--primary));
}
`;
function bs(t) {
  return structuredClone(t);
}
function vs(t, e, r) {
  if (r.width <= 0 || r.cols <= 0)
    return;
  const [n, o] = r.margin, [i, s] = r.containerPadding, l = (r.width - i * 2 - n * (r.cols - 1)) / r.cols;
  return {
    left: i + t.x * (l + n),
    top: s + t.y * (e + o),
    width: t.w * l + Math.max(0, t.w - 1) * n,
    height: t.h * e + Math.max(0, t.h - 1) * o
  };
}
function Cr(t) {
  return {
    i: t.i,
    x: t.x,
    y: t.y,
    w: t.w,
    h: t.h
  };
}
function ws(t) {
  return t ? {
    overflow: "visible",
    "--sqlrooms-grid-preview-left": `${t.left}px`,
    "--sqlrooms-grid-preview-top": `${t.top}px`,
    "--sqlrooms-grid-preview-width": `${t.width}px`,
    "--sqlrooms-grid-preview-height": `${t.height}px`
  } : { overflow: "visible" };
}
function zs(t, e) {
  return X.jsx("span", { ref: e, className: `react-resizable-handle react-resizable-handle-${t} sqlrooms-grid-resize-handle`, "data-layout-resize-handle": t });
}
function xs(t) {
  return t != null && hs.includes(t);
}
function Os(t) {
  const e = t.target;
  if (!(e instanceof Element))
    return null;
  const r = e.closest("[data-layout-resize-handle]"), n = r == null ? void 0 : r.dataset.layoutResizeHandle;
  return xs(n) ? n : null;
}
function hn(t) {
  return t || pn;
}
function Ss(t, e) {
  return t.length === e.length && t.every((r) => e.includes(r));
}
function Rs(t, e) {
  const r = {
    i: t.i,
    x: t.x,
    y: t.y,
    w: t.w,
    h: t.h
  };
  if (t.minW != null && (r.minW = t.minW), t.maxW != null && (r.maxW = t.maxW), t.minH != null && (r.minH = t.minH), t.maxH != null && (r.maxH = t.maxH), t.static != null && (r.static = t.static), t.isDraggable != null && (r.isDraggable = t.isDraggable), t.isResizable != null && (r.isResizable = t.isResizable), t.resizeHandles != null) {
    const n = hn(t.resizeHandles);
    Ss(n, e) || (r.resizeHandles = n);
  }
  return r;
}
function jr(t, e) {
  return Object.fromEntries(Object.entries(t).map(([r, n]) => [
    r,
    n.map((o) => Rs(o, e))
  ]));
}
const Ds = ({ node: t, path: e, parentDirection: r }) => {
  const n = zn(), o = xn(t), { rootLayout: i, onLayoutChange: s } = On(), l = t.rowHeight ?? 220, a = t.margin ?? gs, u = t.containerPadding ?? ms, [c, f] = C.useState(() => ({
    width: 0,
    margin: a,
    cols: 12,
    containerPadding: u
  })), [d, h] = C.useState(!1), [b, S] = C.useState(!1), [x, m] = C.useState(null), [D, v] = C.useState(null), M = C.useMemo(() => t.children.map(_t), [t.children]), R = t.breakpoints ?? Cn, A = C.useMemo(() => qn(t.cols, R), [R, t.cols]), B = C.useMemo(() => hn(t.resizeHandles), [t.resizeHandles]), V = C.useMemo(() => t.layouts ? jr(t.layouts, B) : Ln(t.children, A), [A, t.children, t.layouts, B]), ue = fs(t.id, M, V), Pe = D ? vs(D, l, c) : void 0, lt = C.useCallback((J) => {
    if (!s)
      return;
    const Y = jr(J, B);
    if (JSON.stringify(t.layouts ?? {}) === JSON.stringify(Y))
      return;
    const F = bs(i), ee = Sn(F, t.id);
    !ee || !Rn(ee.node) || (ee.node.layouts = Y, s(F));
  }, [t.id, t.layouts, s, B, i]), Te = C.useCallback(() => {
    h(!0), S(!0);
  }, []), Ne = C.useCallback(() => {
    h(!1), S(!1);
  }, []), ut = C.useCallback((J, Y, F, ee) => {
    f({
      width: J,
      margin: Y,
      cols: F,
      containerPadding: ee
    });
  }, []), ve = C.useCallback((J, Y, F, ee, ft) => {
    h(!0), m(Os(ft)), v(Cr(F));
  }, []), we = C.useCallback((J, Y, F, ee) => {
    v(Cr(ee ?? F));
  }, []), ct = C.useCallback(() => {
    h(!1), m(null), v(null);
  }, []), dt = X.jsxs("div", { className: "flex h-full min-h-0 w-full flex-col", "data-grid-id": t.id, children: [X.jsx("style", { children: ys }), (o == null ? void 0 : o.title) && X.jsxs("div", { className: "border-border flex items-center gap-2 border-b px-3 py-2", children: [o.icon && X.jsx(o.icon, { className: "h-4 w-4" }), X.jsx("span", { className: "text-sm font-medium", children: o.title })] }), X.jsxs(Dn, { viewportRef: ue, className: "min-h-0 flex-1", children: [X.jsx("div", { className: "min-h-full px-5 py-2", style: b ? { paddingBottom: "calc(50vh + 0.5rem)" } : void 0, children: X.jsx(ps, { className: [
    "layout sqlrooms-grid-layout",
    d ? "sqlrooms-grid-layout-interacting" : "",
    x ? `sqlrooms-grid-layout-resizing-${x}` : ""
  ].filter(Boolean).join(" "), layouts: V, cols: A, breakpoints: R, rowHeight: l, margin: a, containerPadding: u, compactType: t.compactType === void 0 ? null : t.compactType, preventCollision: t.preventCollision, isBounded: t.isBounded, autoSize: t.autoSize ?? !0, draggableHandle: '[data-layout-drag-handle="true"]', draggableCancel: 'button, input, textarea, select, a, [data-layout-drag-cancel="true"]', resizeHandles: B, resizeHandle: zs, onDragStart: Te, onDragStop: Ne, onWidthChange: ut, onResizeStart: ve, onResize: we, onResizeStop: ct, onLayoutChange: (J, Y) => lt(Y), children: t.children.map((J) => {
    const Y = _t(J), F = (D == null ? void 0 : D.i) === Y && Pe != null;
    return X.jsxs("div", { className: F ? "sqlrooms-grid-resize-follow-preview h-full" : "h-full", "data-layout-grid-item-id": Y, style: ws(F ? Pe : void 0), children: [X.jsx("div", { className: "bg-background h-full overflow-hidden rounded border", children: n({
      node: J,
      path: [...e, t.id, Y],
      containerType: "grid",
      containerId: t.id
    }) }), F ? X.jsxs("div", { className: "sqlrooms-grid-resize-size", children: [D.w, " cols x ", D.h, " rows"] }) : null] }, Y);
  }) }) }), X.jsx(_n, { orientation: "horizontal" })] })] });
  return X.jsx(En, { containerType: "grid", node: t, path: e, parentDirection: r, children: X.jsx(Pn, { defaultComponent: dt }) });
}, qs = { Root: Ds };
export {
  qs as GridLayout
};
