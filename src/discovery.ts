import dgram from "node:dgram";
import { networkInterfaces } from "node:os";
import { decodeOsc, encodeOsc } from "./osc.js";

export interface DiscoveredXR18 { host: string; port: number; name: string; model: string; source: "osc"; }
const PORT = 10024;
const PROBE = encodeOsc("/info");
const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;

/** Probe local IPv4 broadcast addresses; accept only replies with valid OSC /info model data. */
export async function discoverXR18(timeoutMs = 2500): Promise<DiscoveredXR18[]> {
  const sockets: dgram.Socket[] = [];
  const found = new Map<string, DiscoveredXR18>();
  const interfaces = networkInterfaces();
  const targets = new Set<string>();
  for (const addresses of Object.values(interfaces)) for (const addr of addresses ?? []) {
    if (addr.family !== "IPv4" || addr.internal || !IPV4.test(addr.address)) continue;
    if (addr.netmask && IPV4.test(addr.netmask)) {
      const ip = addr.address.split(".").map(Number);
      const mask = addr.netmask.split(".").map(Number);
      targets.add(ip.map((part, i) => ((part & mask[i]!) | (~(mask[i] ?? 0) & 255)) & 255).join("."));
    }
  }
  if (!targets.size) return [];
  try {
    const socket = dgram.createSocket("udp4");
    sockets.push(socket);
    socket.on("message", (data, remote) => {
      if (remote.port !== PORT || !IPV4.test(remote.address)) return;
      try {
        const msg = decodeOsc(data);
        if (msg.address !== "/info" || msg.args.length < 2) return;
        const fields = msg.args.filter((arg): arg is string => typeof arg === "string");
        const model = fields.find(value => /^(XR18|X18|XR16|XR12)$/i.test(value.trim()));
        if (!model || model.toUpperCase() !== "XR18") return;
        found.set(remote.address, { host: remote.address, port: PORT, name: fields[0] || "XR18", model: "XR18", source: "osc" });
      } catch { /* Ignore unrelated UDP traffic */ }
    });
    await new Promise<void>((resolve, reject) => {
      socket.once("error", reject);
      socket.bind(0, "0.0.0.0", resolve);
    });
    socket.setBroadcast(true);
    for (const target of targets) socket.send(PROBE, PORT, target);
    await new Promise<void>(resolve => setTimeout(resolve, Math.max(500, Math.min(timeoutMs, 5000))));
    return [...found.values()].sort((a, b) => a.host.localeCompare(b.host));
  } finally {
    for (const socket of sockets) socket.close();
  }
}
