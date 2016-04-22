// Requiring dependencies
var express = require("express"),
    app = express();

var cookieParser = require('cookie-parser'),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    passportSocketIo = require('passport.socketio'),
    passport = require('passport'),
    session = require('express-session'),
    MongoStore = require('connect-mongo')(session),
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

var MongoStoreIns = new MongoStore({
    mongooseConnection: mongoose.connection
});

// Startup message
console.log(app_name + " is starting...");

// Setting up Express
app.set("view engine", "ejs");
app.use("/views", express.static(__dirname + '/views'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    store: MongoStoreIns,
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

// Socket IO middleware to authenticate the user
io.use(passportSocketIo.authorize({
    cookieParser: cookieParser,
    secret: config.sessions.token,
    store: MongoStoreIns,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
}));

// Socket IO
var connected_users = {}; // Object to store all of the connected users

io.on('connection', function(socket) {

    // Adding the user to the object
    connected_users[socket.request.user.google.id] = {
        id: socket.request.user.google.id,
        name: socket.request.user.google.name,
        profile_pic: socket.request.user.google.prof_image,
        socket: socket.id
    }

    // Altering the other users
    socket.broadcast.emit('new_user', connected_users[socket.request.user.google.id]);

    // Sending the new user list to the new user
    socket.emit('user_list', connected_users);

    // New message
    socket.on('new_message', function(message) {
        socket.broadcast.emit('new_message', message);
    });

    // Listening for a disconnect
    socket.on('disconnect', function() {
        socket.broadcast.emit('lost_user', socket.request.user.google.id);
        delete connected_users[socket.request.user.google.id]; // Deleting the user from the object
    });

});

function onAuthorizeSuccess(data, accept){
    accept(); //Let the user through
}

function onAuthorizeFail(data, message, error, accept){
    if (error) accept (new Error(message));
    console.log('failed connection to socket.io:', message);
    accept(null, false);
}

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
