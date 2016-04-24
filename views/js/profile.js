$(document).ready(function() {

    // Variables
    var msg_inp = $("#message_text"),
        user_table = $("#user_table"),
        message_box = $("#message_box"),
        user_id = $("#user_id").val(),
        socket_url = $("#socket_url").val(),
        socket = io.connect(socket_url, {secure: true});


    // Message Queue, used to store message notifications when the window is not active
    var message_queue = {};

    // Listening for when the page is re-activated
    // $(window).focus(function() {
    //     document.title = "Sermo";
    // });

    // Listening for send key
    msg_inp.keyup(function(e) {
        if (e.keyCode === 13 && !e.ctrlKey) {
            var message = msg_inp.val();
            socket.emit('new_message', message);
            msg_inp.val('');
        }
        return true;
    });

    // New user list
    socket.on('user_list', function(data) {
        var data_to_add = "";
        // Looping through the list and rendering to page
        $.each(data, function(index, value) {
            data_to_add += "<li class='list-group-item " + value.id + "'><img src='" + value.profile_pic + "' class='img-circle' height='30px' width='30px' style='margin-right: 10px;'>" + value.name + "</li>";
        });
        // Rendering data to page
        user_table.html(data_to_add);
    });

    // New user has joined the chat
    socket.on('new_user', function(data) {
        // Adding the new user to the list
        user_table.prepend("<li class='list-group-item " + data.id + "'><img src='" + data.profile_pic + "' class='img-circle' height='30px' width='30px' style='margin-right: 10px;'>" + data.name + "</li>");
    });

    // A user has disconnected from the chat
    socket.on('lost_user', function(data) {
        var id = data.toString(),
            to_remove = "." + id;
        // Removing the user from the table
        $(to_remove).remove();
    });

    // New message
    socket.on('new_message', function(data) {
        // Checking who the sender of the message is
        if (data.sender_id === user_id) { // It's their own message
            render_message(data);
        } else if (data.sender_id !== user_id) { // It's someone else's messages
            render_message(data); // Playing the notification tone
            // Checking if the window is active
            $('#chatAudio')[0].play();
        }
        // Auto scrolling the message box
        message_box.animate({"scrollTop": message_box[0].scrollHeight}, "slow");
    });

    // Welcome message
    socket.on('welcome_message', function(data) {
        // Render message
        render_message(data);
    });

    // Function used to render messages to the page
    function render_message(data) {
        // Getting the new message
        var message_to_append = "";
        // Preparing the message template
        message_to_append += '<div class="media">';
        message_to_append += '<div class="media-left">';
        message_to_append += '<img class="media-object img-thumbnail" height="60px" width="60px" src="' + data.sender_pic + '">';
        message_to_append += '</div>';
        message_to_append += '<div class="media-body">';
        message_to_append += '<h4 class="media-heading"><a target="_blank" href="' + data.sender_pic + '">' + data.sender + '</a></h5>';
        message_to_append += data.message;
        message_to_append += '</div>';
        message_to_append += '</div>';
        // message_to_append += '<hr />';
        message_box.append(message_to_append);
    }

});
