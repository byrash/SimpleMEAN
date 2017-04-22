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
    Events.find({"id": req.params.id}).sort('id').exec(function (arr, data) {
        res.setHeader('Access-Control-Allow-Origin', '*')
        console.log(data[0]);
        res.send(data[0]);
    });
}

function postEvents(req, res, next) {
    console.log(req.body);
    new Events(JSON.parse(req.body)).save(function (err, doc) {
        console.log(err);
        console.log(doc);
        res.send(JSON.parse(req.body));
    });
}

// Set up our routes and start the server
server.get('/events', getEvents);
server.get('/event/:id', getEvent);
server.post('/events', postEvents);

server.listen(8080, function () {
    console.log('%s listening at %s', server.name, server.url);
});