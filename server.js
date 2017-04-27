/**
 * Created by Shivaji on 11/4/17.
 */
"use strict";
var restify = require('restify');
var server = restify.createServer();
server.use(restify.queryParser());
server.use(restify.bodyParser());
server.use(restify.CORS());
server.pre(restify.pre.sanitizePath());
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var db = mongoose.connect('mongodb://localhost/ngevents');
var Schema = mongoose.Schema;
// Schema
const ngeventsSchema = new Schema(
    {
        id: Number,
        name: String,
        date: Date,
        time: String,
        price: Number,
        imageUrl: String,
        location: {
            address: String,
            city: String,
            country: String
        },
        onlineUrl: String,
        sessions: [{
            id: Number,
            name: String,
            presenter: String,
            duration: Number,
            level: String,
            abstract: String,
            voters: [{type: String}]
        }]
    }
    ,
    {
        collection: 'events'
    }
);

mongoose.model('events', ngeventsSchema);
var Events = mongoose.model('events');


function getEvents(req, res, next) {
    Events.find().sort('id').exec(function (arr, data) {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.send(data);
    });
}
function getEvent(req, res, next) {
    Events.find({"id": req.params.id}).sort('id').exec(function (err, data) {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.send(data[0]);
    });
}

function postEvent(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    var options = {upsert: true, new: true, setDefaultsOnInsert: true};
    var event = JSON.parse(req.body);
    if (!event.id) {
        Events.count((err, count) => {
            if (err) {
                console.log('Error getting Count ' + err);
                return;
            }
            event.id = count + 1;
            new Events(event).save(function (err, doc) {
                if (err) {
                    console.log("Error:" + err);
                }
            });
        });
    } else {
        Events.findOneAndUpdate({"id": event.id}, event, options, function (err, doc) {
            if (err) {
                console.log("Error:" + err);
            }
        });
    }
    res.send(event);
}

function searchSessions(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    let searchTerm = req.query.searchTerm;
    Events.find({}).sort('id').exec(function (err, data) {
        let searchedSessions = [];
        data.forEach(event => {
            let matchingSessions = event.sessions.filter(session => session.name.toLocaleLowerCase().indexOf(searchTerm) > -1);
            matchingSessions = matchingSessions.map((session) => {
                let sessionTmp = session.toObject();
                sessionTmp.eventId = event.id;
                return sessionTmp;
            });
            searchedSessions = searchedSessions.concat(matchingSessions);
        });
        res.send(searchedSessions);
    });
}
let addOrDeleteVoter = function (eventId, sessionId, voterName, isAdd) {
    Events.find({"id": eventId}).sort('id').exec(function (err, data) {
        data.forEach(event => {
            event.sessions.forEach(session => {

                if (session.id == sessionId &&
                    (
                        (session.voters.indexOf(voterName) === -1 && isAdd ) ||
                        (session.voters.indexOf(voterName) > -1 && !isAdd )
                    )) {
                    if (isAdd) {
                        session.voters.push(voterName);
                    } else {
                        session.voters.splice(session.voters.indexOf(voterName), 1);
                    }
                    Events.findOneAndUpdate({"id": eventId}, event, {}, function (err, data) {
                        if (err) {
                            console.log("Error:" + err);
                        }
                    });
                }
            });
        });
    });
};
function addVoter(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    let eventId = req.params.eventId;
    let sessionId = req.params.sessionId;
    let voterName = req.params.voterName;
    addOrDeleteVoter(eventId, sessionId, voterName, true);
    res.send('');
}

function deleteVoter(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    let eventId = req.params.eventId;
    let sessionId = req.params.sessionId;
    let voterName = req.params.voterName;
    addOrDeleteVoter(eventId, sessionId, voterName, false);
    res.send('');
}
var isAuthenticated = false;
var user = {id: '1', firstName: 'Shivaji', 'lastName': 'Byrapaneni', 'userName': 'Shiv'};
function login(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    var loginData = JSON.parse(req.body);
    if (loginData.uname === 'Shiv' && loginData.pwd === 'Shiv') {
        isAuthenticated = true;
        res.send(user);
    }
    else {
        return next(new restify.ForbiddenError("Not this time"));
    }
}

function identify(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (isAuthenticated) {
        res.send(user);
    } else {
        res.send({});
    }
}

function updateUser(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    let userId = req.params.userId;
    if (user.id === userId) {
        user = req.body;
    }
    res.send({});
}

function logout(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    isAuthenticated = false;
    res.send({});
}

// Set up our routes and start the server
server.get('/events', getEvents);
server.get('/event/:id', getEvent);
server.post('/event', postEvent);
server.get('/sessions/search', searchSessions);
server.post('/event/:eventId/sessions/:sessionId/voters/:voterName', addVoter);
server.del('/event/:eventId/sessions/:sessionId/voters/:voterName', deleteVoter);
server.post('/login', login);
server.get('/identify', identify);
server.put('/user/:userId', updateUser);
server.post('/logout', logout);

server.listen(8080, function () {
    console.log('%s listening at %s', server.name, server.url);
});