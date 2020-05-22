const {app, BrowserWindow, screen, dialog, ipcRenderer, ipcMain, session} = require("electron");
const path = require("path");
const fs = require("fs");
require("./modules/utils");

let app_protocol = 'msteams-sidechat';

function createWindow(window_layout, addition_options){
    let win = new BrowserWindow(Object.assign({
        width: 800+200,
        height: screen.height,
        webPreferences: {
            nodeIntegration: true
        }
    }, addition_options));

    win.loadFile(window_layout);

    return win;
}

class UserData {
    constructor(filename){
        this.filename = filename;
        this._cached_data = undefined;
    }

    get data(){
        if(this._cached_data) return this._cached_data;

        this._cached_data = undefined;
        if(fs.existsSync(this.filename)){
            this._cached_data = fs.readFileSync(this.filename);
        }

        return this._cached_data;
    }

    set data(data){
        if(this._cached_data != data){
            this._cached_data = data;
            fs.writeFileSync(this.filename, data);
        }
    }
}

class Application {
    constructor(protocol){
        this.protocol = protocol;
        this.user_data = new UserData('./user.dat');
        this.mainWindow = null;
    }

    start(){
        this.set_second_instance_lock();
        this.setup_protocol();
        this.try_acquire_token();
    }

    set_second_instance_lock(){
        if(!app.requestSingleInstanceLock()){
            app.quit();
        }else{
            //if(this.mainWindow && !createWindow().isFocused) createWindow().focus();
            app.on('second-instance', (event, commandLine, workingDirectory) => {
                if(this.mainWindow){
                    if(this.mainWindow.isMinimized()) this.mainWindow.restore();
                    if(!this.mainWindow.isFocused) this.mainWindow.focus();
        
                    console.log('commandLine:', commandLine);
        
                    if(commandLine.length > 0){
                        var data = commandLine[commandLine.length-1];
                        if(data.startsWith(`${app_protocol}://`) && (data = data.replace(`${app_protocol}://`, '').replace('/', '').trim()).length > 0){
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

    setup_protocol(){
        if(process.defaultApp && process.argv.length >= 2){
            app.setAsDefaultProtocolClient(this.protocol, process.execPath, [path.resolve(process.argv[1])]);
        }else{
            app.setAsDefaultProtocolClient(this.protocol);
        }
    }

    try_acquire_token(){
        if(Utils.objectIsValid(this.user_data.data)){
            console.log('token is valid, testing..');
            return;
        }

        //
        /*let currentWindow = createWindow('provide_access.html', {
            frame: false,
            transparent: true
        });*/
        this.mainWindow = createWindow('provide_access.html', {width: 590});
        this.mainWindow.setPosition(screen.getPrimaryDisplay().bounds.width-this.mainWindow.getBounds().width, 0);

        this.mainWindow.setMenuBarVisibility(false);

        //currentWindow.setAlwaysOnTop(true);
        //currentWindow.setIgnoreMouseEvents(true);

        this.mainWindow.webContents.openDevTools();
    }

    get_token(){
        if(Utils.objectIsValid(this.user_data, this.user_data.data)){
            var parsedData = JSON.parse(this.user_data.data);
            if(Utils.objectIsValid(parsedData['skype-token']) && parsedData['skype-token'].length > 0){
                return parsedData['skype-token'];
            }
        }

        return null;
    }
}

var application = new Application();
app.whenReady().then(() => {
    console.log('program started');

    /*var json_example = `{"skype-token":"eyJhbGciOiJSUzI1NiIsImtpZCI6IjEwMiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1ODk4ODMxOTEsImV4cCI6MTU4OTk2OTU5MCwic2t5cGVpZCI6Im9yZ2lkOmRkNjI1ZGU3LWQ5NjQtNDExZS04MjFhLWQ2MTZiNjI1MmYzNyIsInNjcCI6NzgwLCJjc2kiOiIxNTg5ODgyODkwIiwidGlkIjoiMWMyYWE0MWUtNWI5Mi00OTA2LTgyN2UtMGMxMGY5ZDczODU5IiwicmduIjoiZW1lYSJ9.Sm1NL6VUumV36XQGLYcIt9tm76j5tHX1LHQJuZWs_k2sXZtmRWhTtBNU7AZO9PbDp2-sT7C3p6RvytCPZKuF6pgSdS4J2vECZQVCpNVqkPqGU3cguR9Z-z3qOQ4aa8KOK-wGLWIxdj1JHJsNOlfZFI4TXRfU9SSJxZ-9Bhev2fWrs7YZSE4X8U2nryygcKCoycSbwmHyRqXYde3_-Yu91VeSK6di3fMhoVbjzrSQ9VmBCz3XROKRKW0i7dCVPEWOuqM5ZrsXzsEhzpdmyY8UKxP6ataz_8z-SY5FFXDmnl1OC3ujNz0iSvh9BDbPedO5yhfZLRsYt36od9XIWkSEGw","poll-event":"https://uksouth-prod.notifications.teams.microsoft.com/users/8:orgid:dd625de7-d964-411e-821a-d616b6252f37/endpoints/2b8b9ab5-d4fd-45f9-b14a-f5d8b6598e61/events/poll"}`;
    var json_example_parsed = JSON.parse(json_example);
    console.log('json_example_parsed', json_example_parsed);

    var userData = new UserData('./user_example.dat');
    userData.data = JSON.stringify(json_example_parsed);
    console.log('user data:', userData.data);*/

    application.start();
    //startup_program();
});

app.on('window-all-closed', () => {
    // Для приложений и строки меню в macOS является обычным делом оставаться
    // активными до тех пор, пока пользователь не выйдет окончательно используя Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // На MacOS обычно пересоздают окно в приложении,
    // после того, как на иконку в доке нажали и других открытых окон нету.
    if (BrowserWindow.getAllWindows().length === 0) {
        //startup_program();
        application.start();
    }
});
