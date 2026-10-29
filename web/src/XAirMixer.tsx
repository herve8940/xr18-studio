import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from "react";
import {
  bandResponse, clamp01, dbToFader, EQ_TYPES, faderToDb, formatDb, formatHz, formatMs, lin, linInv, logInv, logMap,
  qFromWire, qToWire, RATIOS, stripColor, stripInverted,
} from "./xairMath";
import "./xair-mixer.css";

type Value = number | string;
type Values = Record<string, Value>;
type Kind = "ch" | "aux" | "fxrtn" | "bus" | "fxsend" | "lr" | "dca";
interface Strip { id: string; kind: Kind; prefix: string; short: string; fallback: string; meters: number[] }
const pad = (n: number) => String(n).padStart(2, "0");

/** /meters/1: ch1-16, aux L/R, fx returns L/R, bus 1-6, fx sends 1-4, main L/R, monitor L/R. */
const INPUTS: Strip[] = [
  ...Array.from({ length: 16 }, (_, i): Strip => ({ id: `ch${i + 1}`, kind: "ch", prefix: `/ch/${pad(i + 1)}`, short: String(i + 1), fallback: `Ch ${pad(i + 1)}`, meters: [i] })),
  { id: "aux", kind: "aux", prefix: "/rtn/aux", short: "AUX", fallback: "Aux In", meters: [16, 17] },
  ...Array.from({ length: 4 }, (_, i): Strip => ({ id: `rtn${i + 1}`, kind: "fxrtn", prefix: `/rtn/${i + 1}`, short: `FX${i + 1}`, fallback: `Retour FX ${i + 1}`, meters: [18 + i * 2, 19 + i * 2] })),
];
const OUTPUTS: Strip[] = [
  ...Array.from({ length: 6 }, (_, i): Strip => ({ id: `bus${i + 1}`, kind: "bus", prefix: `/bus/${i + 1}`, short: `BUS${i + 1}`, fallback: `Bus ${i + 1}`, meters: [26 + i] })),
  ...Array.from({ length: 4 }, (_, i): Strip => ({ id: `fxs${i + 1}`, kind: "fxsend", prefix: `/fxsend/${i + 1}`, short: `FXS${i + 1}`, fallback: `Envoi FX ${i + 1}`, meters: [32 + i] })),
  ...Array.from({ length: 4 }, (_, i): Strip => ({ id: `dca${i + 1}`, kind: "dca", prefix: `/dca/${i + 1}`, short: `DCA${i + 1}`, fallback: `DCA ${i + 1}`, meters: [] })),
];
const MAIN: Strip = { id: "lr", kind: "lr", prefix: "/lr", short: "LR", fallback: "Main LR", meters: [36, 37] };
const ALL = [...INPUTS, ...OUTPUTS, MAIN];

/** "Sends on fader" layers, like the X-AIR Edit mix selector. 0 = Main LR, 1-6 bus, 7-10 FX. */
const LAYERS = [{ id: 0, label: "Main LR" }, ...Array.from({ length: 6 }, (_, i) => ({ id: i + 1, label: `Bus ${i + 1}` })), ...Array.from({ length: 4 }, (_, i) => ({ id: i + 7, label: `FX ${i + 1}` }))];
const layerMaster = (layer: number) => layer === 0 ? MAIN : layer <= 6 ? OUTPUTS[layer - 1]! : OUTPUTS[6 + layer - 7]!;

// ---------- meters: external store so only meter widgets re-render at ~20 fps ----------
const meterStore = (() => {
  let levels: number[] = []; let at = 0; const listeners = new Set<() => void>();
  return {
    set(next: number[]) { levels = next; at = Date.now(); listeners.forEach(l => l()); },
    get: () => levels, fresh: () => Date.now() - at < 2000,
    subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
  };
})();

function Meter({ indexes }: { indexes: number[] }) {
  const levels = useSyncExternalStore(meterStore.subscribe, meterStore.get);
  const peaks = useRef<{ value: number; at: number }[]>([]);
  if (!indexes.length) return <div className="xm-meter none" />;
  const fresh = meterStore.fresh();
  return <div className="xm-meter">{indexes.map((index, i) => {
    const db = fresh ? levels[index] ?? -128 : -128;
    const pos = Math.max(0, Math.min(1, (db + 60) / 60));
    const peak = peaks.current[i];
    if (!peak || db > peak.value || Date.now() - peak.at > 1500) peaks.current[i] = { value: db, at: Date.now() };
    const peakPos = Math.max(0, Math.min(1, (peaks.current[i]!.value + 60) / 60));
    return <div key={index} className="xm-meter-bar" title={`${db.toFixed(1)} dBFS`}>
      <div className="xm-meter-fill" style={{ clipPath: `inset(${(1 - pos) * 100}% 0 0 0)` }} />
      {peakPos > 0 && <div className="xm-meter-peak" style={{ bottom: `${peakPos * 100}%` }} />}
      {db > -0.5 && <div className="xm-meter-clip" />}
    </div>;
  })}</div>;
}

