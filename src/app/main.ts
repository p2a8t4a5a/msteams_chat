import {app, BrowserWindow, screen, dialog, ipcRenderer, ipcMain, session}  from "electron";
import Application from "./application";
import path from "path";

let application = new Application(app, 'msteams-chat');
app.on('ready', (launchInfo) => {
    application.start(); // Срок действия токена 12 часов
});
