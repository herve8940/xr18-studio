import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, AudioLines, Cable, ChevronDown, CircleHelp, Headphones, LayoutDashboard, ListMusic, Mic2, Music2, RotateCcw, Settings2, ShieldCheck, SlidersHorizontal, Wifi, WifiOff } from "lucide-react";

type Channel = { channel: number; fader: number; on: boolean; updatedAt: string | null };
type Status = { mode: "simulation" | "real"; connected: boolean; writesEnabled: boolean; lastValuesAreVerified: boolean };
type WsMessage = { type: "snapshot"; channels: Channel[]; status: Status } | { type: "channel"; state: Channel };
type Page = "mixer" | "monitor" | "rehearsals" | "settings";
const channelsInfo = [
  ["Voix lead", "CHANT", "#eebd72"], ["Guitare 1", "GUITARE", "#b99cff"], ["Guitare 2", "GUITARE", "#b99cff"],
  ["Basse", "BASSE", "#66d5c5"], ["Kick", "BATTERIE", "#82b6ef"], ["Snare", "BATTERIE", "#82b6ef"],
  ["Hi-hat", "BATTERIE", "#82b6ef"], ["Tom 1", "BATTERIE", "#82b6ef"], ["Tom 2", "BATTERIE", "#82b6ef"],
  ["Overhead L", "BATTERIE", "#82b6ef"], ["Overhead R", "BATTERIE", "#82b6ef"], ["Clavier L", "KEYS", "#e9a1cb"],
  ["Clavier R", "KEYS", "#e9a1cb"], ["Playback L", "PLAYBACK", "#e9a1cb"], ["Playback R", "PLAYBACK", "#e9a1cb"], ["Ambiance", "AMBIANCE", "#b7c0ce"],
] as const;
function db(value: number): string { if (value <= 0) return "-∞"; return (20 * Math.log10(value)).toFixed(1); }
const initial: Channel[] = Array.from({ length: 16 }, (_, i) => ({ channel: i + 1, fader: .5, on: true, updatedAt: null }));

