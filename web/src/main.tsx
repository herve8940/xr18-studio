import React from "react";
import { createRoot } from "react-dom/client";
import {AuthGate} from "./StudioControl";
import App from "./App";
import "./style.css";

// In the desktop app, confirmations open a native window in French with the app icon.
const desktopDialog = (window as unknown as { xr18DesktopDialog?: { confirm: (m: string) => boolean; alert: (m: string) => void } }).xr18DesktopDialog;
if (desktopDialog) { window.confirm = (m?: string) => desktopDialog.confirm(m ?? ""); window.alert = (m?: string) => desktopDialog.alert(m ?? ""); }
createRoot(document.getElementById("root")!).render(<React.StrictMode><AuthGate><App /></AuthGate></React.StrictMode>);

