// Requiring dependencies
var express = require("express"),
    app = express();

// Loading config files
var config = require("./config/app-config.js");

// Getting data from config file
var app_name = config.app.name,
    app_port = config.app.port;

// Startup message
console.log(app_name + " is starting...");

// Setting up Express
app.set("view engine", "ejs");

// Page routes
app.get("/", function(req, res) {
    res.render("home", { title: app_name + " | Home", app_name: app_name });
});

// Starting the app
app.listen(app_port, function() {
    console.log("Server started on port: " + app_port);
});
