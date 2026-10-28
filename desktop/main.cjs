const { app, BrowserWindow, dialog, shell } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { mkdirSync } = require("node:fs");
const net = require("node:net");
let win;
app.whenReady().then(async () => {
  try {
    const dataPath=app.getPath("userData");
    mkdirSync(dataPath,{recursive:true});
    process.env.XR18_MODE="simulation"; // Never start hardware writes from a packaged app.
    process.env.XR18_ENABLE_WRITES="false";
    const port = await new Promise((resolve,reject)=>{
      const probe=net.createServer();
      probe.once("error",reject);
      probe.listen(0,"127.0.0.1",()=>{const address=probe.address();const freePort=typeof address==="object"?address.port:0;probe.close(()=>resolve(freePort));});
    });
    process.env.HTTP_PORT=String(port);
    process.env.XR18_DB_PATH=path.join(dataPath,"xr18-studio.db");
    process.env.XR18_WEB_DIST=app.isPackaged
      ?path.join(process.resourcesPath,"web-dist")
      :path.join(app.getAppPath(),"web","dist");
    const backend=path.join(app.getAppPath(),"dist","src","server.js");
    await import(pathToFileURL(backend).href);
    let ready=false;
    for(let i=0;i<80;i++){
      try{const response=await fetch(`http://127.0.0.1:${port}/api/status`);if(response.ok){ready=true;break;}}catch{}
      await new Promise(resolve=>setTimeout(resolve,250));
    }
    if(!ready)throw Error("Le serveur local XR18 n'a pas démarré.");
    win=new BrowserWindow({
      width:1440,height:900,minWidth:800,minHeight:600,
      backgroundColor:"#0d1621",
      webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}
    });
    win.webContents.setWindowOpenHandler(({url})=>{
      if(url.startsWith("https://"))void shell.openExternal(url);
      return {action:"deny"};
    });
    win.webContents.on("will-navigate",(event,url)=>{
      if(!url.startsWith(`http://127.0.0.1:${port}/`))event.preventDefault();
    });
    await win.loadURL(`http://127.0.0.1:${port}/`);
  } catch(error) {
    dialog.showErrorBox("XR18 Studio — démarrage impossible",String(error));
    app.quit();
  }
});
app.on("window-all-closed",()=>app.quit());
