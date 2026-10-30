// Value laws used by the XR18 / X-AIR Edit (OSC wire value 0..1 <-> physical unit).

/** Fader / send level law (4 linear segments, 0 = -inf, 0.75 = 0 dB, 1 = +10 dB). */
export function faderToDb(v: number) {
  if (v <= 0) return -Infinity;
  return v >= .5 ? v * 40 - 30 : v >= .25 ? v * 80 - 50 : v >= .0625 ? v * 160 - 70 : v * 480 - 90;
}
export function dbToFader(d: number) {
  if (d <= -90) return 0;
  const v = d >= -10 ? (d + 30) / 40 : d >= -30 ? (d + 50) / 80 : d >= -60 ? (d + 70) / 160 : (d + 90) / 480;
  return Math.max(0, Math.min(1, v));
}
export const formatDb = (d: number) => !Number.isFinite(d) || d <= -89.9 ? "-∞" : `${d > 0 ? "+" : ""}${d.toFixed(1)}`;

export const lin = (v: number, lo: number, hi: number) => lo + v * (hi - lo);
export const linInv = (x: number, lo: number, hi: number) => (x - lo) / (hi - lo);
export const logMap = (v: number, lo: number, hi: number) => lo * Math.pow(hi / lo, v);
export const logInv = (x: number, lo: number, hi: number) => Math.log(x / lo) / Math.log(hi / lo);
export const qFromWire = (v: number) => .3 * Math.pow(10 / .3, 1 - v);
export const qToWire = (q: number) => 1 - Math.log(q / .3) / Math.log(10 / .3);
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const formatHz = (f: number) => f >= 1000 ? `${(f / 1000).toFixed(f >= 10000 ? 1 : 2)}k` : `${Math.round(f)}`;
export const formatMs = (t: number) => t >= 100 ? `${Math.round(t)}` : t >= 10 ? t.toFixed(1) : t.toFixed(2);

/** X-AIR scribble-strip colours: 0-7 normal, 8-15 inverted. */
const COLORS = ["#4a525e", "#ef4444", "#22c55e", "#eab308", "#3b82f6", "#d946ef", "#06b6d4", "#e5e7eb"];
export const COLOR_NAMES = ["Éteint", "Rouge", "Vert", "Jaune", "Bleu", "Magenta", "Cyan", "Blanc"];
export function stripColor(index: number | undefined) { return COLORS[(Number(index) || 0) % 8]!; }
export function stripInverted(index: number | undefined) { return (Number(index) || 0) >= 8; }

export const RATIOS = ["1.1", "1.3", "1.5", "2.0", "2.5", "3.0", "4.0", "5.0", "7.0", "10", "20", "100"];
export const EQ_TYPES = ["LCut", "LShv", "PEQ", "VEQ", "HShv", "HCut"];

/** RBJ biquad magnitude (dB) at frequency f for one EQ band. */
export function bandResponse(type: number, f0: number, gain: number, q: number, f: number, fs = 48000) {
  const w0 = 2 * Math.PI * Math.min(f0, fs * .45) / fs, cos = Math.cos(w0), sin = Math.sin(w0);
  const A = Math.pow(10, gain / 40);
  let b0: number, b1: number, b2: number, a0: number, a1: number, a2: number;
  const kind = EQ_TYPES[type] ?? "PEQ";
  if (kind === "LCut" || kind === "HCut") {
    const alpha = sin / (2 * Math.SQRT1_2);
    if (kind === "LCut") { b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = (1 + cos) / 2; }
    else { b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = (1 - cos) / 2; }
    a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha;
  } else if (kind === "LShv" || kind === "HShv") {
    const alpha = sin / (2 * Math.max(q, .3)), s = 2 * Math.sqrt(A) * alpha, sign = kind === "LShv" ? 1 : -1;
    b0 = A * ((A + 1) - sign * (A - 1) * cos + s);
    b1 = sign * 2 * A * ((A - 1) - sign * (A + 1) * cos);
    b2 = A * ((A + 1) - sign * (A - 1) * cos - s);
    a0 = (A + 1) + sign * (A - 1) * cos + s;
    a1 = -sign * 2 * ((A - 1) + sign * (A + 1) * cos);
    a2 = (A + 1) + sign * (A - 1) * cos - s;
  } else {
    const alpha = sin / (2 * q);
    b0 = 1 + alpha * A; b1 = -2 * cos; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * cos; a2 = 1 - alpha / A;
  }
  const w = 2 * Math.PI * f / fs, c1 = Math.cos(w), s1 = Math.sin(w), c2 = Math.cos(2 * w), s2 = Math.sin(2 * w);
  const nr = b0 + b1 * c1 + b2 * c2, ni = -(b1 * s1 + b2 * s2), dr = a0 + a1 * c1 + a2 * c2, di = -(a1 * s1 + a2 * s2);
  return 10 * Math.log10((nr * nr + ni * ni) / (dr * dr + di * di));
}
