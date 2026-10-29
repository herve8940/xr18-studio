import {MixerSyncPanel} from './MixerSyncPanel';
import {useEffect,useState} from 'react';
type Device={host:string;port:number;name:string;model:string};
type Status={mode:'real'|'simulation';host?:string;port?:number;connected:boolean;writesEnabled:boolean};
async function request(path:string,data?:unknown){
 const r=await fetch(path,{method:data?'POST':'GET',headers:{'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});
 const result=await r.json();if(!r.ok)throw Error(result.error??'Connexion impossible');return result;
}
export function ConnectionPanel({status}:{status:Status}){
 const [admin,setAdmin]=useState(false),[working,setWorking]=useState(false),[devices,setDevices]=useState<Device[]>([]),[message,setMessage]=useState(''),[error,setError]=useState(''),[host,setHost]=useState('');
 useEffect(()=>{void request('/api/auth').then(a=>setAdmin(a.user?.role==='admin')).catch(()=>{});},[]);
 const run=async(action:()=>Promise<void>)=>{setWorking(true);setError('');setMessage('');try{await action();}catch(e){setMessage('');setError((e as Error).message);}finally{setWorking(false);}};
 const connect=async(device:Device)=>{
  setMessage('Connexion à '+device.name+'…');
  await request('/api/connection',{mode:'real',host:device.host,port:device.port,enableWrites:false});
  setMessage('XR18 connectée en lecture seule. Adresse mémorisée.');
 };
 const scan=()=>run(async()=>{
  setDevices([]);setMessage('Recherche de ta XR18 sur le réseau local…');
  const result=await request('/api/discovery');setDevices(result.devices);
  if(result.devices.length===1)await connect(result.devices[0]);
  else setMessage(result.devices.length?'Plusieurs XR18 détectées : choisis ta console.':'Aucune XR18 trouvée. Vérifie que le PC et la console sont sur le même réseau et que le pare-feu autorise XR18 Studio.');
 });
 return <section className="studio-panel pad studio-control"><h2>Connexion à ma XR18</h2>
  <p>{status.mode==='simulation'?'Mode simulation':`${status.connected?'Connectée':'Connexion perdue / en attente'} · ${status.host??''} · ${status.writesEnabled?'Contrôle activé':'Lecture seule'}`}</p>
  {admin?<><fieldset disabled={working}>
   <button onClick={()=>void scan()}>{working?'Connexion en cours…':'Détecter et connecter ma XR18'}</button>
   <button onClick={()=>void run(async()=>{await request('/api/connection',{mode:'simulation'});setMessage('Simulation activée.');})}>Passer en simulation</button>
  </fieldset>
  <p role="status" aria-live="polite">{message}</p><p role="alert">{error}</p>
  {devices.length>1&&<div className="song-list">{devices.map(d=><div key={d.host}><div><b>{d.name}</b><small>{d.host} · {d.model}</small></div><button disabled={working} onClick={()=>void run(()=>connect(d))}>Se connecter</button></div>)}</div>}
  {status.mode==='real'&&<button disabled={working||!status.connected} onClick={()=>{
   const enableWrites=!status.writesEnabled;
   if(enableWrites&&!window.confirm('Activer le contrôle de la XR18 ? Les commandes modifieront le son. Vérifie le niveau des sorties et des retours.'))return;
   void run(async()=>{await request('/api/connection',{mode:'real',host:status.host,port:status.port,enableWrites});setMessage(enableWrites?'Contrôle activé.':'Lecture seule activée.');});
  }}>{status.writesEnabled?'Désactiver le contrôle':'Activer le contrôle'}</button>}
  <MixerSyncPanel status={status}/>
  <details><summary>Connexion manuelle si la recherche est bloquée</summary><form onSubmit={e=>{e.preventDefault();void run(()=>connect({host,port:10024,name:'XR18',model:'XR18'}));}}><fieldset disabled={working}><label>Adresse IP<input required placeholder="192.168.1.100" value={host} onChange={e=>setHost(e.target.value)}/></label><button>Se connecter</button></fieldset></form></details>
  <p><a href="/api/diagnostics/log" download="xr18-studio-diagnostic.log">Télécharger le journal de diagnostic</a></p>
  <p>Après un essai de connexion, télécharge ce fichier pour le joindre au support. Il contient les adresses IP locales et les réponses d’identité de la console, sans clé API ni mot de passe.</p>
  <p>La connexion ne modifie aucun réglage audio. Le mode et l’adresse sont conservés au prochain démarrage.</p></>:<p>La connexion à la console est gérée par l’administrateur.</p>}
 </section>;
}
