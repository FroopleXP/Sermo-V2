$(document).ready(function() {

    // Variables
    var msg_form = $("#message_form");

    msg_form.on('submit', function() {
        // Getting message from form
        var data = msg_form.serializeArray(),
            message = data[0].value;

        return false; // Stopping the form from submitting
    });

});