// ---------- generic controls ----------
const FADER_MARKS = [10, 5, 0, -5, -10, -20, -30, -40, -50, -60];
function Fader({ value, onChange, disabled, label, reset = .75 }: { value: number; onChange: (v: number) => void; disabled?: boolean; label: string; reset?: number }) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; v: number } | null>(null);
  const move = (e: ReactPointerEvent) => {
    if (!drag.current || !track.current) return;
    const h = track.current.clientHeight, scale = e.shiftKey ? .15 : 1;
    onChange(clamp01(drag.current.v + (drag.current.y - e.clientY) / h * scale));
  };
  return <div className={disabled ? "xm-fader disabled" : "xm-fader"} role="slider" aria-label={label} aria-valuemin={0} aria-valuemax={1} aria-valuenow={value}
    aria-valuetext={`${formatDb(faderToDb(value))} dB`} tabIndex={disabled ? -1 : 0}
    onKeyDown={e => { if (disabled) return; const step = e.shiftKey ? .002 : .01; if (e.key === "ArrowUp") { e.preventDefault(); onChange(clamp01(value + step)); } if (e.key === "ArrowDown") { e.preventDefault(); onChange(clamp01(value - step)); } }}
    onWheel={e => { if (!disabled) onChange(clamp01(value - Math.sign(e.deltaY) * (e.shiftKey ? .002 : .01))); }}
    onDoubleClick={() => { if (!disabled) onChange(reset); }}>
    <div className="xm-fader-scale">{FADER_MARKS.map(db => <span key={db} style={{ bottom: `${dbToFader(db) * 100}%` }}>{db > 0 ? `+${db}` : db}</span>)}<span style={{ bottom: 0 }}>-∞</span></div>
    <div className="xm-fader-track" ref={track}
      onPointerDown={e => {
        if (disabled || !track.current) return;
        const rect = track.current.getBoundingClientRect(), capY = rect.bottom - value * rect.height;
        // Clicking away from the cap jumps there, like X-AIR Edit; grabbing the cap keeps relative motion.
        const v = Math.abs(e.clientY - capY) > 14 ? clamp01((rect.bottom - e.clientY) / rect.height) : value;
        if (v !== value) onChange(v);
        drag.current = { y: e.clientY, v }; e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      <div className="xm-fader-slot" />
      <div className="xm-fader-zero" style={{ bottom: `${dbToFader(0) * 100}%` }} />
      <div className="xm-fader-cap" style={{ bottom: `${value * 100}%` }} />
    </div>
  </div>;
}

function Knob({ value, onChange, label, display, disabled, reset, size = 38, bipolar = false }: { value: number; onChange: (v: number) => void; label: string; display: string; disabled?: boolean; reset?: number; size?: number; bipolar?: boolean }) {
  const drag = useRef<{ y: number; v: number } | null>(null);
  const r = size / 2 - 4, c = size / 2, a0 = -225, a1 = 45;
  const angle = (v: number) => (a0 + (a1 - a0) * v) * Math.PI / 180;
  const point = (v: number) => [c + r * Math.cos(angle(v)), c + r * Math.sin(angle(v))] as const;
  const arc = (from: number, to: number) => { const [x0, y0] = point(from), [x1, y1] = point(to); return `M${x0} ${y0} A${r} ${r} 0 ${Math.abs(to - from) * 270 > 180 ? 1 : 0} 1 ${x1} ${y1}`; };
  const start = bipolar ? .5 : 0, [px, py] = point(value);
  return <div className={disabled ? "xm-knob disabled" : "xm-knob"} title={`${label} : ${display} (double-clic : valeur par défaut)`}>
    <svg width={size} height={size} role="slider" aria-label={label} aria-valuetext={display} tabIndex={disabled ? -1 : 0}
      onKeyDown={e => { if (disabled) return; if (e.key === "ArrowUp" || e.key === "ArrowRight") { e.preventDefault(); onChange(clamp01(value + .01)); } if (e.key === "ArrowDown" || e.key === "ArrowLeft") { e.preventDefault(); onChange(clamp01(value - .01)); } }}
      onPointerDown={e => { if (disabled) return; drag.current = { y: e.clientY, v: value }; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={e => { if (!drag.current) return; onChange(clamp01(drag.current.v + (drag.current.y - e.clientY) / (e.shiftKey ? 800 : 160))); }}
      onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}
      onWheel={e => { if (!disabled) onChange(clamp01(value - Math.sign(e.deltaY) * (e.shiftKey ? .002 : .01))); }}
      onDoubleClick={() => { if (!disabled && reset !== undefined) onChange(reset); }}>
      <path d={arc(0, 1)} className="xm-knob-bg" />
      {Math.abs(value - start) > .002 && <path d={value > start ? arc(start, value) : arc(value, start)} className="xm-knob-val" />}
      <circle cx={c} cy={c} r={r - 5} className="xm-knob-body" />
      <line x1={c} y1={c} x2={c + (px - c) * .62} y2={c + (py - c) * .62} className="xm-knob-dot" />
    </svg>
    <small>{label}</small><b>{display}</b>
  </div>;
}

function Toggle({ on, onClick, children, tone = "blue", disabled, title }: { on: boolean; onClick: () => void; children: React.ReactNode; tone?: "red" | "yellow" | "blue" | "green"; disabled?: boolean; title?: string }) {
  return <button type="button" title={title} aria-pressed={on} disabled={disabled} className={`xm-toggle ${tone}${on ? " on" : ""}`} onClick={onClick}>{children}</button>;
}

// ---------- live connection ----------
function useLiveMixer() {
  const [values, setValues] = useState<Values>({});
  const [online, setOnline] = useState(false);
  const [error, setError] = useState("");
  const ws = useRef<WebSocket | null>(null);
  const touched = useRef(new Map<string, number>());
  const queue = useRef(new Map<string, Value>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    let closed = false, retry: ReturnType<typeof setTimeout> | undefined;
    const connect = () => {
      const socket = new WebSocket(`${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws`);
      ws.current = socket;
      socket.onopen = () => setOnline(true);
      socket.onclose = () => { setOnline(false); if (!closed) retry = setTimeout(connect, 1500); };
      socket.onmessage = event => {
        const m = JSON.parse(event.data);
        if (m.type === "snapshot") {
          const next: Values = {};
          for (const [address, state] of Object.entries(m.parameters ?? {})) next[address] = (state as { value: Value }).value;
          setValues(next);
          if (m.meters?.all) meterStore.set(m.meters.all);
          // Ask for a full pull when the cache is thin (fresh start, simulation).
          if (Object.keys(next).length < 2000) socket.send(JSON.stringify({ type: "sync" }));
        } else if (m.type === "parameter") {
          const { address, value } = m.state as { address: string; value: Value };
          // While the user is moving a control, ignore echoes of older positions.
          if (Date.now() - (touched.current.get(address) ?? 0) < 400) return;
          setValues(v => v[address] === value ? v : { ...v, [address]: value });
        } else if (m.type === "meters") {
          if (m.state?.all) meterStore.set(m.state.all);
        } else if (m.type === "live-error") {
          setError(m.error); if (m.address) touched.current.delete(m.address);
        }
      };
    };
    connect();
    return () => { closed = true; if (retry) clearTimeout(retry); ws.current?.close(); };
  }, []);

  /** Show the value at once; send at most every 40 ms per control (last value always sent). */
  const set = useCallback((address: string, value: Value) => {
    touched.current.set(address, Date.now());
    setValues(v => ({ ...v, [address]: value }));
    queue.current.set(address, value);
    if (timers.current.has(address)) return;
    const flush = () => {
      const pending = queue.current.get(address);
      if (pending === undefined) { timers.current.delete(address); return; }
      queue.current.delete(address);
      if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify({ type: "set", address, value: pending }));
      timers.current.set(address, setTimeout(flush, 40));
    };
    flush();
  }, []);
  return { values, set, online, error, clearError: () => setError("") };
}

