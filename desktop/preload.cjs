const {contextBridge,ipcRenderer}=require('electron');
// Narrow API only; no arbitrary IPC, filesystem, environment or credential reads.
contextBridge.exposeInMainWorld('xr18DesktopAI',{
 configure:(input)=>ipcRenderer.invoke('xr18-ai-configure',input)
});
