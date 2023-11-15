
/*
    NODE MODULE SETUP
*/

const express = require('express');
const app = express();

const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const sanitize = require('mongo-sanitize');
const Validator = require('validatorjs');

const MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
var mongoose = require('mongoose');
const { isInteger } = require('lodash');

// these throw errors: ("${key} is an invalid option")
//mongoose.set('useNewUrlParser', true); 
//mongoose.set('useFindAndModify', false);
//mongoose.set('useCreateIndex', true);

const PORT = process.env.port || 8080;
const DB_NAME = "mydb";
const url = "mongodb://localhost:27017/";  

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    highscore: {
        type: Number,
        required: false
    }
});

// hashing a password before saving it to the database
UserSchema.pre('save', function (next) {
    var user = this;
    //https://stackoverflow.com/questions/6832445/how-can-bcrypt-have-built-in-salts
    bcrypt.hash(user.password, 10, function (err, hash) {
        if (err) {
            return next(err);
        }
        user.password = hash;
        next();
    })
});

// Method to authenticate input against database
UserSchema.statics.authenticate = function (userData, req, res) {
    User.findOne({
            username: userData.username
        })
        .exec(function (err, user) {
            if (err) {
                return res.render("error.ejs", {
                    errors: 2
                });
            } else if (!user) {
                var err = new Error('User not found.');
                err.status = 401;
                return res.render("error.ejs", {
                    errors: 2
                });
            }
            // if we get here, we didn't hit an error
            bcrypt.compare(userData.password, user.password, function (err, result) {
                if (result === true) { //password hashes match
                    // set up session id
                    req.session.userId = user._id;

                    //return res.redirect("/edit/" + user._id);
                    return res.render("userPlay.ejs", {
                        username: user.username,
                        highscore: user.highscore || 0
                    });
                }
                return res.redirect("/login");
            })
        });
}

// for data validation later
var rules = {
    username: "required",
    password: "required"
}

var User = mongoose.model('User', UserSchema);
module.exports = User;

app.use(session({
    secret: "secret string, should be stored in environment variable",
    resave: true,
    saveUninitialized: false
}));

// additions for mongoose connection to 'users' db
mongoose.connect(url + "users", {
    useNewUrlParser: true, 
    useUnifiedTopology: true
});

const mongooseDB = mongoose.connection;
mongooseDB.on("error", console.error.bind(console, "Mongoose DB Connection Error: "));

const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => { db = client.db("users").collection("users"); });
//
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(express.static("public"));

app.listen(PORT, function () {
    console.log('Server is listening on port ' + PORT);
});

/*
    GET, POST, ROUTE FUNCTIONS
*/

app.get('/', function(req, res){
    // is there a session?
    if(req.session.userId){
        // authenticate user
        validateSession(req.session.userId, res);
        res.redirect("/show");
    } else {
        return res.redirect("/login");
    }
});

app.route("/login")
    .get((req, res) => {
        let errors = {
            usernameError: "",
            passwordError: ""
        }
        res.render("login.ejs", errors);
    })
    .post((req, res) => {
        if(req.body.username && req.body.password) {
            var userData = {
                username: req.body.username,
                password: req.body.password
            }
            let temp = User.authenticate(userData, req, res);
            let temp2 = 0;
        }
    });


app.get("/logout", function(req, res) {
    if(req.session){
        req.session.destroy(function (err) {
            if(err){
                return next(err);
            } else {
                return res.redirect("/");
            }
        });
    }
});


/*
    Database Manipulation: From Class Code
*/

// CREATE
app.post("/show", (req, res) => {
    db.insertOne(req.body, (err, result) => {
        if(err) return console.log("Error: " + err);
        console.log("Successfully saved to database!");
        res.redirect("/show");
    })
})

// READ
app.get("/show", (req, res) => {
    //require authenticated user to see this page
    //check if there is a session
    if (req.session.userId) {
        //authenticate        
        validateSession(req.session.userId, res);
        //if invalid we will be redirected, otherwise we'll hit this block
        db.find().toArray((err, results) => {
            if (err) return console.log("Error: " + err);
            res.render("show.ejs", {
                users: results
            });
        });
    } else { //no session data, log in first
        return res.redirect("/login");
    }
});

