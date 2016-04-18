// Requiring dependencies
var express = require("express"),
    app = express();

var cookieParser = require('cookie-parser'),
    session = require('express-session'),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    passport = require('passport'),
    flash = require('connect-flash');

// SocketIO Dependencies
var server = require('http').createServer(app),
    io = require('socket.io').listen(server);

// Loading config files
var config = require("./config/app-config.js"),
    configDB = require('./config/database.js');

require('./config/passport.js')(passport);

// Getting data from config file
var app_name = config.app.name,
    app_port = config.app.port;

// Configuring MongoDB
var User = require('./app/models/user.js');
mongoose.connect(configDB.url, function() {
    console.log("Connected to MongoDB");
});

// Startup message
console.log(app_name + " is starting...");

// Setting up Express
app.set("view engine", "ejs");
app.use("/views", express.static(__dirname + '/views'));
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
    if (!req.isAuthenticated()) {
        res.render("home", { title: app_name + " | Login", app_name: app_name });
    } else {
        res.redirect("/profile");
    }
});

// Profile
app.get('/profile', checkLogin, function(req, res) {
    res.render('profile', { user: req.user, title: app_name + " | Home", app_name: app_name });
});

// Google+ Login
app.get("/auth/google", passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get("/auth/google/callback", passport.authenticate('google', { successRedirect: '/profile', failureRedirect: '/' }));

// Logout
app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

// Socket IO
io.on('connection', function(socket) {
    console.log(socket + " has connected");
    socket.on('disconnect', function() {
        console.log(socket + " has disconnected");
    });
});

// Function to check that the user is logged in
function checkLogin(req, res, next) {
    if (req.isAuthenticated()) {
        return next(); // They are, carry on
    }
    res.redirect('/'); // They're not, redirect to login page
}

// Starting the app
server.listen(app_port, function() {
    console.log("Server started on port: " + app_port);
});
