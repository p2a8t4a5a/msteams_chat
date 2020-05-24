const {shell, ipcRenderer} = require("electron");
const $ = require("jquery");

const backend_events_pipe = 'backend-events-pipe';
const ui_events_pipe = 'ui-events-pipe';

class ContentBlocker {
    constructor(){
        this.element = $(`<div class="blocked_content">
            <div class="content_wrapper">
                <img src="img/loading_circle.png" alt="loading image" class="loading_circle">
                <div></div>
            </div>
        </div>`);

        this.element_content = this.element.find('.content_wrapper>div');
    }

    setContent(new_html){
        this.element_content.html(new_html);
        return this;
    }

    show(hide_loader = false){
        if(hide_loader){
            this.element.find('img.loading_circle').addClass('hide');
        }else{
            this.element.find('img.loading_circle').removeClass('hide');
        }
        this.element.removeClass('hide');

        let body = $('body').addClass('content_blurred');
        if(body.find('>div.blocked_content').length <= 0){
            body.append(this.element);
        }
    }

    hide(){
        this.element.addClass('hide');
        $('body').removeClass('content_blurred');
    }
}
let content_blocker = new ContentBlocker();

$('a[href="#copy_code"]').click(eventObject => {
    eventObject.preventDefault();
    ipcRenderer.send(ui_events_pipe, 'instruction_copy');
});
$('a[href="#open_teams"]').click(eventObject => {
    eventObject.preventDefault();
    shell.openExternal('http://teams.microsoft.com/');
});

ipcRenderer.on(ui_events_pipe, (event, msg) => {
    if(msg){
        if(msg == 'instruction_copied'){
            $('a[href="#copy_code"]').css('color', 'var(--color-ready)');
            setTimeout(() => $('a[href="#copy_code"]').css('color', ''), 500);
        }
    }
});

ipcRenderer.on(backend_events_pipe, (event, msg) => {
    if(msg){
        console.log(event, msg);

        switch(msg){
            case 'checking_token': {
                content_blocker.setContent('Тестируем токен на валидность 🤖<br>Это займет не больше минуты').show();
                break;
            }

            case 'token_valid': {
                content_blocker.setContent('Готово<br>Запускаем чат').show();
                setTimeout(() => {
                    ipcRenderer.send(backend_events_pipe, 'start_chat');
                }, 3000); // опять же, задержка для того, чтобы пользователь успел прочитать уведомление
                break;
            }

            case 'data_not_found':
            case 'token_invalid': {
                let reason = 'Токен не валиден';
                if(msg == 'data_not_found'){
                    reason = 'Не удалось загрузить пользовательские данные';
                }

                content_blocker.setContent(`${reason}<br>Действуйте по инструкции`).show(true);
                setTimeout(() => {
                    content_blocker.hide();
                }, 3000);
                break;
            }

            case 'processing_data': {
                content_blocker.setContent(`Обработка данных..`).show(true);
                break;
            }
            case 'saving_data': {
                content_blocker.setContent(`Сохранение данных..`).show(true);
                break;
            }

            default: break;
        }
    }
});
