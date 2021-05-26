const express = require('express');
const fs = require('fs');
const cors = require('cors')

const landscapeApp = express();
const traceApp = express();
const userApp = express();

// Disable caching to prevent HTTP 304
landscapeApp.disable('etag');
traceApp.disable('etag');
userApp.disable('etag');

const landscapePort = 8082;
const tracePort = 8083; 
const userPort = 8084;

traceApp.use(cors());
landscapeApp.use(cors());
userApp.use(cors());

traceApp.listen(tracePort, () => {});
landscapeApp.listen(landscapePort, () => {});
userApp.listen(userPort, () => {});

let user = {};

const landscapeRootUrl = "/v2/landscapes";
const traceRootUrl = "/v2/landscapes";
const userRootUrl = "/user/:uid/token";


fs.readFile('./user.json', (err, json) => {
  user = JSON.parse(json);
});

userApp.get(`${userRootUrl}`, function(req, res) {
  res.json(user);
});

// BEGIN Fibonacci Sample

const fibonacciToken = "17844195-6144-4254-a17b-0f7fb49adb0a";
const fibonacciFilePrefix = "fibonacci";
let structureFibonacci = {};
let dynamicFibonacci = {};

fs.readFile(`./${fibonacciFilePrefix}-structure.json`, (err, json) => {
  structureFibonacci = JSON.parse(json);
});

fs.readFile(`./${fibonacciFilePrefix}-dynamic.json`, (err, json) => {
  dynamicFibonacci = JSON.parse(json);
});

landscapeApp.get(`${landscapeRootUrl}/${fibonacciToken}/structure`, function(req, res) {
  res.json(structureFibonacci);
});

traceApp.get(`${traceRootUrl}/${fibonacciToken}/dynamic`, function(req, res) {
  res.json(dynamicFibonacci);
});

// END Fibonacci Sample

// BEGIN Petclinic-Distributed Sample

const petclinicDistributedToken = "26844195-7235-4254-a17b-0f7fb49adb0a";
const petclinicDistributedFilePrefix = "petclinic-distributed";
let structurePetclinicDistributed = {};
let dynamicPetclinicDistributed = {};

fs.readFile(`./${petclinicDistributedFilePrefix}-structure.json`, (err, json) => {
  structurePetclinicDistributed = JSON.parse(json);
});

fs.readFile(`./${petclinicDistributedFilePrefix}-dynamic.json`, (err, json) => {
  dynamicPetclinicDistributed = JSON.parse(json);
});

landscapeApp.get(`${landscapeRootUrl}/${petclinicDistributedToken}/structure`, function(req, res) {
  res.json(structurePetclinicDistributed);
});

traceApp.get(`${traceRootUrl}/${petclinicDistributedToken}/dynamic`, function(req, res) {
  res.json(dynamicPetclinicDistributed);
});

// END Petclinic-Distributed Sample

// BEGIN Petclinic Sample

const petclinicToken = "19844195-7235-4254-a17b-0f7fb49adb0a";
const petclinicFilePrefix = "petclinic";
let structurePetclinic = {};
let dynamicPetclinic = {};

fs.readFile(`./${petclinicFilePrefix}-structure.json`, (err, json) => {
  structurePetclinic = JSON.parse(json);
});

fs.readFile(`./${petclinicFilePrefix}-dynamic.json`, (err, json) => {
  dynamicPetclinic = JSON.parse(json);
});

landscapeApp.get(`${landscapeRootUrl}/${petclinicToken}/structure`, function(req, res) {
  res.json(structurePetclinic);
});

traceApp.get(`${traceRootUrl}/${petclinicToken}/dynamic`, function(req, res) {
  res.json(dynamicPetclinic);
});

// END Petclinic Sample