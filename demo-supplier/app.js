var express = require('express');
var fs = require('fs');
var cors = require('cors')

var landscapeApp = express();
var traceApp = express();
var userApp = express();

var landscapePort = 8082;
var tracePort = 8083; 
var userPort = 8084;

var structure = {};
var dynamic = {};
var user = {};

var landscapeRootUrl = "/v2/landscapes";
var traceRootUrl = "/v2/landscapes";
var userRootUrl = "/user/:uid/token";

fs.readFile('./structure.json', (err, json) => {
  structure = JSON.parse(json);
});

fs.readFile('./dynamic.json', (err, json) => {
  dynamic = JSON.parse(json);
});

fs.readFile('./user.json', (err, json) => {
  user = JSON.parse(json);
});

traceApp.use(cors());
landscapeApp.use(cors());
userApp.use(cors());

traceApp.listen(tracePort, () => {});
landscapeApp.listen(landscapePort, () => {});
userApp.listen(userPort, () => {});

landscapeApp.get(`${landscapeRootUrl}/:token/structure`, function(req, res) {
  res.json(structure);
});

traceApp.get(`${traceRootUrl}/:token/dynamic`, function(req, res) {
  res.json(dynamic);
});

userApp.get(`${userRootUrl}`, function(req, res) {
  res.json(user);
});