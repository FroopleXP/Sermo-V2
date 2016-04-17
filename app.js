// Requiring dependencies
var express = require("express"),
    app = express();

var cookieParser = require('cookie-parser'),
    session = require('express-session'),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    passport = require('passport'),
    flash = require('connect-flash');

// Loading config files
var config = require("./config/app-config.js"),
    configDB = require('./config/database.js');

require('./config/passport.js')(passport);

// Getting data from config file
var app_name = config.app.name,
    app_port = config.app.port;

// Configuring MongoDB
var User = require('./app/models/user.js');
mongoose.connect(configDB.url);

// Startup message
console.log(app_name + " is starting...");

// Setting up Express
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: config.sessions.token,
    saveUninitialized: true,
    resave: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Page routes
app.get("/", function(req, res) {
    res.render("home", { title: app_name + " | Home", app_name: app_name });
});

// Profile
app.get('/profile', checkLogin, function(req, res) {
    res.render('profile', { user: req.user });
});

// Google+ Login
app.get("/auth/google", passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get("/auth/google/callback", passport.authenticate('google', { successRedirect: '/profile', failureRedirect: '/' }));

// Logout
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

// Function to check that the user is logged in
function checkLogin(req, res, next) {
    if (req.isAuthenticated()) {
        return next(); // They are, carry on
    }
    res.redirect('/login'); // They're not, redirect to login page
}

// Starting the app
app.listen(app_port, function() {
    console.log("Server started on port: " + app_port);
});
