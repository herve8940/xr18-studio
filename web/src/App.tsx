import { PROCESSING_PRESETS, PROCESSING_SOURCES, type ProcessingPreset } from "./processingPresets";
import { FX_PRESETS, type FxFamily } from "./fxPresets";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, AudioLines, BookOpen, Cable, Check, ChevronDown, CircleAlert, Disc3, FolderOpen, Headphones, ListMusic, Mic2, Music2, Plus, Save, Settings2, ShieldCheck, SlidersHorizontal, Trash2, Wifi, WifiOff, Zap } from "lucide-react";
import "./studio.css";
import "./fx-library.css";
import "./processing.css";

type Channel = { channel: number; fader: number; on: boolean; updatedAt: string | null };
type Status = { mode: "simulation" | "real"; connected: boolean; writesEnabled: boolean };
type Scene = { id: string; name: string; created: string; faders: number[] };
type Song = { id: string; title: string; artist: string; bpm: number };
type Tab = "mixer" | "eq" | "dynamics" | "sends" | "fx" | "routing" | "dca";
type Page = "console" | "ears" | "rehearsals" | "setlists" | "scenes" | "settings";
type Stored = { scenes: Scene[]; songs: Song[]; setlist: string[]; notes: string };
const KEY = "xr18-studio-local-v1";
const NAMES = ["Chant","Guitare 1","Guitare 2","Basse","Kick","Caisse","Tom 1","Tom 2","OH gauche","OH droite","Clavier L","Clavier R","Playback L","Playback R","Ambiance","Réserve"];
const COLORS = ["#f87171","#f59e0b","#fbbf24","#34d399","#38bdf8","#38bdf8","#38bdf8","#38bdf8","#a78bfa","#a78bfa","#f472b6","#f472b6","#c084fc","#c084fc","#94a3b8","#94a3b8"];
const DEFAULT: Stored = { scenes: [], songs: [], setlist: [], notes: "" };
const INITIAL: Channel[] = Array.from({ length: 16 }, (_, i) => ({ channel: i + 1, fader: .5, on: true, updatedAt: null }));
function load(): Stored { try { const raw = localStorage.getItem(KEY); return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT; } catch { return DEFAULT; } }
function id() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`; }
function labelFor(n: number) { return NAMES[n - 1] ?? `Canal ${n}`; }
function normalized(v: number) { return Math.round(v * 100); }
const MENU: { page: Page; name: string; icon: typeof AudioLines }[] = [
  { page:"console", name:"Console", icon:SlidersHorizontal }, { page:"ears", name:"Retours in-ear", icon:Headphones },
  { page:"rehearsals", name:"Répétitions", icon:Music2 }, { page:"setlists", name:"Setlists", icon:ListMusic },
  { page:"scenes", name:"Snapshots", icon:Disc3 }, { page:"settings", name:"Configuration", icon:Settings2 },
];
const TABS: { id: Tab; name: string }[] = [
  {id:"mixer",name:"Mixage"},{id:"eq",name:"EQ"},{id:"dynamics",name:"Dynamics"},
  {id:"sends",name:"Envois"},{id:"fx",name:"Effets"},{id:"routing",name:"Routage"},{id:"dca",name:"DCA"},
];
export default function App() {
  const [page, setPage] = useState<Page>("console");
  const [tab, setTab] = useState<Tab>("mixer");
  const [fxFamily, setFxFamily] = useState<FxFamily | "Tous">("Tous");
  const [fxSearch, setFxSearch] = useState("");
  const [selectedFx, setSelectedFx] = useState("vocal-rock-plate");
  const [processingFilter, setProcessingFilter] = useState("Tous");
  const [processingChoice, setProcessingChoice] = useState("lead-rock");
  const [processingDraft, setProcessingDraft] = useState<ProcessingPreset | null>(null);
  const [processingRevision, setProcessingRevision] = useState(0);
  const [processingApplied, setProcessingApplied] = useState(false);
  const [channels, setChannels] = useState<Channel[]>(INITIAL);
  const [status, setStatus] = useState<Status>({ mode:"simulation", connected:false, writesEnabled:false });
  const [socketOk, setSocketOk] = useState(false);
  const [selected, setSelected] = useState(1);
  const [store, setStore] = useState<Stored>(load);
  const [notice, setNotice] = useState("");
  const [sceneName, setSceneName] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [songBpm, setSongBpm] = useState(120);
  const [savedSetlists, setSavedSetlists] = useState<{id:string;name:string;songIds:string[]}[]>([]);
  const [rehearsals, setRehearsals] = useState<{id:string;title:string;startsAt:string;notes:string}[]>([]);
  const [rehearsalTitle, setRehearsalTitle] = useState("");
  const [rehearsalDate, setRehearsalDate] = useState("");
  const [setlistName, setSetlistName] = useState("");
  const [earBus, setEarBus] = useState(1);
  const [earValues, setEarValues] = useState<Record<number, number[]>>({});
  const [eq, setEq] = useState([0,2,-1,1]);
  const [hp, setHp] = useState(true);
  const [onlineSince, setOnlineSince] = useState("");
  const [busy, setBusy] = useState(false);
  const drag = useRef<Record<number, number>>({});
  const channelRef = useRef(channels);
  useEffect(() => { channelRef.current = channels; }, [channels]);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(store)); }, [store]);
  const updateChannel = useCallback((c: Channel) => setChannels(old => old.map(x => x.channel === c.channel ? c : x)), []);
  useEffect(() => {
    let active = true; let socket: WebSocket | undefined; let retry: ReturnType<typeof setTimeout> | undefined;
    async function fetchState() {
      try {
        const [a,b] = await Promise.all([fetch("/api/status"),fetch("/api/channels")]);
        if (!a.ok || !b.ok) throw new Error("API indisponible");
        const s = await a.json() as Status, cs = await b.json() as Channel[];
        if (active) { setStatus(s); setChannels(cs); }
      } catch { if (active) setNotice("Le serveur XR18 est indisponible. Démarre le backend pour utiliser le mixeur."); }
    }
    function connect() {
      if (!active) return;
      socket = new WebSocket(`${location.protocol === "https:" ? "wss:" : "ws:"}//${location.host}/ws`);
      socket.onopen = () => { if(active) { setSocketOk(true); setOnlineSince(new Date().toLocaleTimeString("fr-BE")); } };
      socket.onmessage = e => { try {
        const msg = JSON.parse(e.data) as {type:string;channels?:Channel[];status?:Status;state?:Channel};
        if (!active) return;
        if (msg.type === "snapshot" && msg.channels && msg.status) { setChannels(msg.channels); setStatus(msg.status); }
        if (msg.type === "channel" && msg.state) updateChannel(msg.state);
      } catch { /* malformed message */ } };
      socket.onclose = () => { if(active) { setSocketOk(false); retry = setTimeout(connect,3000); } };
      socket.onerror = () => socket?.close();
    }
    void fetchState(); connect();
    return () => { active = false; clearTimeout(retry); socket?.close(); };
  },[updateChannel]);
  const canWrite = status.mode === "simulation" ? socketOk : status.connected && status.writesEnabled && socketOk;
  async function writeFader(channel: number, value: number) {
    if (!canWrite || busy || !Number.isFinite(value)) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/channels/${channel}/fader`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({value})});
      const result = await r.json() as {error?:string};
      if (!r.ok) throw new Error(result.error ?? "Commande refusée");
      if (status.mode === "simulation") updateChannel({...channelRef.current[channel-1]!,fader:value,updatedAt:new Date().toISOString()});
      else setNotice("Commande OSC envoyée, en attente de confirmation par la console.");
    } catch(e) { setNotice((e as Error).message); }
    finally { setBusy(false); }
  }
  function changeSlider(channel: number, value: number) { drag.current[channel] = value; setChannels(old => old.map(c => c.channel === channel ? {...c,fader:value} : c)); }
  function commitSlider(channel: number) { const v = drag.current[channel]; if(v !== undefined) { delete drag.current[channel]; void writeFader(channel,v); } }
  function saveScene() {
    if (status.mode !== "simulation") { setNotice("Sauvegarde locale depuis une XR18 réelle désactivée tant que les lectures ne sont pas entièrement validées."); return; }
    const name = sceneName.trim() || `Snapshot ${new Date().toLocaleString("fr-BE")}`;
    setStore(s => ({...s,scenes:[{id:id(),name,created:new Date().toISOString(),faders:channels.map(c=>c.fader)},...s.scenes]}));
    setSceneName(""); setNotice("Snapshot local enregistré (faders uniquement).");
  }
  async function recallScene(scene: Scene) {
    if (status.mode !== "simulation" || !canWrite) { setNotice("Rappel de snapshot autorisé uniquement en simulation connectée."); return; }
    if (!window.confirm(`Rappeler « ${scene.name} » sur les 16 faders simulés ?`)) return;
    for (let i=0;i<Math.min(16,scene.faders.length);i++) {
      const value=scene.faders[i];
      if (typeof value !== "number") continue;
      try {
        const r=await fetch(`/api/channels/${i+1}/fader`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({value})});
        if (!r.ok) throw new Error(`Échec canal ${i+1}`);
      } catch(e) { setNotice((e as Error).message); return; }
    }
    setNotice("Snapshot restauré dans le simulateur.");
  }
  async function saveProcessing() {
    const preset = processingDraft ?? PROCESSING_PRESETS.find(p=>p.id===processingChoice);
    if (!preset) return;
    if (!isSim || !socketOk) { setNotice("Application des traitements disponible uniquement dans le simulateur connecté."); return; }
    const processing = { hpfHz:preset.hpfHz,eq:preset.eq,compressor:preset.compressor,gate:preset.gate };
    try {
      const preview = await fetch(`/api/channels/${selected}/processing/preview`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({processing})});
      const detail = await preview.json() as {error?:string};
      if(!preview.ok) throw Error(detail.error??"Aperçu refusé");
      if(!window.confirm(`Appliquer « ${preset.name} » au canal ${selected} en SIMULATION uniquement ? Aucun OSC ne sera envoyé.`)) return;
      const response = await fetch(`/api/channels/${selected}/processing`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({processing,confirm:true,expectedRevision:processingRevision})});
      const data=await response.json() as {error?:string;state?:{revision:number}};
      if(!response.ok||!data.state) throw Error(data.error??"Échec");
      setProcessingRevision(data.state.revision);setProcessingApplied(true);
      setNotice("Traitement enregistré dans le simulateur, sans écriture matérielle.");
    } catch(e) {setNotice((e as Error).message); }
  }
  async function undoProcessing() {
    try {
      const response=await fetch(`/api/channels/${selected}/processing/undo`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({expectedRevision:processingRevision})});
      const data=await response.json() as {error?:string;state?:{revision:number}};
      if(!response.ok||!data.state) throw Error(data.error??"Échec");
      setProcessingRevision(data.state.revision);setNotice("Version précédente restaurée dans le simulateur.");
    } catch(e) {setNotice((e as Error).message); }
  }
  useEffect(()=>{let active=true;setProcessingDraft(null);setProcessingApplied(false);setProcessingRevision(0);fetch(`/api/channels/${selected}/processing`).then(r=>r.json()).then((data:{state?:{revision:number}})=>{if(active)setProcessingRevision(data.state?.revision??0);}).catch(()=>{});return()=>{active=false;};},[selected]);
  async function api<T>(path:string,method="GET",payload?:unknown):Promise<T>{
    const response=await fetch(path,{method,headers:{"Content-Type":"application/json"},body:payload===undefined?undefined:JSON.stringify(payload)});
    const data=await response.json() as T & {error?:string};
    if(!response.ok)throw Error(data.error??"Erreur API");
    return data;
  }
  const refreshLibrary=useCallback(async()=>{
    try{
      const [songs,lists,reps]=await Promise.all([
        api<Song[]>("/api/songs"),api<{id:string;name:string;songIds:string[]}[]>("/api/setlists"),
        api<{id:string;title:string;startsAt:string;notes:string}[]>("/api/rehearsals")]);
      setStore(s=>({...s,songs}));setSavedSetlists(lists);setRehearsals(reps);
    }catch{ /* Backend may be starting. Existing local content remains available. */ }
  },[]);
  useEffect(()=>{void refreshLibrary();},[refreshLibrary,socketOk]);
  async function addSong() {
    if(!songTitle.trim())return;
    try{
      const song=await api<Song>("/api/songs","POST",{title:songTitle.trim(),artist:songArtist.trim(),bpm:songBpm});
      setStore(s=>({...s,songs:[...s.songs,song]}));setSongTitle("");setSongArtist("");setSongBpm(120);
      setNotice("Morceau enregistré dans SQLite.");
    }catch(e){setNotice((e as Error).message);}
  }
  async function deleteSong(songId:string){
    if(!window.confirm("Supprimer ce morceau du répertoire et des setlists enregistrées ?"))return;
    try{await api("/api/songs/"+songId,"DELETE");setStore(s=>({...s,songs:s.songs.filter(x=>x.id!==songId),setlist:s.setlist.filter(x=>x!==songId)}));await refreshLibrary();}
    catch(e){setNotice((e as Error).message);}
  }
  async function saveSetlist(){
    if(!setlistName.trim()||store.setlist.length===0){setNotice("Renseigne un nom et ajoute au moins un morceau.");return;}
    try{await api("/api/setlists","POST",{name:setlistName.trim(),songIds:store.setlist});setSetlistName("");await refreshLibrary();setNotice("Setlist enregistrée dans SQLite.");}
    catch(e){setNotice((e as Error).message);}
  }
  async function saveRehearsal(){
    if(!rehearsalTitle.trim()||!rehearsalDate){setNotice("Renseigne le nom et la date de répétition.");return;}
    try{await api("/api/rehearsals","POST",{title:rehearsalTitle.trim(),startsAt:new Date(rehearsalDate).toISOString(),notes:store.notes});setRehearsalTitle("");await refreshLibrary();setNotice("Répétition enregistrée dans SQLite.");}
    catch(e){setNotice((e as Error).message);}
  }
  const setlist = useMemo(()=>store.setlist.map(key=>store.songs.find(s=>s.id===key)).filter((s):s is Song=>Boolean(s)),[store]);
  const isSim = status.mode === "simulation";
  const current = channels[selected-1] ?? channels[0]!;
  return <div className="studio">
    <aside className="studio-side">
      <div className="studio-logo"><span className="logo-mark"><AudioLines size={22}/></span><div><b>XR18 <em>Studio</em></b><small>Mixage · Répétitions · MCP</small></div></div>
      <div className="side-section">ESPACE DE TRAVAIL</div>
      {MENU.map(item=><button key={item.page} className={page===item.page?"side-link active":"side-link"} onClick={()=>setPage(item.page)}><item.icon size={18}/>{item.name}</button>)}
      <div className="side-spacer"/>
      <div className="side-health"><span className={status.connected?"led":"led offline"}/><div><b>{status.connected?"XR18 "+(isSim?"Simulation":"connectée"):"XR18 déconnectée"}</b><small>{isSim?"Aucune commande matérielle":"OSC / UDP"}</small></div></div>
      <div className="side-info"><div><span>Mode</span><b>{isSim?"Simulation":"Matériel"}</b></div><div><span>WebSocket</span><b>{socketOk?"Actif":"Hors ligne"}</b></div><div><span>Écriture</span><b>{canWrite?"Autorisée":"Bloquée"}</b></div></div>
    </aside>
    <main className="studio-main">
      <header className="studio-top"><div className="top-brand"><span className={socketOk?"led":"led offline"}/><b>{socketOk?"Backend connecté":"Backend hors ligne"}</b><small>{onlineSince && socketOk?`Depuis ${onlineSince}`:"Mode local"}</small></div><div className="top-right"><span className="safety-pill"><ShieldCheck size={14}/>{isSim?"SIMULATION":"XR18 RÉELLE"}</span><button className="top-button" onClick={()=>setPage("scenes")}><Save size={16}/> Sauvegarder</button><button className="top-button" onClick={()=>setPage("scenes")}><FolderOpen size={16}/> Charger</button><button className="icon-top" title="Configuration" onClick={()=>setPage("settings")}><Settings2 size={19}/></button></div></header>
      {notice && <div className="studio-alert" role="alert"><CircleAlert size={16}/><span>{notice}</span><button onClick={()=>setNotice("")}>Fermer</button></div>}
      {page==="console" ? <>
        <div className="studio-tabs">{TABS.map(t=><button key={t.id} className={tab===t.id?"active":""} onClick={()=>setTab(t.id)}>{t.name}</button>)}</div>
        <div className="studio-work">
          {tab==="mixer" ? <>
            <div className="mixer-head"><div><span className="eyebrow-studio">CONSOLE NUMÉRIQUE · 16 ENTRÉES</span><h1>Console de mixage</h1></div><div className="read-status"><span className={canWrite?"led":"led offline"}/>{canWrite?"Faders actifs":"Lecture seule / déconnecté"}</div></div>
            <div className="pro-mixer-scroll"><div className="pro-mixer">
              {channels.map(c=><div key={c.channel} className={selected===c.channel?"pro-channel picked":"pro-channel"} style={{"--ch-color":COLORS[c.channel-1]} as React.CSSProperties}>
                <button className="pro-ch-select" onClick={()=>setSelected(c.channel)}><span>{c.channel}</span><Mic2 size={17}/><b>{labelFor(c.channel)}</b></button>
                <span className="ch-type">{c.channel<=4?"INSTRUMENT":c.channel<=10?"BATTERIE":"ENTRÉE"}</span>
                <button className={c.on?"ch-mute":"ch-mute muted"} disabled title="Mute en lecture seule">{c.on?"M":"MUTED"}</button>
                <div className="ch-fader-area"><div className="ch-meter" title="Vumètre non implémenté : aucune mesure réelle"><span>—</span></div><input aria-label={`Fader ${labelFor(c.channel)}`} type="range" className="ch-slider" min="0" max="1" step=".01" value={c.fader} disabled={!canWrite||busy} onChange={e=>changeSlider(c.channel,Number(e.target.value))} onPointerUp={()=>commitSlider(c.channel)} onKeyUp={e=>{if(["ArrowUp","ArrowDown","Home","End","PageUp","PageDown"].includes(e.key))commitSlider(c.channel);}}/></div>
                <span className="ch-value">{normalized(c.fader)}%</span><span className="ch-on">{c.on?"ON":"OFF"}</span><div className="ch-color"/>
              </div>)}
              <div className="pro-channel master"><div className="pro-ch-select"><span>MAIN</span><Activity size={20}/><b>Main L/R</b></div><span className="ch-type">SORTIE</span><button disabled className="ch-mute">M</button><div className="ch-fader-area"><div className="ch-meter"><span>—</span></div><div className="master-placeholder">Lecture<br/>à venir</div></div><span className="ch-value">—</span><span className="ch-on">NON DISP.</span><div className="ch-color"/></div>
            </div></div>
            <div className="studio-bottom-grid">
              <section className="studio-panel details"><div className="panel-title"><div><b>Canal {selected} — {labelFor(selected)}</b><small>Égaliseur et traitements</small></div><button onClick={()=>setTab("eq")}>Ouvrir l'EQ <ChevronDown size={14}/></button></div><div className="detail-body"><div className="eq-chart"><svg viewBox="0 0 560 175" preserveAspectRatio="none" aria-label="Aperçu illustratif de l'égaliseur, non connecté à la console"><defs><pattern id="grid" width="40" height="35" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 35" fill="none" stroke="#2a3a4b" strokeWidth="1"/></pattern></defs><rect width="560" height="175" fill="url(#grid)"/><path d="M0 90 C45 90 52 145 85 135 S120 90 165 90 S240 75 270 90 S345 112 385 90 S450 72 480 90 S530 100 560 90" fill="none" stroke="#55b5fb" strokeWidth="2.5"/><path d="M0 90H560" stroke="#46556a" strokeDasharray="3 4"/>{[85,165,270,385,480].map((x,i)=><circle key={i} cx={x} cy={[135,90,90,90,90][i]} r="5" fill={["#fb7469","#eab44d","#50d8a5","#55b5fb","#c58aff"][i]}/>)}</svg><small>Courbe illustrative uniquement — paramètres EQ non reliés à la XR18</small></div><div className="eq-mini">{["HPF","LOW","LOW MID","HIGH MID","HIGH"].map((name,i)=><div key={name}><span>{name}</span><b>{i===0?"80 Hz":i===1?"120 Hz":i===2?"600 Hz":i===3?"3.0 kHz":"10 kHz"}</b><small>Démo visuelle</small></div>)}</div></div></section>
              <section className="studio-panel"><div className="panel-title"><div><b>Vumètres</b><small>Mesures en temps réel</small></div><Activity size={17}/></div><div className="meter-empty"><Activity size={30}/><b>En attente des données OSC</b><span>Aucune mesure audio simulée ou inventée.</span></div></section>
              <section className="studio-panel"><div className="panel-title"><div><b>Scènes rapides</b><small>Snapshots locaux</small></div><Save size={16}/></div><div className="quick-scenes">{store.scenes.slice(0,4).map(s=><button key={s.id} onClick={()=>void recallScene(s)}><Disc3 size={16}/>{s.name}</button>)}{store.scenes.length===0&&<p>Aucune scène enregistrée.</p>}<button className="quick-add" onClick={()=>setPage("scenes")}><Plus size={16}/> Nouvelle scène</button></div></section>
            </div>
          </> : <section className="studio-panel tab-panel"><div className="tab-heading"><div><span className="eyebrow-studio">CANAL {selected} · {labelFor(selected)}</span><h1>{TABS.find(t=>t.id===tab)?.name}</h1></div><span className="safety-pill"><ShieldCheck size={14}/> Démonstration</span></div>
            {(tab==="eq" || tab==="dynamics") ? <div className="processing-library"><div className="processing-intro"><b>Préréglages EQ · Compresseur · Gate</b><p>Choisis un instrument, puis consulte ou ajuste les paramètres. Les seuils de compression et de gate doivent être réglés à l'oreille sur les niveaux réels.</p></div><div className="processing-filter"><label>Instrument <select value={processingFilter} onChange={e=>setProcessingFilter(e.target.value)}>{["Tous",...new Set(PROCESSING_PRESETS.map(p=>p.instrument))].map(name=><option key={name}>{name}</option>)}</select></label><label>Préréglage <select value={processingChoice} onChange={e=>{setProcessingChoice(e.target.value);setProcessingDraft(null);}}>{PROCESSING_PRESETS.filter(p=>processingFilter==="Tous"||p.instrument===processingFilter).map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select></label></div>{(()=>{const preset=processingDraft??PROCESSING_PRESETS.find(p=>p.id===processingChoice)??PROCESSING_PRESETS[0];return <div className="processing-detail"><div className="processing-header"><div><h2>{preset.name}</h2><p>{preset.description}</p></div><button onClick={()=>{setProcessingDraft(null);setNotice("Préréglage réinitialisé à sa valeur de départ.");}}>Réinitialiser</button></div><div className="processing-columns"><section><h3>Égaliseur 4 bandes</h3><label>Filtre coupe-bas (Hz)<input type="number" min="20" max="400" value={preset.hpfHz??20} onChange={e=>setProcessingDraft({...preset,hpfHz:Number(e.target.value)})}/></label>{preset.eq.map((band,i)=><div className="processing-band" key={i}><b>Bande {i+1} · {band.type}</b><label>Fréquence (Hz)<input type="number" min="20" max="20000" value={band.frequencyHz} onChange={e=>setProcessingDraft({...preset,eq:preset.eq.map((x,j)=>j===i?{...x,frequencyHz:Number(e.target.value)}:x)})}/></label><label>Gain (dB)<input type="number" min="-15" max="15" step=".5" value={band.gainDb} onChange={e=>setProcessingDraft({...preset,eq:preset.eq.map((x,j)=>j===i?{...x,gainDb:Number(e.target.value)}:x)})}/></label><label>Q<input type="number" min=".1" max="10" step=".1" value={band.q} onChange={e=>setProcessingDraft({...preset,eq:preset.eq.map((x,j)=>j===i?{...x,q:Number(e.target.value)}:x)})}/></label></div>)}</section><section><h3>Compresseur</h3><label className="processing-toggle"><input type="checkbox" checked={preset.compressor.enabled} onChange={e=>setProcessingDraft({...preset,compressor:{...preset.compressor,enabled:e.target.checked}})}/> Activé (préparation)</label>{([["ratio","Ratio"],["attackMs","Attack (ms)"],["releaseMs","Release (ms)"],["makeupDb","Makeup (dB)"]] as const).map(([key,label])=><label key={key}>{label}<input type="number" step=".5" value={preset.compressor[key]} onChange={e=>setProcessingDraft({...preset,compressor:{...preset.compressor,[key]:Number(e.target.value)}})}/></label>)}<p>Seuil : <strong>à calibrer</strong></p><p>Réduction visée : {preset.compressor.targetReductionDb}</p><h3>Gate / Expander</h3><label className="processing-toggle"><input type="checkbox" checked={preset.gate.enabled} onChange={e=>setProcessingDraft({...preset,gate:{...preset.gate,enabled:e.target.checked}})}/> Activé (préparation)</label>{([["attackMs","Attack (ms)"],["holdMs","Hold (ms)"],["releaseMs","Release (ms)"],["rangeDb","Range (dB)"]] as const).map(([key,label])=><label key={key}>{label}<input type="number" step="1" value={preset.gate[key]} onChange={e=>setProcessingDraft({...preset,gate:{...preset.gate,[key]:Number(e.target.value)}})}/></label>)}<p>Mode : {preset.gate.mode} · seuil à calibrer</p></section></div><div className="processing-actions"><button disabled={!isSim||!socketOk} onClick={()=>void saveProcessing()}><Save size={15}/> Appliquer en simulation</button><button disabled={!isSim||!socketOk||!processingApplied} onClick={()=>void undoProcessing()}>Annuler la dernière application</button><span>Canal {selected} · Révision {processingRevision} · Aucun OSC envoyé</span></div><div className="processing-advice"><b>Conseil de réglage</b><p>{preset.advice}</p><button onClick={()=>{navigator.clipboard?.writeText(JSON.stringify(preset,null,2)).then(()=>setNotice("Réglages copiés au format JSON.")).catch(()=>setNotice("Copie indisponible dans ce navigateur."));}}>Copier le préréglage (JSON)</button></div></div>;})()}<div className="processing-sources"><b>Sources consultées</b>{PROCESSING_SOURCES.map(s=><a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.name} ↗</a>)}</div><p className="disclaimer">Ces réglages sont des propositions initiales éditables. L'application les enregistre uniquement en mémoire dans le backend de simulation, avec révision et annulation. Aucun paramètre EQ, compresseur ou gate n'est envoyé à la XR18. Les réglages sont perdus au redémarrage du serveur.</p></div> : tab==="fx" ? <div className="fx-library"><div className="fx-filter"><input aria-label="Rechercher un preset" placeholder="Rechercher un preset..." value={fxSearch} onChange={e=>setFxSearch(e.target.value)}/><div className="fx-families">{(["Tous","Voix","Guitare","Basse","Batterie","Clavier","Global"] as const).map(f=><button key={f} className={fxFamily===f?"active":""} onClick={()=>setFxFamily(f)}>{f}</button>)}</div></div><div className="fx-grid">{FX_PRESETS.filter(p=>(fxFamily==="Tous"||p.family===fxFamily)&&(`${p.name} ${p.type} ${p.use}`).toLowerCase().includes(fxSearch.toLowerCase())).map(p=><article key={p.id} className={selectedFx===p.id?"fx-card selected":"fx-card"}><div className="fx-card-head"><span>{p.family}</span><small>FX {p.slotSuggestion} suggéré</small></div><h3>{p.name}</h3><p>{p.use}</p><div className="fx-type">{p.type}</div><div className="fx-params">{p.parameters.map(param=><div key={param.label}><span>{param.label}</span><b>{param.value}</b></div>)}</div><p className="fx-notes">{p.notes}</p><div className="fx-actions"><button onClick={()=>setSelectedFx(p.id)}>{selectedFx===p.id?"Sélectionné":"Sélectionner"}</button><a href={p.sourceUrl} target="_blank" rel="noopener noreferrer">Source ↗</a></div></article>)}</div><p className="disclaimer">Préréglages documentés et ajustables lors des prochaines étapes. Les valeurs sont des suggestions de départ et non des presets officiels Behringer. Aucun effet n’est envoyé à la console : affectation FX, routage et paramètres OSC doivent être validés avant activation. La XR18 dispose de quatre slots FX partagés.</p></div> : <div className="module-placeholder"><Zap size={40}/><h2>Module en préparation</h2><p>Les paramètres OSC de ce module restent à valider sur la console.</p></div>}
          </section>}
        </div>
      </> : <div className="studio-work other-page">
        <div className="page-heading-studio"><span className="eyebrow-studio">XR18 STUDIO</span><h1>{MENU.find(x=>x.page===page)?.name}</h1><p>{page==="ears"?"Mix personnel par musicien":page==="rehearsals"?"Notes et préparation de répétition":page==="setlists"?"Répertoire et ordre de passage":page==="scenes"?"Sauvegarde locale des réglages simulés":"Connexion et sécurité"}</p></div>
        {page==="ears" && <section className="studio-panel pad"><div className="panel-title"><div><b>Mix personnel — prototype</b><small>Choisissez un bus pour préparer un retour</small></div><Headphones size={19}/></div><div className="bus-picker">{[1,2,3,4,5,6].map(bus=><button key={bus} className={earBus===bus?"active":""} onClick={()=>setEarBus(bus)}>Bus {bus}</button>)}</div><p className="disclaimer">Les niveaux ci-dessous sont uniquement stockés en mémoire dans cette page. Aucun envoi OSC vers les bus de la XR18.</p><div className="ear-grid">{channels.map(c=><label key={c.channel}><span>{labelFor(c.channel)}</span><input type="range" min="0" max="100" value={(earValues[earBus]??Array(16).fill(50))[c.channel-1]} onChange={e=>setEarValues(old=>({...old,[earBus]:(old[earBus]??Array(16).fill(50)).map((v,i)=>i===c.channel-1?Number(e.target.value):v)}))}/><b>{(earValues[earBus]??Array(16).fill(50))[c.channel-1]}%</b></label>)}</div></section>}
        {page==="rehearsals" && <section className="studio-panel pad"><div className="panel-title"><div><b>Préparation de répétition</b><small>Notes sauvegardées localement dans le navigateur</small></div><BookOpen size={18}/></div><label className="field">Objectifs et notes<textarea rows={9} value={store.notes} onChange={e=>setStore(s=>({...s,notes:e.target.value}))} placeholder="Ex. travailler le refrain de Plug In Baby, préparer le mix sans chanteur..."/></label><div className="rehearsal-form"><input placeholder="Nom de la répétition" value={rehearsalTitle} onChange={e=>setRehearsalTitle(e.target.value)}/><input aria-label="Date et heure" type="datetime-local" value={rehearsalDate} onChange={e=>setRehearsalDate(e.target.value)}/><button onClick={()=>void saveRehearsal()}><Save size={15}/> Enregistrer dans SQLite</button></div><div className="song-list">{rehearsals.map(r=><div key={r.id}><div><b>{r.title}</b><small>{new Date(r.startsAt).toLocaleString("fr-BE")} · {r.notes.slice(0,100)}</small></div></div>)}</div><span className="disclaimer">Les répétitions enregistrées sont conservées sur le serveur SQLite. Le brouillon de notes reste stocké dans ce navigateur.</span></section>}
        {page==="setlists" && <div className="two-panels"><section className="studio-panel pad"><div className="panel-title"><div><b>Répertoire</b><small>{store.songs.length} morceaux</small></div><Music2 size={18}/></div><div className="song-form"><input placeholder="Titre du morceau" value={songTitle} onChange={e=>setSongTitle(e.target.value)}/><input placeholder="Artiste" value={songArtist} onChange={e=>setSongArtist(e.target.value)}/><input type="number" min="20" max="300" value={songBpm} onChange={e=>setSongBpm(Number(e.target.value))}/><button onClick={addSong}><Plus size={16}/> Ajouter</button></div><div className="song-list">{store.songs.map(song=><div key={song.id}><div><b>{song.title}</b><small>{song.artist} · {song.bpm} BPM</small></div><button onClick={()=>setStore(s=>({...s,setlist:[...s.setlist,song.id]}))}>+ Setlist</button><button title="Supprimer" onClick={()=>void deleteSong(song.id)}><Trash2 size={15}/></button></div>)}</div></section><section className="studio-panel pad"><div className="panel-title"><div><b>Setlist active</b><small>{setlist.length} morceaux</small></div><ListMusic size={18}/></div><div className="song-list">{setlist.map((song,i)=><div key={i}><span className="song-order">{i+1}</span><div><b>{song.title}</b><small>{song.artist}</small></div><button onClick={()=>setStore(s=>({...s,setlist:s.setlist.filter((_,j)=>j!==i)}))}><Trash2 size={15}/></button></div>)}{setlist.length===0&&<p>Ajoute des morceaux depuis le répertoire.</p>}</div><div className="rehearsal-form"><input placeholder="Nom de la setlist" value={setlistName} onChange={e=>setSetlistName(e.target.value)}/><button onClick={()=>void saveSetlist()}><Save size={15}/> Sauvegarder</button></div><div className="song-list">{savedSetlists.map(s=><div key={s.id}><div><b>{s.name}</b><small>{s.songIds.length} morceaux</small></div><button onClick={()=>setStore(old=>({...old,setlist:s.songIds}))}>Charger</button><button title="Supprimer" onClick={async()=>{if(!window.confirm("Supprimer la setlist enregistrée ?"))return;try{await api("/api/setlists/"+s.id,"DELETE");await refreshLibrary();}catch(e){setNotice((e as Error).message);}}}><Trash2 size={15}/></button></div>)}</div></section></div>}
        {page==="scenes" && <section className="studio-panel pad"><div className="panel-title"><div><b>Snapshots locaux</b><small>Faders simulés uniquement — aucun rappel matériel</small></div><Disc3 size={18}/></div><div className="scene-form"><input placeholder="Nom de la scène (ex. Répétition)" value={sceneName} onChange={e=>setSceneName(e.target.value)}/><button disabled={!isSim} onClick={saveScene}><Save size={16}/> Enregistrer</button></div><div className="song-list">{store.scenes.map(scene=><div key={scene.id}><div><b>{scene.name}</b><small>{new Date(scene.created).toLocaleString("fr-BE")} · 16 faders</small></div><button disabled={!isSim||!canWrite} onClick={()=>void recallScene(scene)}>Rappeler</button><button title="Supprimer" onClick={()=>setStore(s=>({...s,scenes:s.scenes.filter(x=>x.id!==scene.id)}))}><Trash2 size={15}/></button></div>)}</div><p className="disclaimer">Ce sont des snapshots applicatifs stockés dans ce navigateur, pas des scènes internes XR18. Les mutes, bus, effets et traitements ne sont pas sauvegardés.</p></section>}
        {page==="settings" && <section className="studio-panel pad"><div className="panel-title"><div><b>État du système</b><small>Paramètres de sécurité</small></div><Cable size={18}/></div><div className="settings-rows"><div><span>Mode d'exécution</span><b>{isSim?"Simulation":"Console réelle"}</b></div><div><span>WebSocket</span><b>{socketOk?"Connecté":"Déconnecté"}</b></div><div><span>Réponse OSC</span><b>{status.connected?"Reçue / simulation":"Non confirmée"}</b></div><div><span>Écritures matérielles</span><b>{!isSim&&status.writesEnabled?"Activées sur backend":"Désactivées"}</b></div><div><span>Accès distant</span><b>Non configuré</b></div></div><p className="disclaimer">Pour changer le mode de connexion, configurez les variables d'environnement du backend. N'activez pas les écritures réelles avant validation du protocole et des protections auditives.</p></section>}
      </div>}
      <footer className="studio-footer"><span>XR18 STUDIO · Prototype de développement</span><span>{isSim?"Simulation sans matériel":"Console réelle — expérimental"} · Vumètres indisponibles</span></footer>
    </main>
  </div>;
}