export default function App() {
  const [page, setPage] = useState<Page>("mixer");
  const [channels, setChannels] = useState<Channel[]>(initial);
  const [status, setStatus] = useState<Status>({ mode: "simulation", connected: false, writesEnabled: false, lastValuesAreVerified: false });
  const [wsConnected, setWsConnected] = useState(false);
  const [busy, setBusy] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const mounted = useRef(true);
  const applyChannel = useCallback((state: Channel) => setChannels(prev => prev.map(c => c.channel === state.channel ? state : c)), []);
  useEffect(() => {
    mounted.current = true;
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let active = true;
    async function fetchInitial() {
      try {
        const [s, c] = await Promise.all([fetch("/api/status"), fetch("/api/channels")]);
        if (!s.ok || !c.ok) throw new Error("Backend indisponible");
        const nextStatus = await s.json() as Status, nextChannels = await c.json() as Channel[];
        if (active) { setStatus(nextStatus); setChannels(nextChannels); }
      } catch { if (active) setError("Impossible de joindre le backend XR18. Démarre le serveur Node.js."); }
    }
    function connect() {
      if (!active) return;
      socket = new WebSocket(`${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws`);
      socket.onopen = () => { if (active) { setWsConnected(true); setError(""); } };
      socket.onmessage = event => {
        try {
          const data = JSON.parse(event.data) as WsMessage;
          if (data.type === "snapshot") { setChannels(data.channels); setStatus(data.status); }
          if (data.type === "channel") applyChannel(data.state);
        } catch { /* Ignore invalid messages */ }
      };
      socket.onclose = () => { if (active) { setWsConnected(false); retry = setTimeout(connect, 3000); } };
      socket.onerror = () => socket?.close();
    }
    void fetchInitial(); connect();
    return () => { active = false; mounted.current = false; clearTimeout(retry); socket?.close(); };
  }, [applyChannel]);
  const canWrite = status.mode === "simulation" || (status.mode === "real" && status.writesEnabled && status.connected);
  async function setFader(channel: number, value: number) {
    if (!canWrite || busy.includes(channel)) return;
    setBusy(prev => [...prev, channel]);
    try {
      const r = await fetch(`/api/channels/${channel}/fader`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value }) });
      const body = await r.json() as { error?: string };
      if (!r.ok) throw new Error(body.error || "Échec de la commande");
      if (status.mode === "simulation") applyChannel({ ...channels[channel - 1]!, fader: value, updatedAt: new Date().toISOString() });
    } catch (e) { setError((e as Error).message); }
    finally { if (mounted.current) setBusy(prev => prev.filter(n => n !== channel)); }
  }
  const nav: { id: Page; label: string; icon: typeof Activity }[] = [
    { id: "mixer", label: "Console de mixage", icon: SlidersHorizontal },
    { id: "monitor", label: "Retours in-ear", icon: Headphones },
    { id: "rehearsals", label: "Répétitions", icon: ListMusic },
    { id: "settings", label: "Configuration", icon: Settings2 },
  ];
  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="brand-icon"><AudioLines size={25}/></div><div><strong>XR18 <span>STUDIO</span></strong><small>LIVE MIXING WORKSPACE</small></div></div>
      <div className="side-label">ESPACE DE TRAVAIL</div>
      <nav>{nav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setPage(id)} className={page === id ? "nav active" : "nav"}><Icon size={19}/>{label}{page === id && <span className="nav-indicator"/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="console-card"><div className="console-symbol"><Cable size={19}/></div><div><b>Behringer XR18</b><small>{status.mode === "simulation" ? "Mode démonstration" : "Connexion OSC / UDP"}</small></div><span className={status.connected ? "status-dot" : "status-dot off"}/></div><div className="sidebar-note"><ShieldCheck size={16}/> Contrôle sécurisé en local</div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumb">XR18 Studio <span>/</span> <b>{nav.find(n => n.id === page)?.label}</b></div><div className="top-actions"><span className={wsConnected ? "connection online" : "connection"}>{wsConnected ? <Wifi size={15}/> : <WifiOff size={15}/>} {wsConnected ? "Temps réel actif" : "Hors connexion"}</span><div className="avatar">XR</div></div></header>
      <div className="content">
        {error && <div className="error" role="alert">{error}<button onClick={() => setError("")}>Fermer</button></div>}
        {page === "mixer" ? <>
          <div className="page-heading"><div><div className="eyebrow"><span className="live-dot"/> TABLE DE MIXAGE NUMÉRIQUE</div><h1>Console de mixage</h1><p>Gardez le contrôle de chaque canal, en toute simplicité.</p></div><div className="heading-actions"><span className="mode-pill"><span className="mode-dot"/>{status.mode === "simulation" ? "SIMULATION" : "CONSOLE RÉELLE"}</span><button className="secondary-button" onClick={() => setSelected(null)}><RotateCcw size={15}/> Vue générale</button></div></div>
          <div className="stat-grid">
            <div className="stat"><div className="stat-icon blue"><SlidersHorizontal size={20}/></div><div><small>CANAUX D'ENTRÉE</small><strong>16 <span>/ 16</span></strong><p>Disponibles dans le prototype</p></div></div>
            <div className="stat"><div className="stat-icon teal"><Activity size={20}/></div><div><small>CONNEXION OSC</small><strong>{status.connected ? "Active" : "En attente"}</strong><p>{status.mode === "simulation" ? "Console simulée" : "Réponse XR18 requise"}</p></div></div>
            <div className="stat"><div className="stat-icon purple"><Headphones size={20}/></div><div><small>RETOURS IN-EAR</small><strong>6 <span>bus</span></strong><p>Interface à venir</p></div></div>
            <div className="stat"><div className="stat-icon orange"><ShieldCheck size={20}/></div><div><small>ÉCRITURE OSC</small><strong>{canWrite ? "Autorisée" : "Bloquée"}</strong><p>{status.mode === "simulation" ? "Simulation uniquement" : "Protection matérielle"}</p></div></div>
          </div>
          <div className="mixer-panel"><div className="panel-heading"><div><h2>Canaux d'entrée <span>01 — 16</span></h2><p>Réglages des faders · Valeurs OSC normalisées</p></div><div className="panel-tools"><span><span className="legend-dot"/> Synchronisation WebSocket</span><button className="icon-button" title="Informations"><CircleHelp size={19}/></button></div></div>
            <div className="mixer-scroll"><div className="channels">{channels.map(c => { const [name, group, color] = channelsInfo[c.channel - 1]!; const selectedChannel = selected === c.channel; return <div key={c.channel} className={selectedChannel ? "channel selected" : "channel"} style={{ "--accent": color } as React.CSSProperties}>
              <button className="channel-top" onClick={() => setSelected(selectedChannel ? null : c.channel)}><span className="channel-num">{String(c.channel).padStart(2, "0")}</span><span className="channel-menu"><ChevronDown size={14}/></span></button>
              <div className="channel-name">{name}</div><div className="channel-group">{group}</div>
              <div className="channel-meter" aria-label="Niveau audio non disponible"><div className="meter-track"/><div className="meter-track"/><span className="meter-placeholder">—</span></div>
              <div className="fader-box"><div className="scale"><span>1.0</span><span>0.75</span><span>0.5</span><span>0.25</span><span>0</span></div><input aria-label={`Fader ${name}`} title={`Fader ${name}`} type="range" min="0" max="1" step="0.01" value={c.fader} disabled={!canWrite || busy.includes(c.channel)} onChange={e => { const v = Number(e.target.value); setChannels(prev => prev.map(x => x.channel === c.channel ? { ...x, fader: v } : x)); }} onPointerUp={e => void setFader(c.channel, Number(e.currentTarget.value))} onKeyUp={e => { if (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "Home" || e.key === "End") void setFader(c.channel, Number(e.currentTarget.value)); }} className="fader"/></div>
              <div className="fader-readout">{c.fader.toFixed(2)}</div><div className="fader-db">{db(c.fader)} dB*</div>
              <div className="channel-bottom"><span className={c.on ? "on-label" : "off-label"}>{c.on ? "ON" : "OFF"}</span><button title="État mute en lecture seule" className={c.on ? "mute-button" : "mute-button muted"} disabled>MUTE</button></div>
            </div>; })}</div></div>
            <div className="mixer-footer"><span><span className="legend-dot"/> Les barres de niveau sont désactivées tant que les vumètres OSC ne sont pas implémentés.</span><span>*Échelle indicative, pas une calibration XR18.</span></div>
          </div>
        </> : <><div className="page-heading"><div><div className="eyebrow"><span className="live-dot"/> XR18 STUDIO</div><h1>{nav.find(n => n.id === page)?.label}</h1><p>Ce module sera développé lors de la prochaine étape.</p></div></div><div className="empty-panel">{page === "monitor" ? <Headphones size={38}/> : page === "rehearsals" ? <Music2 size={38}/> : <Settings2 size={38}/>}<h2>{page === "monitor" ? "Vos mixes personnels, bientôt ici." : page === "rehearsals" ? "Organisez vos répétitions." : "Configuration de la console."}</h2><p>Le moteur OSC et la console de mixage sont notre première priorité. Aucune commande sensible n'est disponible dans cet écran.</p></div></>}
      </div>
      <footer><span>XR18 STUDIO <b>•</b> Prototype v0.1</span><span>{status.mode === "simulation" ? "Simulation active" : "Console réelle — expérimental"} <b>•</b> Usage local uniquement</span></footer>
    </main>
  </div>;
}
