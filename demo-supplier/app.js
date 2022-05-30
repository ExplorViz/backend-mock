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
    res.json(removeRandomTraces(dynamicPetclinic));
});

// END Petclinic Sample

// BEGIN Big Landscape Sample

const bigLandscapeToken = "a87167e5-8ec1-4b98-830a-dba87d213bb0";
const bigLandscapeFilePrefix = "big-landscape";
let structureBigLandscape = {};
let dynamicBigLandscape = {};

fs.readFile(`./${bigLandscapeFilePrefix}-structure.json`, (err, json) => {
  structureBigLandscape = JSON.parse(json);
});

fs.readFile(`./${bigLandscapeFilePrefix}-dynamic.json`, (err, json) => {
  dynamicBigLandscape = JSON.parse(json);
});

landscapeApp.get(`${landscapeRootUrl}/${bigLandscapeToken}/structure`, function(req, res) {
  res.json(structureBigLandscape);
});

traceApp.get(`${traceRootUrl}/${bigLandscapeToken}/dynamic`, function(req, res) {
  res.json(dynamicBigLandscape);
});

// END Big Landscape Sample

// BEGIN Study Sample

const studyToken = "36844495-7235-4254-a17b-0f7fb49adb0a";
const studyFilePrefix = "study";
let structureStudy = {};
let dynamicStudy = {};

fs.readFile(`./${studyFilePrefix}-structure.json`, (err, json) => {
  structureStudy = JSON.parse(json);
});

fs.readFile(`./${studyFilePrefix}-dynamic.json`, (err, json) => {
  dynamicStudy = JSON.parse(json);
});

landscapeApp.get(`${landscapeRootUrl}/${studyToken}/structure`, function(req, res) {
  res.json(structureStudy);
});

traceApp.get(`${traceRootUrl}/${studyToken}/dynamic`, function(req, res) {
  res.json(dynamicStudy);
});

// END Study Sample

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 * https://stackoverflow.com/a/6274381
 */
 function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function removeRandomTraces(traceArray) {
  const uniqueTraceIds = [];

  for (const trace of traceArray) {
    const traceId = trace["traceId"];
    if(traceId && !uniqueTraceIds.includes(traceId)) {
      uniqueTraceIds.push(traceId);
    }
  }

  // remove random count of uniqueTraceIds

  let itemsToRemove = uniqueTraceIds.length > 1 ? Math.floor(Math.random() * uniqueTraceIds.length) : 1;

  let shuffledTraceIdArray = shuffle(uniqueTraceIds);
  shuffledTraceIdArray.splice(itemsToRemove);

  const randomizedTraces = traceArray.filter(trace => shuffledTraceIdArray.includes(trace["traceId"]));

  return randomizedTraces;
}
