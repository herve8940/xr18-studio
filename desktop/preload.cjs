const {contextBridge,ipcRenderer}=require('electron');
// Narrow API only; no arbitrary IPC, filesystem, environment or credential reads.
contextBridge.exposeInMainWorld('xr18DesktopAI',{
 configure:(input)=>ipcRenderer.invoke('xr18-ai-configure',input)
});
// Native confirmation windows in French with the app icon (the browser default shows English buttons).
contextBridge.exposeInMainWorld('xr18DesktopDialog',{
 confirm:(message)=>ipcRenderer.sendSync('xr18-confirm',String(message??'')),
 alert:(message)=>{ipcRenderer.sendSync('xr18-alert',String(message??''));}
});