// Also CREATE
app.route("/register")
    .get((req, res) => {
        let errors = {
            usernameError: "",
            passwordError: ""
        }
        res.render("register.ejs", errors);
    })
    .post((req, res) => {
        if(req.body.username && req.body.password) {
            var userData = {
                username: req.body.username,
                password: req.body.password
            }
            User.create(userData, function (err, user){
                if(err){
                    console.log(err);
                    let errors = {
                        usernameError: "Invalid Username",
                        passwordError: "Invalid Password"
                    }
                    res.render("register.ejs", errors)
                } else {
                    return res.redirect("/show")
                }
            });
        }
    });

// UPDATE
app.route("/edit/:id")
    .get((req, res) => {
        let id = req.params.id;
        db.find(ObjectId(id)).toArray((err, result) => {
            if (err) return console.log("Error: " + err);
            if(result == null || result.length == 0){
                res.render("error.ejs", {
                    errors: 1
                });
            } else {
                res.render("edit.ejs", {
                    users: result
                });
            }
        });
    })
    .post((req, res) => {   // DATA VALIDATION
        let id = req.params.id;

        // our POST data

        // " What are we updating? "
        if(req.body.highscore){
            db.updateOne({
                _id: ObjectId(id)
            }, {
                $set: {
                    highscore: data.highscore
                }
            }, (err, results) => {
                if (err) return res.send(err);
                console.log("Successfully Updated!"); 
                return res.render("userPlay.ejs");               
            });
        } else {
            let data = {
                username: req.body.username,
                password: req.body.password
            }
            let validation = new Validator(data, rules);
            console.log("Validation Passes: " + validation.passes() + " Validation Fails: " + validation.fails());

        
            if (validation.fails()) {
                let errorsList = {
                    username: validation.errors.first("username"),
                    password: validation.errors.first("password")
                };
                res.render("error.ejs", {
                    errors: errorsList
                });
            } else {
                
                // TODO : TEST                                              Too Bad
                // need to hash the new password
                bcrypt.hash(data.password, 10, function (err, hash) {
                    if (err) {
                        return next(err);
                    }
                    data.password = hash;
                    next();
                })
                db.updateOne({
                    _id: ObjectId(id)
                }, {
                    $set: {
                        username: data.username,
                        password: data.password
                    }
                }, (err, results) => {
                    // console.log("Number: " + results.result.n + " Number Modified: " + results.result.nModified + " Update Status: " + results.result.ok);
                    // DEBUG: n is undefined (results.result.n)
                    if (err) return res.send(err);
                    console.log("Successfully Updated!"); 
                    return res.redirect("/show")               
                })
            }
        }
    });


// DELETE
// app.route("/delete/:id")
//     .get((req, res) => {
//         let id = req.params.id;
        
//         let query = {
//             _id: ObjectId(id)
//         };
//         db.find(query).toArray(function (err, result) {
//             if(err) throw err;
//             console.log("Deleted from the database: " + JSON.stringify(result));
//         });

//         db.deleteOne({
//             _id: ObjectId(id)
//         }, (err, result) => {
//             if(err)return res.send(500, err);
//             console.log("Entry Removed from Database");
//             res.redirect("/show");
//         });
//     })

// Presentation Set Up

app.use('/static', express.static('static'))
app.get("/index.html", function(req, res) {
    res.redirect("/index.html");
});

/*
    Validation and Security
*/

function validateSession(_id, res) {
    if (_id != "") {
        //authenticate
        User.findOne({
            _id: _id
        }).exec(function (err, user) {
            if (err) {
                return res.render("error.ejs", {
                    errors: 2
                });
            } else if (!user) {
                var err = new Error('User not found.');
                err.status = 401;
                return res.render("error.ejs", {
                    errors: 2
                });
            }
            return res.redirect("/show");
        });

    } else {
        //redirect to log in
        return res.redirect("/login");
    }
};