// ---------- strip ----------
interface StripProps { strip: Strip; values: Values; set: (a: string, v: Value) => void; layer: number; selected: boolean; onSelect: () => void; canWrite: boolean; master?: boolean }
function gainAddress(strip: Strip, values: Values) {
  if (strip.kind === "aux" || strip.kind === "fxrtn") return { address: `${strip.prefix}/preamp/rtntrim`, lo: -18, hi: 18, label: "Trim" };
  if (strip.kind !== "ch") return null;
  const usb = values[`${strip.prefix}/preamp/rtnsw`] === 1, source = Number(values[`${strip.prefix}/config/insrc`] ?? strip.meters[0]);
  if (usb) return { address: `${strip.prefix}/preamp/rtntrim`, lo: -18, hi: 18, label: "Trim USB" };
  if (source >= 0 && source < 16) return { address: `/headamp/${pad(source + 1)}/gain`, lo: -12, hi: 60, label: `Gain IN${source + 1}` };
  return null;
}
function stripName(strip: Strip, values: Values) { const n = values[`${strip.prefix}/config/name`]; return typeof n === "string" && n.trim() ? n : strip.fallback; }

function ChannelStrip({ strip, values, set, layer, selected, onSelect, canWrite, master }: StripProps) {
  const isInput = strip.kind === "ch" || strip.kind === "aux" || strip.kind === "fxrtn";
  const sendLayer = isInput && layer > 0;
  const faderAddress = strip.kind === "dca" ? `${strip.prefix}/fader` : sendLayer ? `${strip.prefix}/mix/${pad(layer)}/level` : `${strip.prefix}/mix/fader`;
  const onAddress = strip.kind === "dca" ? `${strip.prefix}/on` : `${strip.prefix}/mix/on`;
  const fader = Number(values[faderAddress] ?? 0), on = Number(values[onAddress] ?? 1) === 1;
  const color = Number(values[`${strip.prefix}/config/color`] ?? 0);
  const gain = gainAddress(strip, values);
  const panAddress = `${strip.prefix}/mix/pan`, hasPan = !sendLayer && (isInput || strip.kind === "bus" || strip.kind === "lr");
  const pan = Number(values[panAddress] ?? .5);
  const solo = strip.kind === "ch" ? `/-stat/solosw/${pad(Number(strip.short))}` : null;
  const lrAddress = `${strip.prefix}/mix/lr`, hasLr = isInput || strip.kind === "bus";
  const db = faderToDb(fader);
  return <div className={`xm-strip${selected ? " selected" : ""}${master ? " master" : ""}${on ? "" : " muted"}`} style={{ "--strip": stripColor(color) } as React.CSSProperties}>
    <button type="button" className={`xm-scribble${stripInverted(color) ? " inverted" : ""}`} onClick={onSelect} title="Sélectionner (EQ, dynamique, envois)">
      <span>{strip.short}</span><b>{stripName(strip, values)}</b>
    </button>
    <div className="xm-strip-knobs">
      {gain ? <Knob size={34} label={gain.label} disabled={!canWrite} value={Number(values[gain.address] ?? linInv(0, gain.lo, gain.hi))} reset={linInv(0, gain.lo, gain.hi)}
        display={`${lin(Number(values[gain.address] ?? linInv(0, gain.lo, gain.hi)), gain.lo, gain.hi).toFixed(1)}`} onChange={v => set(gain.address, v)} /> : <div className="xm-knob placeholder" />}
      {hasPan ? <Knob size={34} bipolar label="Pan" disabled={!canWrite} value={pan} reset={.5} display={Math.abs(pan - .5) < .005 ? "C" : `${pan < .5 ? "L" : "R"}${Math.round(Math.abs(pan - .5) * 200)}`} onChange={v => set(panAddress, v)} />
        : <div className="xm-knob placeholder"><small>{sendLayer ? LAYERS[layer]!.label : ""}</small></div>}
    </div>
    <div className="xm-strip-buttons">
      <Toggle tone="red" on={!on} disabled={!canWrite} onClick={() => set(onAddress, on ? 0 : 1)} title="Mute">M</Toggle>
      {solo ? <Toggle tone="yellow" on={values[solo] === 1} disabled={!canWrite} onClick={() => set(solo, values[solo] === 1 ? 0 : 1)} title="Solo (PFL/AFL selon la console)">S</Toggle> : <span />}
      {hasLr && !sendLayer ? <Toggle tone="green" on={Number(values[lrAddress] ?? 1) === 1} disabled={!canWrite} onClick={() => set(lrAddress, Number(values[lrAddress] ?? 1) === 1 ? 0 : 1)} title="Affectation au Main LR">LR</Toggle> : <span />}
    </div>
    <div className="xm-strip-fader">
      <Fader label={`Fader ${stripName(strip, values)}`} value={fader} disabled={!canWrite} reset={sendLayer ? 0 : .75} onChange={v => set(faderAddress, v)} />
      <Meter indexes={strip.meters} />
    </div>
    <div className="xm-strip-db">{formatDb(db)}<small>dB</small></div>
  </div>;
}

