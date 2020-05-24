import axios, { AxiosResponse } from "axios";
import {Utils} from "../utils";

export namespace Microsoft {
    export namespace API {
        export class Teams {
            static possible_events = {
                poll: '/events/poll'
            };
            static default_useragent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.61 Safari/537.36';

            constructor(private personal_url: string, private user_token: string, public chat_id: string){}

            public test_access(callback: (is_have_access: boolean) => any): void {
                this.make_poll_event().then((response) => {
                    if(callback) callback(true);
                    console.log('Microsoft::API::Teams/debug:', Buffer.from(JSON.stringify(response.data), 'utf8').toString('base64'));
                }, (response) => {
                    if(callback) callback(false);
                    console.log('Microsoft::API::Teams/debug/onDeny:', response);
                });
            }

            public async make_poll_event(next?: string): Promise<AxiosResponse<any>> {
                let nextUrl = Utils.objectIsValid(next) ? next : `${this.personal_url}${Teams.possible_events.poll}`;
                return await axios.get(`${nextUrl}`, {
                    headers: {
                        'user-agent': Teams.default_useragent,
                        'authentication': `skypetoken=${this.user_token}`
                    }
                });
            }
        }
    }
}
