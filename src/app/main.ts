import {app}  from "electron";
import Application from "./application";

let application = new Application('msteams-chat');
app.on('ready', (launchInfo) => {
    application.start(); // Срок действия токена 12 часов
});
