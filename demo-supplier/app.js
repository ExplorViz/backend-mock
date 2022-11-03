const express = require("express");
const fs = require("fs");
const cors = require("cors");
const crypto = require("crypto");
const compression = require("compression");

const landscapeApp = express();
const traceApp = express();
const userApp = express();

// Disable caching to prevent HTTP 304
landscapeApp.disable("etag");
traceApp.disable("etag");
userApp.disable("etag");

landscapeApp.use(compression());
traceApp.use(compression());
userApp.use(compression());

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

fs.readFile("./user.json", (err, json) => {
  user = JSON.parse(json);
});

userApp.get(`${userRootUrl}`, function (req, res) {
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

landscapeApp.get(
  `${landscapeRootUrl}/${fibonacciToken}/structure`,
  function (req, res) {
    res.json(structureFibonacci);
  }
);

traceApp.get(`${traceRootUrl}/${fibonacciToken}/dynamic`, function (req, res) {
  res.json(dynamicFibonacci);
});

// END Fibonacci Sample

// BEGIN Petclinic-Distributed Sample

const petclinicDistributedToken = "26844195-7235-4254-a17b-0f7fb49adb0a";
const petclinicDistributedFilePrefix = "petclinic-distributed";
let structurePetclinicDistributed = {};
let dynamicPetclinicDistributed = {};

fs.readFile(
  `./${petclinicDistributedFilePrefix}-structure.json`,
  (err, json) => {
    structurePetclinicDistributed = JSON.parse(json);
  }
);

fs.readFile(`./${petclinicDistributedFilePrefix}-dynamic.json`, (err, json) => {
  dynamicPetclinicDistributed = JSON.parse(json);
});

landscapeApp.get(
  `${landscapeRootUrl}/${petclinicDistributedToken}/structure`,
  function (req, res) {
    res.json(structurePetclinicDistributed);
  }
);

traceApp.get(
  `${traceRootUrl}/${petclinicDistributedToken}/dynamic`,
  function (req, res) {
    res.json(dynamicPetclinicDistributed);
  }
);

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

landscapeApp.get(
  `${landscapeRootUrl}/${petclinicToken}/structure`,
  function (req, res) {
    res.json(structurePetclinic);
  }
);

traceApp.get(`${traceRootUrl}/${petclinicToken}/dynamic`, function (req, res) {
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

landscapeApp.get(
  `${landscapeRootUrl}/${bigLandscapeToken}/structure`,
  function (req, res) {
    res.json(structureBigLandscape);
  }
);

traceApp.get(
  `${traceRootUrl}/${bigLandscapeToken}/dynamic`,
  function (req, res) {
    res.json(dynamicBigLandscape);
  }
);

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

landscapeApp.get(
  `${landscapeRootUrl}/${studyToken}/structure`,
  function (req, res) {
    res.json(structureStudy);
  }
);

traceApp.get(`${traceRootUrl}/${studyToken}/dynamic`, function (req, res) {
  res.json(dynamicStudy);
});

// END Study Sample

// BEGIN Increasing SL Sample

const increasingSLToken = "12444195-6144-4254-a17b-0f7fb49adb0a";
const increasingSLFilePrefix = "petclinic";
let structureIncreasingSL = {};
let dynamicIncreasingSL = {};

fs.readFile(`./${increasingSLFilePrefix}-structure.json`, (err, json) => {
  structureIncreasingSL = JSON.parse(json);
});

fs.readFile(`./${increasingSLFilePrefix}-dynamic.json`, (err, json) => {
  dynamicIncreasingSL = JSON.parse(json);
});

let previousStructure = null;
let topLevelPackageCounter = 0;
let artificialTopLevelPackageScaffold = {
  name: "1",
  subPackages: [],
  classes: [],
};

landscapeApp.get(
  `${landscapeRootUrl}/${increasingSLToken}/structure`,
  async (req, res) => {
    if (previousStructure) {
      const node = structureIncreasingSL.nodes[0];
      const app = node.applications[0];
      const package = app.packages[0];

      const newStructure = addTopLevelPackageToFirstApplication(
        package,
        previousStructure
      );
      previousStructure = JSON.parse(JSON.stringify(newStructure));
    } else {
      previousStructure = JSON.parse(JSON.stringify(structureIncreasingSL));
    }
    res.json(previousStructure);
  }
);

traceApp.get(
  `${traceRootUrl}/${increasingSLToken}/dynamic`,
  function (req, res) {
    res.json(dynamicIncreasingSL);
  }
);

// END Increasing SL Sample

function addTopLevelPackageToFirstApplication(structureRecord) {
  const oldTopLevelPackages = [];

  const node = structureRecord.nodes[0];
  const app = node.applications[0];

  for (let package of app.packages) {
    oldTopLevelPackages.push(JSON.parse(JSON.stringify(package)));
  }

  const newTopLevelPackage = JSON.parse(
    JSON.stringify(artificialTopLevelPackageScaffold)
  );

  newTopLevelPackage.name = topLevelPackageCounter.toString();
  newTopLevelPackage.subPackages = oldTopLevelPackages;

  app.packages = [newTopLevelPackage];

  topLevelPackageCounter++;

  return structureRecord;
}

function addTopLevelPackageToFirstApplication(
  topLevelPackage,
  structureRecord
) {
  const deepCopyPackage = JSON.parse(JSON.stringify(topLevelPackage));
  recursivelyRandomizeAllHashCodesOfPackages(deepCopyPackage);

  const node = structureRecord.nodes[0];
  const app = node.applications[0];

  const newTopLevelPackage = JSON.parse(
    JSON.stringify(artificialTopLevelPackageScaffold)
  );

  newTopLevelPackage.name = topLevelPackageCounter.toString();

  newTopLevelPackage.subPackages = [deepCopyPackage];

  const siblingWithRandomHashCodes = JSON.stringify(newTopLevelPackage);

  app.packages.push(JSON.parse(siblingWithRandomHashCodes));

  topLevelPackageCounter++;

  return structureRecord;
}

function addSiblingPackageToFirstApplication(structureRecord) {
  const topLevelPackages = [];

  const node = structureRecord.nodes[0];
  const app = node.applications[0];

  for (let package of app.packages) {
    topLevelPackages.push(JSON.parse(JSON.stringify(package)));
  }

  const newTopLevelPackage = JSON.parse(
    JSON.stringify(artificialTopLevelPackageScaffold)
  );

  newTopLevelPackage.name = topLevelPackageCounter.toString();

  for (let package of topLevelPackages) {
    recursivelyRandomizeAllHashCodesOfPackages(package);
  }

  newTopLevelPackage.subPackages = topLevelPackages;

  const siblingWithRandomHashCodes = JSON.stringify(newTopLevelPackage);

  app.packages.push(JSON.parse(siblingWithRandomHashCodes));

  topLevelPackageCounter++;

  return structureRecord;
}

function recursivelyRandomizeAllHashCodesOfPackages(topLevelPackageRecord) {
  for (let clazz of topLevelPackageRecord.classes) {
    for (let method of clazz.methods) {
      const secret = "abcdefg";
      const hash = crypto
        .createHmac("sha256", secret)
        .update("MyFancyMessageMega")
        .digest("hex");

      method.hashCode = hash;
    }
  }

  for (let subPackage of topLevelPackageRecord.subPackages) {
    recursivelyRandomizeAllHashCodesOfPackages(subPackage);
  }
}

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
    if (traceId && !uniqueTraceIds.includes(traceId)) {
      uniqueTraceIds.push(traceId);
    }
  }

  // remove random count of uniqueTraceIds

  let itemsToRemove =
    uniqueTraceIds.length > 1
      ? Math.floor(Math.random() * uniqueTraceIds.length)
      : 1;

  let shuffledTraceIdArray = shuffle(uniqueTraceIds);
  shuffledTraceIdArray.splice(itemsToRemove);

  const randomizedTraces = traceArray.filter((trace) =>
    shuffledTraceIdArray.includes(trace["traceId"])
  );

  return randomizedTraces;
}
