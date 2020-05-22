import {dialog, BrowserWindow, ipcMain} from "electron";
import {Utils} from "./utils";
import * as path from "path";
import {UserData} from "./user_data";
import {Microsoft} from "./ms_api/teams";
import axios from "axios";

export class Application {
    private mainWindow:Electron.BrowserWindow | null = null;
    private user_data:UserData | null = null;
    private teams_api: Microsoft.API.Teams | null = null;

    constructor(private app: Electron.App, private protocol: string){
        this.user_data = new UserData('./user.dat');
    }

    public start(){
        this.set_second_instance_lock();
        this.setup_protocol();

        this.requestUserToken();
        //this.try_acquire_token();

        //this.app.quit();
    }

    public set_second_instance_lock(){
        if(!this.app.requestSingleInstanceLock()){
            this.app.quit();
        }else{
            this.app.on('second-instance', (event, commandLine, workingDirectory) => {
                if(this.mainWindow){
                    if(this.mainWindow.isMinimized()) this.mainWindow.restore();
                    if(!this.mainWindow.isFocused) this.mainWindow.focus();
        
                    console.log('commandLine:', commandLine);
        
                    if(commandLine.length > 0){
                        var data = commandLine[commandLine.length-1];
                        if(data.startsWith(`${this.protocol}://`) && (data = data.replace(`${this.protocol}://`, '').replace('/', '').trim()).length > 0){
                            console.log(`received data from url: "${data}"`);
                        }else{
                            dialog.showErrorBox('Token error', `Токен аутентификации не был получен.\nВторой раз приложение должно быть открыто через браузер.\n\nDebug data: "${data}"`);
                        }
                        console.log('workingDirectory:', workingDirectory);
                    }
                }
            });
        }
    }

    public setup_protocol() : void {
        if(process.defaultApp && process.argv.length >= 2){
            this.app.setAsDefaultProtocolClient(this.protocol, process.execPath, [path.resolve(process.argv[1])]);
        }else{
            this.app.setAsDefaultProtocolClient(this.protocol);
        }
    }

    public try_acquire_token(){
        let personalURL = this.getPersonalURL();
        let userToken = this.getUserToken();

        //console.log('personalURL', personalURL);
        //console.log('userToken', userToken);
        //console.log('user data:', this.user_data?.data);

        if(Utils.objectIsValid(personalURL, userToken) && personalURL.length > 0 && userToken.length > 0){
            console.log('user token saved');
            //console.log('user token saved:', userToken);
            // try to test token 
            this.teams_api = new Microsoft.API.Teams(personalURL, userToken);
            this.teams_api.test_access(() => {
                console.log('test_access/onHave', 'token is working!');
                // 
            }, () => {
                console.log('test_access/onDeny', 'token is not working');
                // this.requestUserToken();
            });

            //axios.get('https://api.coindesk.com/v1/bpi/currentprice.json').then(response => console.log(response));

            return;
        }
    }

    public requestUserToken(){
        // height used values: 325, 280, 265
        this.mainWindow = Utils.createWindow(640, 265, 'ui/provide_access.html', {
            show: false,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: true
                //devTools: false
            },
            //resizable: false,
        });

        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow?.show();
        });
        //this.mainWindow.webContents.openDevTools();
    }

    private getUserToken() {
        return this.user_data?.data['skype-token'];
    }

    private getPersonalURL(){
        return this.user_data?.data['poll-event'];
    }
}
