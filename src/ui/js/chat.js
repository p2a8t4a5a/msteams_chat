const {shell, ipcRenderer} = require("electron");
const $ = require("jquery");

const ui_events_pipe = 'ui-events-pipe';
const max_window_height = window.outerHeight/1.2;

$('ul.messages').on('mouseenter', function() {
    $(this).addClass('highlight');
});

$('ul.messages').on('mouseleave', function() {
    $(this).removeClass('highlight');
});

ipcRenderer.on(ui_events_pipe, (event, msg, data) => {
    if(msg){
        if(msg == 'new_message' && data){
            if($(`li.message[data-message-id="${data.message_id}"]`).length > 0) return; // message already exists

            if(data.message_type == 'RichText/Html'){
                if(data.content.search('animated-emoticon') != -1){
                    data.content = `<img src="${$(data.content).find('img').attr('src')}" alt="emoji">`;
                }else{
                    data.content = $(data.content).text();
                }
            }

            let newMsg = $(`<li class="message" data-message-id="${data.message_id}">
                <div class="author">${data.author}</div>
                <div class="content">${data.content}</div>
            </li>`);

            let messages_block = $('ul.messages');
            let messages = messages_block.find('li.message');

            messages_block.append(newMsg);

            if(messages_block.height() > max_window_height){
                let needToClear = messages_block.height()-max_window_height;
                let clearedHeight = 0;

                messages.each((i, e) => {
                    clearedHeight += $(e).height();
                    $(e).remove();

                    return needToClear-clearedHeight > 0;
                });
            }
        }
    }
});
