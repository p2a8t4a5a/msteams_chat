import {dialog, BrowserWindow, ipcMain, clipboard, Menu, webContents} from "electron";
import {Utils} from "./utils";
import * as path from "path";
import {UserData} from "./user_data";
import {Microsoft} from "./ms_api/teams";

import {ProvideAccessWindow} from "./windows/provide_access";
import { ChatWindow } from "./windows/chat";

const backend_events_pipe = 'backend-events-pipe';

export default class Application {    
    private user_data: UserData | null = null;
    private teams_api: Microsoft.API.Teams | null = null;

    private provideAccessWindow: BrowserWindow | null = null;
    private chatWindow: BrowserWindow | null = null;

    constructor(private app: Electron.App, private protocol: string){
        this.user_data = new UserData('./user.dat');
    }

    public start(){
        this.set_second_instance_lock();

        this.setup_protocol();
        this.setup_menu();
        this.setup_events();

        this.requestUserToken();
    }

    public set_second_instance_lock(){
        if(!this.app.requestSingleInstanceLock()){
            this.app.quit();
        }else{
            this.app.on('second-instance', (event, commandLine, workingDirectory) => {
                if(this.provideAccessWindow && commandLine.length > 0){
                    if(this.provideAccessWindow.isMinimized()) this.provideAccessWindow.restore();
                    this.provideAccessWindow.focus();
                    this.provideAccessWindow.webContents.send(backend_events_pipe, 'processing_data');

                    var data = commandLine[commandLine.length-1];
                    console.log(`received data: "${data}"`);
                    
                    if(data.startsWith(`${this.protocol}://`)){
                        data = data.replace(`${this.protocol}://`, '').trim();
                        if(data[data.length-1] == '/') data = data.slice(0, -1);

                        if(data.length > 0){
                            data = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
                            if(this.user_data){
                                this.provideAccessWindow.webContents.send(backend_events_pipe, 'saving_data');
                                this.user_data.data = data;

                                setTimeout(() => this.testUserToken(), 1000);
                            }
                        }
                    }
                    
                    // this.provideAccessWindow?.webContents.send(backend_events_pipe, 'checking_token');
                    // console.log('workingDirectory:', workingDirectory);
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

    private setup_menu() : void {
        Menu.setApplicationMenu(null);
    }

    private setup_events() {
        ipcMain.on(backend_events_pipe, (event, msg) => {
            if(msg == 'start_chat'){
                this.provideAccessWindow?.hide();

                this.chatWindow = new ChatWindow(this.teams_api, () => {
                    this.chatWindow?.show();
                });

                this.provideAccessWindow?.close();
                this.provideAccessWindow = null;
            }
        });
    }

    public testUserToken(){
        this.provideAccessWindow?.webContents.send(backend_events_pipe, 'checking_token');
        
        setTimeout(() => {
            if(Utils.objectIsValid(this.getPersonalURL(), this.getUserToken(), this.getChatID())){
                this.teams_api = new Microsoft.API.Teams(this.getPersonalURL(), this.getUserToken(), this.getChatID());
                this.teams_api.test_access((is_have_access: boolean) => {
                    this.provideAccessWindow?.webContents.send(backend_events_pipe, is_have_access ? 'token_valid' : 'token_invalid');
                });
            }else{
                this.provideAccessWindow?.webContents.send(backend_events_pipe, 'data_not_found');
            }
        }, 3000); // задержка для того, чтобы пользователь успел понять, что ему рендерит окно с инструкцией
    }

    public requestUserToken(){
        this.provideAccessWindow = new ProvideAccessWindow(() => {
            this.provideAccessWindow?.show();
            this.testUserToken();
        });

        // this.provideAccessWindow.webContents.openDevTools();
    }

    private getUserToken() {
        if(this.user_data?.isValid && Utils.objectIsValid(this.user_data?.data['skype-token'])){
            return this.user_data.data['skype-token'];
        }

        return undefined;
    }

    private getPersonalURL(){
        if(this.user_data?.isValid && Utils.objectIsValid(this.user_data?.data['personal-url'])){
            return this.user_data.data['personal-url'];
        }

        return undefined;
    }

    private getChatID(){
        if(this.user_data?.isValid && Utils.objectIsValid(this.user_data?.data['chat-id'])){
            return this.user_data.data['chat-id'];
        }

        return undefined;
    }
}