// ---------- EQ editor ----------
const EQ_W = 1000, EQ_H = 260, F_LO = 20, F_HI = 20000;
const xOf = (f: number) => logInv(f, F_LO, F_HI) * EQ_W;
const yOf = (db: number) => EQ_H / 2 - db / 18 * (EQ_H / 2);
const BAND_COLORS = ["#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#a855f7"];

function EqEditor({ prefix, values, set, canWrite, bands, hasHpf }: { prefix: string; values: Values; set: (a: string, v: Value) => void; canWrite: boolean; bands: number; hasHpf: boolean }) {
  const svg = useRef<SVGSVGElement>(null);
  const [active, setActive] = useState(0);
  const drag = useRef<number | null>(null);
  const eqOn = Number(values[`${prefix}/eq/on`] ?? 1) === 1;
  const band = (n: number) => {
    const b = `${prefix}/eq/${n}`;
    return {
      type: Number(values[`${b}/type`] ?? 2),
      f: logMap(Number(values[`${b}/f`] ?? (n - .5) / bands), F_LO, F_HI),
      g: lin(Number(values[`${b}/g`] ?? .5), -15, 15),
      q: qFromWire(Number(values[`${b}/q`] ?? .5)),
    };
  };
  const list = Array.from({ length: bands }, (_, i) => band(i + 1));
  const hpfOn = hasHpf && Number(values[`${prefix}/preamp/hpon`] ?? 0) === 1;
  const hpf = logMap(Number(values[`${prefix}/preamp/hpf`] ?? 0), 20, 400);
  const curve = useMemo(() => {
    const points: string[] = [];
    for (let i = 0; i <= 160; i++) {
      const f = logMap(i / 160, F_LO, F_HI);
      let db = hpfOn ? bandResponse(0, hpf, 0, .707, f) : 0;
      if (eqOn) for (const b of list) db += bandResponse(b.type, b.f, b.g, b.q, f);
      points.push(`${(i / 160 * EQ_W).toFixed(1)},${yOf(Math.max(-18, Math.min(18, db))).toFixed(1)}`);
    }
    return points.join(" ");
  }, [JSON.stringify(list), eqOn, hpfOn, hpf]);
  const fromEvent = (e: ReactPointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    return { f: logMap(clamp01((e.clientX - r.left) / r.width), F_LO, F_HI), g: Math.max(-15, Math.min(15, (EQ_H / 2 - (e.clientY - r.top) / r.height * EQ_H) / (EQ_H / 2) * 18)) };
  };
  const current = list[active]!, base = `${prefix}/eq/${active + 1}`, cut = current.type === 0 || current.type === 5;
  return <div className="xm-eq">
    <div className="xm-eq-head">
      <Toggle tone="green" on={eqOn} disabled={!canWrite} onClick={() => set(`${prefix}/eq/on`, eqOn ? 0 : 1)}>EQ</Toggle>
      {hasHpf && <Toggle tone="green" on={hpfOn} disabled={!canWrite} onClick={() => set(`${prefix}/preamp/hpon`, hpfOn ? 0 : 1)}>Coupe-bas {formatHz(hpf)} Hz</Toggle>}
      <span className="xm-hint">Glisser un point : fréquence + gain · molette : largeur (Q)</span>
    </div>
    <svg ref={svg} className={eqOn ? "xm-eq-graph" : "xm-eq-graph off"} viewBox={`0 0 ${EQ_W} ${EQ_H}`}
      onPointerMove={e => {
        if (drag.current === null || !canWrite) return;
        const { f, g } = fromEvent(e), b = `${prefix}/eq/${drag.current + 1}`, t = list[drag.current]!.type;
        set(`${b}/f`, clamp01(logInv(f, F_LO, F_HI)));
        if (t !== 0 && t !== 5) set(`${b}/g`, clamp01(linInv(Math.round(g * 4) / 4, -15, 15)));
      }}
      onPointerUp={() => { drag.current = null; }} onPointerLeave={() => { drag.current = null; }}>
      {[50, 100, 200, 500, 1000, 2000, 5000, 10000].map(f => <g key={f}><line x1={xOf(f)} x2={xOf(f)} y1={0} y2={EQ_H} className="xm-grid" /><text x={xOf(f) + 3} y={EQ_H - 4} className="xm-grid-label">{formatHz(f)}</text></g>)}
      {[-12, -6, 0, 6, 12].map(d => <g key={d}><line x1={0} x2={EQ_W} y1={yOf(d)} y2={yOf(d)} className={d === 0 ? "xm-grid zero" : "xm-grid"} /><text x={4} y={yOf(d) - 3} className="xm-grid-label">{d > 0 ? `+${d}` : d}</text></g>)}
      <polyline points={`0,${EQ_H / 2} ${curve} ${EQ_W},${EQ_H / 2}`} className="xm-eq-fill" />
      <polyline points={curve} className="xm-eq-curve" />
      {list.map((b, i) => <circle key={i} cx={xOf(b.f)} cy={yOf(b.type === 0 || b.type === 5 ? 0 : b.g)} r={i === active ? 9 : 7} fill={BAND_COLORS[i]} className="xm-eq-node"
        onPointerDown={e => { setActive(i); if (!canWrite) return; drag.current = i; (e.currentTarget.ownerSVGElement as SVGSVGElement).setPointerCapture(e.pointerId); }}
        onWheel={e => { if (canWrite) set(`${prefix}/eq/${i + 1}/q`, clamp01(qToWire(b.q) + Math.sign(e.deltaY) * .03)); }} />)}
    </svg>
    <div className="xm-eq-bands">
      {list.map((b, i) => <button type="button" key={i} className={i === active ? "active" : ""} style={{ "--band": BAND_COLORS[i] } as React.CSSProperties} onClick={() => setActive(i)}>
        <b>Bande {i + 1}</b><span>{EQ_TYPES[b.type]} · {formatHz(b.f)} Hz{b.type === 0 || b.type === 5 ? "" : ` · ${b.g > 0 ? "+" : ""}${b.g.toFixed(1)} dB`}</span></button>)}
    </div>
    <div className="xm-row">
      <label className="xm-select">Type<select disabled={!canWrite} value={current.type} onChange={e => set(`${base}/type`, Number(e.target.value))}>{EQ_TYPES.map((t, i) => <option key={t} value={i}>{t}</option>)}</select></label>
      <Knob label="Fréq. Hz" disabled={!canWrite} value={logInv(current.f, F_LO, F_HI)} display={formatHz(current.f)} onChange={v => set(`${base}/f`, v)} />
      <Knob label="Gain dB" bipolar disabled={!canWrite || cut} value={linInv(current.g, -15, 15)} reset={.5} display={current.g.toFixed(1)} onChange={v => set(`${base}/g`, v)} />
      <Knob label="Q" disabled={!canWrite || cut} value={qToWire(current.q)} display={current.q.toFixed(1)} onChange={v => set(`${base}/q`, v)} />
      {hasHpf && <Knob label="Coupe-bas" disabled={!canWrite} value={logInv(hpf, 20, 400)} display={`${formatHz(hpf)} Hz`} onChange={v => set(`${prefix}/preamp/hpf`, v)} />}
    </div>
  </div>;
}

