$(document).ready(function() {

    // Variables
    var msg_form = $("#message_form"),
        user_table = $("#user_table"),
        socket = io.connect('http://localhost:1337');

    msg_form.on('submit', function() {
        // Getting message from form
        var data = msg_form.serializeArray(),
            message = data[0].value;
        // Sending the message
        socket.emit('new_message', message);
        return false; // Stopping the form from submitting
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
        console.log(data);
    });

});
