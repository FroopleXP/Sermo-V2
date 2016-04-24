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
    flash = require('connect-flash'),
    xssFilters = require('xss-filters');

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
    // Checking whether they're logged in else where
    if (connected_users[req.user.google.id] == undefined) {
        res.render('profile', { user: req.user, title: app_name + " | Home", app_name: app_name, auth: true });
    } else if (connected_users[req.user.google.id] !== undefined) {
        res.render('profile', { user: req.user, title: app_name + " | Home", app_name: app_name, auth: false });
    }
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

    connected_users[socket.request.user.google.id] = {
        id: socket.request.user.google.id,
        name: socket.request.user.google.name,
        profile_pic: socket.request.user.google.prof_image,
        socket: socket.id
    }

    // Altering the other users
    socket.broadcast.emit('new_user', connected_users[socket.request.user.google.id]);

    // Preparing the welcome object for the newly connected user
    var welcome_object = {
        message: "Welcome, " + socket.request.user.google.name + ". You are connected to the Sermo network.",
        sender: "Sermo Bot",
        sender_pic: "./views/img/serm_bot.gif"
    }

    // Welcoming the new user
    socket.emit('welcome_message', welcome_object);

    // Sending the new user list to the new user
    socket.emit('user_list', connected_users);

    // New message
    socket.on('new_message', function(message) {

        // Cleaning the message
        var clean_message = xssFilters.inHTMLData(message),
            message_data = {
                message: clean_message,
                sender: socket.request.user.google.name,
                sender_pic: socket.request.user.google.prof_image,
                sender_id: socket.request.user.google.id
            }

        // Sending the message along with other data to users
        socket.broadcast.emit('new_message', message_data);

    });

    // Listening for a disconnect
    socket.on('disconnect', function() {
        socket.broadcast.emit('lost_user', socket.request.user.google.id); // Telling the others
        delete connected_users[socket.request.user.google.id]; // Deleting the user from the object
    });

});

// If the SocketIO Auth was successfull
function onAuthorizeSuccess(data, accept){
    accept(); //Let the user through
}

// If SocketIO Auth failed!
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