// ---------- dynamics ----------
function Dynamics({ prefix, values, set, canWrite, gate }: { prefix: string; values: Values; set: (a: string, v: Value) => void; canWrite: boolean; gate: boolean }) {
  const v = (leaf: string, fallback = 0) => Number(values[`${prefix}/${leaf}`] ?? fallback);
  const dynOn = v("dyn/on") === 1, gateOn = v("gate/on") === 1;
  const thr = lin(v("dyn/thr", 1), -60, 0), ratio = Number(RATIOS[v("dyn/ratio", 6)] ?? 4), knee = lin(v("dyn/knee"), 0, 5), mgain = lin(v("dyn/mgain"), 0, 24);
  // Static transfer curve (input dB -> output dB) for the compressor.
  const transfer = Array.from({ length: 61 }, (_, i) => {
    const input = -60 + i;
    const over = input - thr;
    const out = over <= -knee / 2 ? input : over >= knee / 2 ? thr + over / ratio : input + (1 / ratio - 1) * Math.pow(over + knee / 2, 2) / (2 * Math.max(knee, .001));
    return `${(i / 60) * 120},${120 - Math.max(0, Math.min(120, (out + mgain + 60) / 60 * 120))}`;
  }).join(" ");
  return <div className="xm-dyn">
    {gate && <section>
      <header><Toggle tone="green" on={gateOn} disabled={!canWrite} onClick={() => set(`${prefix}/gate/on`, gateOn ? 0 : 1)}>Gate</Toggle>
        <label className="xm-select">Mode<select disabled={!canWrite} value={v("gate/mode")} onChange={e => set(`${prefix}/gate/mode`, Number(e.target.value))}>{["GATE", "EXP2", "EXP3", "EXP4", "DUCK"].map((m, i) => <option key={m} value={i}>{m}</option>)}</select></label></header>
      <div className="xm-row">
        <Knob label="Seuil dB" disabled={!canWrite} value={v("gate/thr")} display={lin(v("gate/thr"), -80, 0).toFixed(1)} onChange={x => set(`${prefix}/gate/thr`, x)} />
        <Knob label="Plage dB" disabled={!canWrite} value={v("gate/range")} display={lin(v("gate/range"), 3, 60).toFixed(0)} onChange={x => set(`${prefix}/gate/range`, x)} />
        <Knob label="Attaque ms" disabled={!canWrite} value={v("gate/attack")} display={lin(v("gate/attack"), 0, 120).toFixed(0)} onChange={x => set(`${prefix}/gate/attack`, x)} />
        <Knob label="Maintien ms" disabled={!canWrite} value={v("gate/hold")} display={formatMs(logMap(v("gate/hold"), .02, 2000))} onChange={x => set(`${prefix}/gate/hold`, x)} />
        <Knob label="Relâch. ms" disabled={!canWrite} value={v("gate/release")} display={formatMs(logMap(v("gate/release"), 5, 4000))} onChange={x => set(`${prefix}/gate/release`, x)} />
      </div>
    </section>}
    <section>
      <header><Toggle tone="green" on={dynOn} disabled={!canWrite} onClick={() => set(`${prefix}/dyn/on`, dynOn ? 0 : 1)}>Compresseur</Toggle>
        <label className="xm-select">Ratio<select disabled={!canWrite} value={v("dyn/ratio", 6)} onChange={e => set(`${prefix}/dyn/ratio`, Number(e.target.value))}>{RATIOS.map((r, i) => <option key={r} value={i}>{r}:1</option>)}</select></label>
        <label className="xm-select">Mode<select disabled={!canWrite} value={v("dyn/mode")} onChange={e => set(`${prefix}/dyn/mode`, Number(e.target.value))}><option value={0}>COMP</option><option value={1}>EXP</option></select></label></header>
      <div className="xm-row">
        <svg className="xm-transfer" viewBox="0 0 120 120"><line x1={0} y1={120} x2={120} y2={0} className="xm-grid" /><polyline points={transfer} className="xm-eq-curve" /></svg>
        <Knob label="Seuil dB" disabled={!canWrite} value={v("dyn/thr", 1)} display={thr.toFixed(1)} onChange={x => set(`${prefix}/dyn/thr`, x)} />
        <Knob label="Knee" disabled={!canWrite} value={v("dyn/knee")} display={knee.toFixed(0)} onChange={x => set(`${prefix}/dyn/knee`, x)} />
        <Knob label="Gain dB" disabled={!canWrite} value={v("dyn/mgain")} display={mgain.toFixed(1)} onChange={x => set(`${prefix}/dyn/mgain`, x)} />
        <Knob label="Attaque ms" disabled={!canWrite} value={v("dyn/attack")} display={lin(v("dyn/attack"), 0, 120).toFixed(0)} onChange={x => set(`${prefix}/dyn/attack`, x)} />
        <Knob label="Relâch. ms" disabled={!canWrite} value={v("dyn/release")} display={formatMs(logMap(v("dyn/release"), 5, 4000))} onChange={x => set(`${prefix}/dyn/release`, x)} />
        <Knob label="Mix %" disabled={!canWrite} value={v("dyn/mix", 1)} display={lin(v("dyn/mix", 1), 0, 100).toFixed(0)} onChange={x => set(`${prefix}/dyn/mix`, x)} />
      </div>
    </section>
  </div>;
}

