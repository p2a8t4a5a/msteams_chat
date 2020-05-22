const {ClientRequest} = require('electron');

class MicrosoftTeamsAPI {
    constructor(personal_url, skype_token_key){
        this.personal_url = personal_url;
        this.skype_token = skype_token_key;
        
        this._poll_events = undefined;
    }

    start_poll_events(){
        //var request = new ClientRequest();
        
        var xhr = new XMLHttpRequest();
        xhr.open('GET', this.personal_url);
    }
}