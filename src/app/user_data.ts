import * as fs from "fs";
import {Utils} from "./utils";

export class UserData {
    private cached_data: any;

    constructor(public filename: string){}

    get data() {
        if(this.cached_data) return this.cached_data;

        this.cached_data = null;
        if(fs.existsSync(this.filename)){
            this.cached_data = JSON.parse(fs.readFileSync(this.filename, "utf8"));
        }

        return this.cached_data;
    }

    set data(data){
        if(this.cached_data != data){
            this.cached_data = data;
            fs.writeFileSync(this.filename, JSON.stringify(data));
        }
    }

    get isValid() {
        return Utils.objectIsValid(this.data);
    }
}