// ---------- sends ----------
function Sends({ strip, values, set, canWrite }: { strip: Strip; values: Values; set: (a: string, v: Value) => void; canWrite: boolean }) {
  const name = (s: Strip) => stripName(s, values);
  return <div className="xm-sends">{LAYERS.slice(1).map(layer => {
    const address = `${strip.prefix}/mix/${pad(layer.id)}/level`, value = Number(values[address] ?? 0);
    const tap = Number(values[`${strip.prefix}/mix/${pad(layer.id)}/tap`] ?? 3);
    return <div key={layer.id} className="xm-send">
      <span>{name(layerMaster(layer.id))}</span>
      <input type="range" min={0} max={1} step={.001} value={value} disabled={!canWrite} aria-label={`Envoi vers ${name(layerMaster(layer.id))}`}
        onChange={e => set(address, Number(e.target.value))} onDoubleClick={() => set(address, .75)} />
      <b>{formatDb(faderToDb(value))} dB</b>
      <select disabled={!canWrite} value={tap} aria-label="Point de prélèvement" onChange={e => set(`${strip.prefix}/mix/${pad(layer.id)}/tap`, Number(e.target.value))}>
        {["IN", "PRE EQ", "POST EQ", "PRE", "POST", "GRP"].map((t, i) => <option key={t} value={i}>{t}</option>)}</select>
    </div>;
  })}</div>;
}

