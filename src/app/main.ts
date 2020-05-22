import {app, BrowserWindow, screen, dialog, ipcRenderer, ipcMain, session}  from "electron";
import {Application} from "./application";
import path from "path";

let application = new Application(app, 'msteams-sidechat');
app.on('ready', (launchInfo) => {
    console.log('application work dirpath:', path.resolve('./'));
    //app.quit();
    console.log(`Срок действия токена: 12 часов`);
    application.start();
});
