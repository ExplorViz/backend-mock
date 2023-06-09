const express = require("express");
const fs = require("fs");
const { readFile } = require("fs/promises");
const cors = require("cors");
const crypto = require("crypto");
const compression = require("compression");

const landscapeApp = createExpressApplication(8082);
const traceApp = createExpressApplication(8083);
const userApp = createExpressApplication(8084);

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

createLandscapeSample({
  filePrefix: "fibonacci",
  token: "17844195-6144-4254-a17b-0f7fb49adb0a"
});

createLandscapeSample({
  filePrefix: "petclinic-distributed",
  token: "26844195-7235-4254-a17b-0f7fb49adb0a"
});

createLandscapeSample({
  filePrefix: "petclinic",
  token: "19844195-7235-4254-a17b-0f7fb49adb0a",
  removeTraces: true
});

createLandscapeSample({
  filePrefix: "big-landscape",
  token: "a87167e5-8ec1-4b98-830a-dba87d213bb0"
});

createLandscapeSample({
  filePrefix: "study",
  token: "36844495-7235-4254-a17b-0f7fb49adb0a"
});

// BEGIN Increasing SL Sample
let previousStructure = null;
let topLevelPackageCounter = 0;
let artificialTopLevelPackageScaffold = {
  name: "1",
  subPackages: [],
  classes: [],
};

(async () => {
  const increasingSLToken = "12444195-6144-4254-a17b-0f7fb49adb0a";
  const increasingSLFilePrefix = "petclinic";

  const structureIncreasingSL = JSON.parse(await readFile(`demo-data/${increasingSLFilePrefix}-structure.json`));
  const dynamicIncreasingSL = JSON.parse(await readFile(`demo-data/${increasingSLFilePrefix}-dynamic.json`));

  landscapeApp.get(
    `${landscapeRootUrl}/${increasingSLToken}/structure`,
    (req, res) => {
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
    (req, res) => res.json(dynamicIncreasingSL)
  );
})();
// END Increasing SL Sample

/**
 * Creates and configures a express application instance.
 * @param {number} port 
 * @returns a express application instance
 */
function createExpressApplication(port) {
  const app = express();

  // Disable caching to prevent HTTP 304
  app.disable("etag");

  app.use(compression());
  app.use(cors());
  app.listen(port, () => {});

  return app;
}

/**
 * Create a sample landscape for the ExplorViz demo.
 * Loads the data and sets up express routes.
 * @param {{filePrefix: string; token: string; removeTraces?: boolean}} options 
 */
async function createLandscapeSample({filePrefix, token, removeTraces}) {
  const structureData = JSON.parse(await readFile(`demo-data/${filePrefix}-structure.json`));
  const dynamicData = JSON.parse(await readFile(`demo-data/${filePrefix}-structure.json`));

  landscapeApp.get(`${landscapeRootUrl}/${token}/structure`, (req, res) => res.json(structureData));
  traceApp.get(`${traceRootUrl}/${token}/dynamic`, (req, res) => {
    if (removeTraces) {
      return res.json(removeRandomTraces(dynamicData));
    }
    res.json(dynamicData)
  });
}

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
