import {BrowserWindow, BrowserWindowConstructorOptions} from "electron";

export namespace Utils {
    export function objectIsValid(...obj: any[]) : boolean{
        return obj.every(e => e != undefined && e != null);
    }

    export function createWindow(width:number, height: number, source: string, addition_options?: BrowserWindowConstructorOptions) : BrowserWindow {
        let win = new BrowserWindow(Object.assign({
            width,
            height,
            webPreferences: {
                nodeIntegration: true
            }
        }, addition_options));

        win.loadFile(source);

        return win;
    }
}