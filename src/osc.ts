/** Minimal OSC encoder/decoder for XR18 scalar messages. Not a full OSC implementation. */
export type OscArg = number | string | Buffer;
export interface OscMessage { address: string; args: OscArg[] }
/** Explicit OSC float32, including whole-number values 0 and 1. */
export interface OscFloat { oscType: "f"; value: number }
export type OutgoingOscArg = OscArg | OscFloat;
export const oscFloat = (value: number): OscFloat => ({ oscType: "f", value });
function padded(s: string): Buffer {
  const raw = Buffer.from(s + "\0", "utf8");
  return Buffer.concat([raw, Buffer.alloc((4 - raw.length % 4) % 4)]);
}
export function encodeOsc(address: string, args: OutgoingOscArg[] = []): Buffer {
  if (!address.startsWith("/")) throw new Error("OSC address must start with /");
  const tags = "," + args.map(v => Buffer.isBuffer(v) ? "b" : typeof v === "string" ? "s" : typeof v === "object" ? "f" : Number.isInteger(v) ? "i" : "f").join("");
  const chunks = [padded(address), padded(tags)];
  for (const arg of args) {
    if (Buffer.isBuffer(arg)) { const size=Buffer.alloc(4); size.writeInt32BE(arg.length); chunks.push(size,arg,Buffer.alloc((4-arg.length%4)%4)); }
    else if (typeof arg === "string") chunks.push(padded(arg));
    else { const b = Buffer.alloc(4); if (typeof arg === "object") { if (!Number.isFinite(arg.value)) throw Error("Invalid OSC float"); b.writeFloatBE(arg.value); } else if (Number.isInteger(arg)) b.writeInt32BE(arg); else b.writeFloatBE(arg); chunks.push(b); }
  }
  return Buffer.concat(chunks);
}
function readString(b: Buffer, offset: number): [string, number] {
  const end = b.indexOf(0, offset);
  if (end < 0) throw new Error("Unterminated OSC string");
  const next = (end + 4) & ~3;
  if (next > b.length) throw new Error("Invalid OSC padding");
  return [b.toString("utf8", offset, end), next];
}
export function decodeOsc(b: Buffer): OscMessage {
  let pos = 0;
  const [address, afterAddress] = readString(b, pos); pos = afterAddress;
  if (!address.startsWith("/") || address === "/#bundle") throw new Error("Unsupported OSC packet");
  if (pos === b.length) return { address, args: [] };
  const [tags, afterTags] = readString(b, pos); pos = afterTags;
  if (!tags.startsWith(",")) throw new Error("Invalid OSC typetag");
  const args: OscArg[] = [];
  for (const tag of tags.slice(1)) {
    if (tag === "b") {if(pos+4>b.length)throw Error("Truncated OSC blob length");const size=b.readInt32BE(pos);pos+=4;if(size<0||size>65536||pos+size>b.length)throw Error("Invalid OSC blob size");args.push(Buffer.from(b.subarray(pos,pos+size)));pos+=(size+3)&~3;if(pos>b.length)throw Error("Invalid OSC blob padding");}
    else if (tag === "s") { const [v, next] = readString(b, pos); args.push(v); pos = next; }
    else if (tag === "f" || tag === "i") {
      if (pos + 4 > b.length) throw new Error("Truncated OSC number");
      args.push(tag === "i" ? b.readInt32BE(pos) : b.readFloatBE(pos)); pos += 4;
    } else throw new Error("Unsupported OSC tag: " + tag);
  }
  return { address, args };
}

/** X-Air meter blob: LE uint32 count, then signed LE int16 levels at 1/256 dBFS. */
export function decodeXAirMeterBlob(blob:Buffer, expectedCount:number):number[]{
  if(blob.length<4)throw Error("Meter blob too short");
  const count=blob.readUInt32LE(0);
  if(count!==expectedCount||blob.length!==4+count*2)throw Error("Unexpected X-Air meter blob layout");
  return Array.from({length:count},(_,i)=>Math.max(-128,Math.min(0,blob.readInt16LE(4+i*2)/256)));
}

