/**
 * Created by Shivaji on 11/4/17.
 */
"use strict";
var restify = require('restify');
var server = restify.createServer();
server.use(restify.bodyParser());
server.pre(restify.pre.sanitizePath());
var mongoose = require('mongoose');
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
                console.log("Error:" + err);
                console.log(doc);
            });
        });
    } else {
        Events.findOneAndUpdate({"id": event.id}, event, options, function (err, doc) {
            console.log("Error:" + err);
            console.log(doc);
        });
    }
    res.send(event);
}

// Set up our routes and start the server
server.get('/events', getEvents);
server.get('/event/:id', getEvent);
server.post('/event', postEvent);

server.listen(8080, function () {
    console.log('%s listening at %s', server.name, server.url);
});