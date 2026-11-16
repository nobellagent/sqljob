import { w as j, b3 as M, bf as D, ck as C, q as $, eQ as B, by as Y, t as oe, f5 as J, bN as R, fH as ie, az as ue, g0 as ce, bz as i, g6 as fe, bm as z, da as X, g7 as me, c4 as de, ff as he, fv as ge, fW as be, g8 as ee, g9 as pe, ga as ve, L as _e, gb as Se, au as ye, bj as I, d4 as we, b4 as te, bl as $e } from "./sqljob-Cib0eUyv.js";
import { bq as P, bs as H, bt as W, bu as xe, bv as K, bw as G, bx as re, by as Re, bz as Ce, aN as L, bA as Ee, bB as Me, bC as Ne, bD as Ie, bE as Ue, bF as Ve, bG as ke } from "./sqljob-6TMoFbJO.js";
import { Q as ae, $ as le } from "./sqljob-1yfB5uqr.js";
const se = "$.£.¥.¤.֏.؋.৳.฿.៛.₡.₦.₩.₪.₫.€.₭.₮.₱.₲.₴.₸.₹.₺.₼.₽.₾.₿.﷼".split("."), F = /* @__PURE__ */ new Map([[i.EN_US, "$"], [i.RU_RU, "₽"], [i.VI_VN, "₫"], [i.ZH_CN, "¥"], [i.ZH_TW, "NT$"], [i.FR_FR, "€"], [i.FA_IR, "﷼"], [i.KO_KR, "₩"], [i.ES_ES, "€"], [i.CA_ES, "€"], [i.SK_SK, "€"]]);
function Oe(e) {
  switch (e) {
    case i.CA_ES:
    case i.ES_ES:
    case i.FR_FR:
    case i.SK_SK:
      return { icon: "EuroIcon", symbol: F.get(e) || "€", locale: e };
    case i.RU_RU:
      return { icon: "RoubleIcon", symbol: F.get(e) || "₽", locale: e };
    case i.ZH_CN:
      return { icon: "RmbIcon", symbol: F.get(e) || "¥", locale: e };
    case i.EN_US:
    default:
      return { icon: "DollarIcon", symbol: "$", locale: i.EN_US };
  }
}
function Z(e) {
  return F.get(e) || "$";
}
function je(e, t = 2) {
  let r = t;
  t > 127 && (r = 127);
  let a = "";
  return r > 0 && (a = `.${"0".repeat(r)}`), `"${Z(e)}"#,##0${a}_);[Red]("${Z(e)}"#,##0${a})`;
}
const Fe = [{ label: "1930-08-05", suffix: "yyyy-MM-dd" }, { label: "1930/08/05", suffix: "yyyy/MM/dd" }, { label: "1930年08月05日", suffix: 'yyyy"年"MM"月"dd"日"' }, { label: "08-05", suffix: "MM-dd" }, { label: "8月5日", suffix: 'M"月"d"日"' }, { label: "13:30:30", suffix: "h:mm:ss" }, { label: "13:30", suffix: "h:mm" }, { label: "下午01:30", suffix: "A/P hh:mm" }, { label: "下午1:30", suffix: "A/P h:mm" }, { label: "下午1:30:30", suffix: "A/P h:mm:ss" }, { label: "08-05 下午 01:30", suffix: "MM-dd A/P hh:mm" }], Te = [{ label: "(1,235)", suffix: "#,##0_);(#,##0)" }, { label: "(1,235) ", suffix: "#,##0_);[Red](#,##0)", color: "red" }, { label: "1,234.56", suffix: "#,##0.00_);#,##0.00" }, { label: "1,234.56", suffix: "#,##0.00_);[Red]#,##0.00", color: "red" }, { label: "-1,234.56", suffix: "#,##0.00_);-#,##0.00" }, { label: "-1,234.56", suffix: "#,##0.00_);[Red]-#,##0.00", color: "red" }], Ae = [{ label: (e) => `${e}1,235`, suffix: (e) => `"${e}"#,##0.00_);"${e}"#,##0.00` }, { label: (e) => `${e}1,235`, suffix: (e) => `"${e}"#,##0.00_);[Red]"${e}"#,##0.00`, color: "red" }, { label: (e) => `(${e}1,235)`, suffix: (e) => `"${e}"#,##0.00_);("${e}"#,##0.00)` }, { label: (e) => `(${e}1,235)`, suffix: (e) => `"${e}"#,##0.00_);[Red]("${e}"#,##0.00)`, color: "red" }, { label: (e) => `-${e}1,235`, suffix: (e) => `"${e}"#,##0.00_);-"${e}"#,##0.00` }, { label: (e) => `-${e}1,235`, suffix: (e) => `"${e}"#,##0.00_);[Red]-"${e}"#,##0.00`, color: "red" }], T = (e, t = 0) => {
  var r;
  return e ? (r = ee(e).maxDecimals) == null ? t : r : t;
}, Q = (e) => Array(Math.min(Math.max(0, Number(e)), 30)).fill(0).join(""), A = (e, t) => e.split(";").map((r) => /\.0?/.test(r) ? r.replace(/\.0*/g, `${t > 0 ? "." : ""}${Q(Number(t || 0))}`) : /0([^0]?)|0$/.test(r) ? r.replace(/0([^0]+)|0$/, `0${t > 0 ? "." : ""}${Q(Number(t || 0))}$1`) : r).join(";"), rt = (e) => /\.0?/.test(e) || /0([^0]?)|0$/.test(e), E = { id: "sheet.command.numfmt.set.numfmt", type: j.COMMAND, handler: (e, t) => {
  if (!t) return !1;
  let r = e.get(M), a = e.get(D), n = e.get(oe), s = W(a, t);
  if (!s) return !1;
  let { unitId: l, subUnitId: u, worksheet: h } = s, f = t.values.filter((o) => !!o.pattern), S = t.values.filter((o) => !o.pattern), y = xe(l, u, f), g = { unitId: l, subUnitId: u, ranges: S.map((o) => ({ startColumn: o.col, startRow: o.row, endColumn: o.col, endRow: o.row })) }, _ = [], m = [];
  if (f.length) {
    let o = f.reduce((d, c) => {
      J(c.pattern) && d.setValue(c.row, c.col, { t: $.STRING });
      let w = h.getCellRaw(c.row, c.col);
      if (w) {
        let V = K(w.v);
        V !== w.t && d.setValue(c.row, c.col, { t: V });
      }
      return d;
    }, new R()).getMatrix(), p = new R();
    new R(o).forValue((d, c) => {
      let w = h.getCellRaw(d, c);
      w ? p.setValue(d, c, { t: w.t }) : p.setValue(d, c, { t: void 0 });
    }), Object.keys(y.values).forEach((d) => {
      let c = y.values[d];
      c.ranges = G(c.ranges);
    }), _.push({ id: re.id, params: y });
    let v = Re(e, y);
    m.push(...v);
  }
  if (S.length) {
    g.ranges = G(g.ranges);
    let o = S.reduce((d, c) => {
      let w = h.getCellRaw(c.row, c.col);
      if (w) {
        let V = K(w.v);
        V !== w.t && d.setValue(c.row, c.col, { t: V });
      }
      return d;
    }, new R()).getMatrix(), p = new R();
    new R(o).forValue((d, c) => {
      let w = h.getCellRaw(d, c);
      w ? p.setValue(d, c, { t: w.t }) : p.setValue(d, c, { t: void 0 });
    }), _.push({ id: Ce.id, params: g }, { id: L.id, params: { unitId: l, subUnitId: u, cellValue: o } });
    let v = Ee(e, g);
    m.push({ id: L.id, params: { unitId: l, subUnitId: u, cellValue: p.getMatrix() } }, ...v);
  }
  let b = ie(_, r).result;
  return b && n.pushUndoRedo({ unitID: l, undoMutations: m, redoMutations: _ }), b;
} }, De = { id: "sheet.command.numfmt.add.decimal.command", type: j.COMMAND, handler: async (e) => {
  let t = e.get(M), r = e.get(P), a = e.get(H), n = e.get(D), s = r.getCurrentSelections();
  if (!s || !s.length) return !1;
  let l = W(n);
  if (!l) return !1;
  let { unitId: u, subUnitId: h } = l, f = 0;
  s.forEach((_) => {
    C.foreach(_.range, (m, b) => {
      let o = a.getValue(u, h, m, b);
      if (!o) {
        let v = l.worksheet.getCellRaw(m, b);
        if (!f && v && v.t === $.NUMBER && v.v) {
          let d = /\.(\d*)$/.exec(String(v.v));
          if (d) {
            let c = d[1].length;
            if (!c) return;
            f = Math.max(f, c);
          }
        }
        return;
      }
      let p = T(o.pattern);
      f = p > f ? p : f;
    });
  });
  let S = f + 1, y = A(`0${S > 0 ? ".0" : ""}`, S), g = [];
  return s.forEach((_) => {
    C.foreach(_.range, (m, b) => {
      let o = a.getValue(u, h, m, b);
      if (B(o == null ? void 0 : o.pattern)) g.push({ row: m, col: b, pattern: y });
      else {
        let p = T(o.pattern), v = A(o.pattern, p + 1);
        v !== o.pattern && g.push({ row: m, col: b, pattern: v });
      }
    });
  }), g.length ? await t.executeCommand(E.id, { values: g }) : !1;
} }, Pe = { id: "sheet.command.numfmt.set.currency", type: j.COMMAND, handler: async (e) => {
  let t = e.get(M), r = e.get(P), a = e.get(Y), n = r.getCurrentSelections();
  if (!n || !n.length) return !1;
  let s = [], l = je(Oe(a.getCurrentLocale()).locale);
  return n.forEach((u) => {
    C.foreach(u.range, (h, f) => {
      s.push({ row: h, col: f, pattern: l, type: "currency" });
    });
  }), await t.executeCommand(E.id, { values: s });
} }, Ke = { id: "sheet.command.numfmt.set.percent", type: j.COMMAND, handler: async (e) => {
  let t = e.get(M), r = e.get(P).getCurrentSelections();
  if (!r || !r.length) return !1;
  let a = [];
  return r.forEach((n) => {
    C.foreach(n.range, (s, l) => {
      a.push({ row: s, col: l, pattern: "0%", type: "percent" });
    });
  }), await t.executeCommand(E.id, { values: a });
} }, Le = { id: "sheet.command.numfmt.subtract.decimal.command", type: j.COMMAND, handler: async (e) => {
  let t = e.get(M), r = e.get(P), a = e.get(H), n = e.get(D), s = r.getCurrentSelections();
  if (!s || !s.length) return !1;
  let l = W(n);
  if (!l) return !1;
  let { unitId: u, subUnitId: h } = l, f = 0;
  s.forEach((_) => {
    C.foreach(_.range, (m, b) => {
      let o = a.getValue(u, h, m, b);
      if (!o) {
        let v = l.worksheet.getCellRaw(m, b);
        if (!f && v && v.t === $.NUMBER && v.v) {
          let d = /\.(\d*)$/.exec(String(v.v));
          if (d) {
            let c = d[1].length;
            if (!c) return;
            f = Math.max(f, c);
          }
        }
        return;
      }
      let p = T(o.pattern);
      f = p > f ? p : f;
    });
  });
  let S = f - 1, y = A(`0${S > 0 ? ".0" : "."}`, S), g = [];
  return s.forEach((_) => {
    C.foreach(_.range, (m, b) => {
      let o = a.getValue(u, h, m, b);
      if (B(o == null ? void 0 : o.pattern)) g.push({ row: m, col: b, pattern: y });
      else {
        let p = T(o.pattern);
        g.push({ row: m, col: b, pattern: A(o.pattern, p - 1) });
      }
    });
  }), await t.executeCommand(E.id, { values: g });
} }, Be = "sheets-numfmt.config", q = {}, at = (e) => ee(e).type || "unknown", He = (e, t, r = "en") => {
  try {
    let a = pe(e, t), n = a ? String(a) : void 0, s = ve(e, t, { locale: r, throws: !1 });
    return t < 0 ? { result: s, color: n } : { result: s };
  } catch (a) {
    console.warn("getPatternPreview error:", e, a);
  }
  return { result: String(t) };
}, We = (e, t, r) => e === _e ? { result: String(Ue(t)) } : He(e, t, r);
function k(e) {
  "@babel/helpers - typeof";
  return k = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(t) {
    return typeof t;
  } : function(t) {
    return t && typeof Symbol == "function" && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
  }, k(e);
}
function ze(e, t) {
  if (k(e) != "object" || !e) return e;
  var r = e[Symbol.toPrimitive];
  if (r !== void 0) {
    var a = r.call(e, t);
    if (k(a) != "object") return a;
    throw TypeError("@@toPrimitive must return a primitive value.");
  }
  return (t === "string" ? String : Number)(e);
}
function Ge(e) {
  var t = ze(e, "string");
  return k(t) == "symbol" ? t : t + "";
}
function U(e, t, r) {
  return (t = Ge(t)) in e ? Object.defineProperty(e, t, { value: r, enumerable: !0, configurable: !0, writable: !0 }) : e[t] = r, e;
}
function x(e, t) {
  return function(r, a) {
    t(r, a, e);
  };
}
function ne(e, t, r, a) {
  var n = arguments.length, s = n < 3 ? t : a === null ? a = Object.getOwnPropertyDescriptor(t, r) : a, l;
  if (typeof Reflect == "object" && typeof Reflect.decorate == "function") s = Reflect.decorate(e, t, r, a);
  else for (var u = e.length - 1; u >= 0; u--) (l = e[u]) && (s = (n < 3 ? l(s) : n > 3 ? l(t, r, s) : l(t, r)) || s);
  return n > 3 && s && Object.defineProperty(t, r, s), s;
}
const Ze = { tl: { size: 6, color: "#409f11" } };
let O = class extends ue {
  constructor(e, t, r, a, n, s, l) {
    super(), this._instanceService = e, this._sheetInterceptorService = t, this._themeService = r, this._commandService = a, this._numfmtService = n, this._localeService = s, this._configService = l, U(this, "_locale$", new ce("en")), U(this, "locale$", this._locale$.asObservable()), this._initInterceptorCellContent();
  }
  get locale() {
    let e = this._locale$.getValue();
    if (e) return e;
    switch (this._localeService.getCurrentLocale()) {
      case i.FR_FR:
        return "fr";
      case i.RU_RU:
        return "ru";
      case i.VI_VN:
        return "vi";
      case i.ZH_CN:
        return "zh-CN";
      case i.KO_KR:
        return "ko";
      case i.ZH_TW:
        return "zh-TW";
      case i.ES_ES:
      case i.CA_ES:
        return "es";
      case i.SK_SK:
        return "sk";
      case i.EN_US:
      case i.FA_IR:
      default:
        return "en";
    }
  }
  _initInterceptorCellContent() {
    let e = new R();
    this.disposeWithMe(fe(this._locale$, this._localeService.currentLocale$).subscribe(() => {
      e.reset();
    })), this.disposeWithMe(this._sheetInterceptorService.intercept(Me.CELL_CONTENT, { effect: z.Value | z.Style, handler: (t, r, a) => {
      if (!t || t.v === void 0 || t.v === null || t.t === $.BOOLEAN || t.t === $.FORCE_STRING) return a(t);
      let n = r.unitId, s = r.subUnitId, l;
      if (t != null && t.s) {
        let m = r.workbook.getStyles().get(t.s);
        m != null && m.n && (l = m.n);
      }
      if (l || (l = this._numfmtService.getValue(n, s, r.row, r.col)), B(l == null ? void 0 : l.pattern) || t.t !== $.NUMBER && K(t.v, t.t) !== $.NUMBER) return a(t);
      let u = t;
      if ((!t || t === r.rawData) && (t = { ...r.rawData }), J(l == null ? void 0 : l.pattern)) {
        var h;
        return (h = this._configService.getConfig("sheets-numfmt.config")) != null && h.disableTextFormatMark ? (t.t = $.STRING, a(t)) : (t.t = $.STRING, t.markers = { ...t == null ? void 0 : t.markers, ...Ze }, a(t));
      }
      let f = "", S = e.getValue(r.row, r.col);
      if (S && S.parameters === `${u.v}_${l == null ? void 0 : l.pattern}`) return a({ ...t, ...S.result });
      let y = We(l == null ? void 0 : l.pattern, Number(u.v), this.locale);
      if (f = y.result, !f) return a(t);
      let g = { v: f, t: $.NUMBER };
      if (y.color) {
        var _;
        let m = (_ = this._themeService.getColorFromTheme(`${y.color}.500`)) == null ? y.color : _;
        m && (g.interceptorStyle = { cl: { rgb: m } });
      }
      return e.setValue(r.row, r.col, { result: g, parameters: `${u.v}_${l == null ? void 0 : l.pattern}` }), Object.assign(t, g), a(t);
    }, priority: Ne.NUMFMT })), this.disposeWithMe(this._commandService.onCommandExecuted((t) => {
      if (t.id === re.id) {
        let r = t.params;
        Object.keys(r.values).forEach((a) => {
          r.values[a].ranges.forEach((n) => {
            C.foreach(n, (s, l) => {
              e.realDeleteValue(s, l);
            });
          });
        });
      } else if (t.id === L.id) {
        let r = t.params;
        new R(r.cellValue).forValue((a, n) => {
          e.realDeleteValue(a, n);
        });
      }
    })), this.disposeWithMe(this._instanceService.getCurrentTypeOfUnit$(X.UNIVER_SHEET).pipe(Ie((t) => {
      var r;
      return (r = t == null ? void 0 : t.activeSheet$) == null ? Se(null) : r;
    }), me(1)).subscribe(() => e.reset()));
  }
  setNumfmtLocal(e) {
    this._locale$.next(e);
  }
};
O = ne([x(0, D), x(1, I(ke)), x(2, I(we)), x(3, I(M)), x(4, I(H)), x(5, I(Y)), x(6, te)], O);
var Qe = "@univerjs/sheets-numfmt", qe = "0.19.0";
let N = class extends de {
  constructor(e = q, t, r, a) {
    super(), this._config = e, this._injector = t, this._configService = r, this._commandService = a;
    let { ...n } = he({}, q, this._config);
    this._configService.setConfig(Be, n);
  }
  onStarting() {
    ge(this._injector, [[O]]), be(this._injector, [[O]]), [De, Le, Pe, Ke, E].forEach((e) => {
      this.disposeWithMe(this._commandService.registerCommand(e));
    });
  }
};
U(N, "pluginName", "SHEET_NUMFMT_PLUGIN"), U(N, "packageName", Qe), U(N, "version", qe), U(N, "type", X.UNIVER_SHEET), N = ne([ye(Ve), x(1, I($e)), x(2, te), x(3, M)], N);
const lt = (e) => se.find((t) => e.includes(t)), st = () => se.map((e) => ({ label: e, value: e })), nt = (e) => Ae.map((t) => ({ label: t.label(e), value: t.suffix(e), color: t.color })), ot = () => Fe.map((e) => ({ label: e.label, value: e.suffix })), it = () => Te.map((e) => ({ label: e.label, value: e.suffix, color: e.color }));
var Ye = class extends ae {
  setNumberFormat(e) {
    let t = [], { startColumn: r, startRow: a, endColumn: n, endRow: s } = this._range;
    for (let l = a; l <= s; l++) for (let u = r; u <= n; u++) t.push({ row: l, col: u, pattern: e });
    return this._commandService.syncExecuteCommand(E.id, { unitId: this._workbook.getUnitId(), subUnitId: this._worksheet.getSheetId(), values: t }), this;
  }
  setNumberFormats(e) {
    let t = [], { startColumn: r, startRow: a, endColumn: n, endRow: s } = this._range;
    for (let u = a; u <= s; u++) for (let h = r; h <= n; h++) {
      var l;
      let f = (l = e[u - a]) == null ? void 0 : l[h - r];
      t.push({ row: u, col: h, pattern: f });
    }
    return this._commandService.syncExecuteCommand(E.id, { unitId: this._workbook.getUnitId(), subUnitId: this._worksheet.getSheetId(), values: t }), this;
  }
  getNumberFormat() {
    var e, t;
    let r = this.getCellStyle();
    return (e = r == null || (t = r.numberFormat) == null ? void 0 : t.pattern) == null ? "" : e;
  }
  getNumberFormats() {
    return this.getCellStyles().map((e) => e.map((t) => {
      var r, a;
      return (r = t == null || (a = t.numberFormat) == null ? void 0 : a.pattern) == null ? "" : r;
    }));
  }
};
ae.extend(Ye);
var Je = class extends le {
  setNumfmtLocal(e) {
    return this._injector.get(O).setNumfmtLocal(e), this;
  }
};
le.extend(Je);
const ut = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" }));
export {
  N as $,
  F as A,
  E as B,
  st as D,
  lt as E,
  Te as F,
  Be as G,
  Pe as H,
  Ae as I,
  We as J,
  T as L,
  Z as M,
  je as N,
  nt as O,
  Fe as P,
  O as Q,
  Q as R,
  Ke as U,
  De as V,
  Le as W,
  it as a,
  se as b,
  ut as f,
  Oe as j,
  ot as k,
  He as q,
  rt as v,
  at as y,
  A as z
};
