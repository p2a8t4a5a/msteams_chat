import {BrowserWindow, BrowserWindowConstructorOptions} from "electron";

export namespace Utils {
    export function objectIsValid(...obj: any[]) : boolean{
        return obj.every(e => e != undefined && e != null);
    }

    export function structIsValid(approx_struct: any, obj: any){
        for(let key in approx_struct){
            if(!obj[key] || typeof(approx_struct[key]) == "object" && !structIsValid(approx_struct[key], obj[key])) return false;
            
            if(typeof(approx_struct[key]) == "string" && approx_struct[key].split('/').filter((type: string) => {
                type = type.trim();
                return type.length > 0 && type == typeof(obj[key]);
            }).length <= 0) return false; // type mismatch
        }
    
        return true;
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