// ---------- main view ----------
export function XAirMixer({ canWrite, selectedChannel, onSelectChannel }: { canWrite: boolean; selectedChannel?: number; onSelectChannel?: (n: number) => void }) {
  const { values, set, online, error, clearError } = useLiveMixer();
  const [layer, setLayer] = useState(0);
  const [view, setView] = useState<"inputs" | "outputs">("inputs");
  const [selectedId, setSelectedId] = useState(selectedChannel ? `ch${selectedChannel}` : "ch1");
  const [detail, setDetail] = useState<"eq" | "dyn" | "sends">("eq");
  useEffect(() => { if (selectedChannel) setSelectedId(`ch${selectedChannel}`); }, [selectedChannel]);
  const selected = ALL.find(s => s.id === selectedId) ?? INPUTS[0]!;
  const select = (strip: Strip) => { setSelectedId(strip.id); if (strip.kind === "ch") onSelectChannel?.(Number(strip.short)); };
  const writable = canWrite && online;
  const strips = view === "inputs" ? INPUTS : OUTPUTS;
  const masterStrip = view === "inputs" ? layerMaster(layer) : MAIN;
  const hasEq = selected.kind !== "fxsend" && selected.kind !== "dca";
  const hasDyn = selected.kind === "ch" || selected.kind === "bus" || selected.kind === "lr";
  const hasSends = selected.kind === "ch" || selected.kind === "aux" || selected.kind === "fxrtn";
  const tab = (detail === "dyn" && !hasDyn) || (detail === "sends" && !hasSends) || (detail === "eq" && !hasEq) ? (hasEq ? "eq" : null) : detail;
  return <section className="xm">
    <div className="xm-toolbar">
      <div className="xm-views">
        <button type="button" className={view === "inputs" ? "active" : ""} onClick={() => setView("inputs")}>Entrées</button>
        <button type="button" className={view === "outputs" ? "active" : ""} onClick={() => setView("outputs")}>Bus · FX · DCA</button>
      </div>
      {view === "inputs" && <div className="xm-layers" role="tablist" aria-label="Mix affiché sur les faders">
        {LAYERS.map(l => <button key={l.id} role="tab" aria-selected={layer === l.id} className={layer === l.id ? "active" : ""} onClick={() => setLayer(l.id)}>{l.id === 0 ? l.label : stripName(layerMaster(l.id), values)}</button>)}
      </div>}
      <span className={online ? "xm-status ok" : "xm-status"}>{online ? (writable ? "Contrôle direct" : "Lecture seule") : "Hors ligne"}</span>
    </div>
    {layer > 0 && view === "inputs" && <p className="xm-layer-note">Les faders règlent les envois vers <b>{stripName(layerMaster(layer), values)}</b> (comme « Sends on fader » dans X-AIR Edit).</p>}
    {error && <div className="xm-error" role="alert">{error}<button onClick={clearError}>×</button></div>}
    <div className="xm-desk">
      <div className="xm-strips">{strips.map(strip => <ChannelStrip key={strip.id} strip={strip} values={values} set={set} layer={view === "inputs" ? layer : 0} selected={selected.id === strip.id} onSelect={() => select(strip)} canWrite={writable} />)}</div>
      <div className="xm-master"><ChannelStrip master strip={masterStrip} values={values} set={set} layer={0} selected={selected.id === masterStrip.id} onSelect={() => select(masterStrip)} canWrite={writable} /></div>
    </div>
    <div className="xm-detail">
      <div className="xm-detail-head" style={{ "--strip": stripColor(Number(values[`${selected.prefix}/config/color`] ?? 0)) } as React.CSSProperties}>
        <span className="xm-detail-chip">{selected.short}</span><h3>{stripName(selected, values)}</h3>
        <div className="xm-views">
          {hasEq && <button type="button" className={tab === "eq" ? "active" : ""} onClick={() => setDetail("eq")}>Égaliseur</button>}
          {hasDyn && <button type="button" className={tab === "dyn" ? "active" : ""} onClick={() => setDetail("dyn")}>Dynamique</button>}
          {hasSends && <button type="button" className={tab === "sends" ? "active" : ""} onClick={() => setDetail("sends")}>Envois</button>}
        </div>
      </div>
      {tab === "eq" && <EqEditor key={selected.id} prefix={selected.prefix} values={values} set={set} canWrite={writable} bands={selected.kind === "bus" || selected.kind === "lr" ? 6 : 4} hasHpf={selected.kind === "ch"} />}
      {tab === "dyn" && <Dynamics prefix={selected.prefix} values={values} set={set} canWrite={writable} gate={selected.kind === "ch"} />}
      {tab === "sends" && <Sends strip={selected} values={values} set={set} canWrite={writable} />}
      {!tab && <p className="xm-hint">Pas d’égaliseur ni de dynamique sur cette sortie : utilise le fader et le mute.</p>}
    </div>
  </section>;
}
