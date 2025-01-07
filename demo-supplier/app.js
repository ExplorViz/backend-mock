const express = require("express");
const { readFile } = require("node:fs/promises");
const cors = require("cors");
const compression = require("compression");
const fs = require("fs");
const path = require("path");
const {
  removeRandomTraces,
  recursivelyRandomizeAllHashCodesOfPackages,
  copyPackageAndTraces,
  createRandomHex,
  calculateTenSecondLaterNeighbourTimestamp,
} = require("./utils.js");

const spanApp = createExpressApplication(8083);
const userApp = createExpressApplication(8084);

const spanRootUrl = "/v2/landscapes";
const userRootUrl = "/user/:uid/token";

const landscapes = [];

(async () => {
  userApp.get(`${userRootUrl}`, (req, res) => res.json(landscapes));
})();

listFilesInDirectory("demo-data");

async function listFilesInDirectory(directoryPath) {
  fs.readdir(directoryPath, (err, folders) => {
    if (err) {
      console.error(`Error reading directory: ${err.message}`);
      return;
    }

    folders.forEach((folder) => {
      const filePath = path.join(directoryPath, folder);

      // Check if it's a file or a directory
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error getting stats for file: ${err.message}`);
          return;
        }

        if (stats.isDirectory()) {
          createLandscapeSample({ folder: folder });
        }
      });
    });
  });
}

// Expanding PetClinic
createLandscapeSample({
  folder: "Petclinic Sample",
  token: "19844195-7235-4254-a17b-0f7fb49adb0a",
  alias: "Petclinic Sample (Random traces and increasing, unrelated timestamps (with random gaps))",
  traceModifier: removeRandomTraces,
  timestampModifier: (latestTimestandEpochMilli) => {
    let nextTimestampMilli = calculateTenSecondLaterNeighbourTimestamp(parseInt(latestTimestandEpochMilli));
    let randomSpanCount = parseInt(Math.random() * (150 - 50) + 50);

    if (Math.random() > 0.75) {
      nextTimestampMilli += 10000;
    }

    return {
      epochMilli: nextTimestampMilli,
      spanCount: randomSpanCount,
    };
  },
});

// BEGIN BIG SL Sample
createLandscapeSample({
  folder: "Petclinic Sample",
  token: "1d8c9223-b790-4873-9b5d-fdf68cdc082f",
  alias: "Large Landscape Sample",
  initializer: (structure, traces) => {
    const originalTraces = structuredClone(traces);

    const node = structure.nodes[0];
    const app = node.applications[0];
    const package = app.packages[0];

    app.name = "large-demo-landscape";

    app.packages.unshift({
      name: "changing",
      subPackages: [],
      classes: Array.from({ length: 12 }, () => ({
        name: "C" + createRandomHex(6),
        methods: [],
      })),
    });

    for (let i = 0; i < 15; i++) {
      const { packageCopy, newTraces } = copyPackageAndTraces(package, originalTraces);

      app.packages.push({
        name: `petclinic${i}`,
        subPackages: [packageCopy],
        classes: [],
      });

      traces.push(...newTraces);
    }
  },
  structureModifier: (structure) => {
    const changingPackage = structure.nodes[0].applications[0].packages[0];
    changingPackage.classes.forEach((c) => (c.name = "C" + createRandomHex(6)));
    return structure;
  },
});
// END BIG SL Sample

{
  // BEGIN Increasing SL Sample
  let previousStructure = null;

  createLandscapeSample({
    folder: "Distributed Petclinic Sample",
    token: "12444195-6144-4254-a17b-0f7fb49adb0a",
    alias: "Expanding Sample (Expanding structure and increasing, unrelated timestamps)",
    structureModifier: (structureData) => {
      if (!previousStructure) {
        previousStructure = structuredClone(structureData);
        return previousStructure;
      }

      const node = structureData.nodes[0];
      const app = node.applications[0];
      const package = app.packages[0];

      const newStructure = addTopLevelPackageToFirstApplication(package, previousStructure);
      previousStructure = newStructure;

      return previousStructure;
    },
    timestampModifier: (latestTimestandEpochMilli) => {
      const nextTimestampMilli = calculateTenSecondLaterNeighbourTimestamp(parseInt(latestTimestandEpochMilli));
      const randomSpanCount = parseInt(Math.random() * (150 - 50) + 50);

      return {
        epochMilli: nextTimestampMilli,
        spanCount: randomSpanCount,
      };
    },
  });

  function addTopLevelPackageToFirstApplication(topLevelPackage, structureRecord) {
    const deepCopyPackage = structuredClone(topLevelPackage);
    recursivelyRandomizeAllHashCodesOfPackages(deepCopyPackage);

    const node = structureRecord.nodes[0];
    const app = node.applications[0];

    const newTopLevelPackage = {
      name: `copy${app.packages.length - 1}`,
      subPackages: [deepCopyPackage],
      classes: [],
    };

    app.packages.push(newTopLevelPackage);

    return structureRecord;
  }
} // END Increasing SL Sample

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
 * @typedef {(data: any) => any} DataModifier
 */

/**
 * Create a sample landscape for the ExplorViz demo.
 * Loads the data and sets up express routes.
 * @param {{
 *  folder: string;
 *  token: string;
 *  traceModifier?: DataModifier,
 *  structureModifier?: DataModifier,
 *  timestampModifier?: DataModifier,
 *  initializer?: (structure, trace) => void
 * }} options
 */
async function createLandscapeSample({
  folder,
  token,
  alias,
  traceModifier,
  structureModifier,
  timestampModifier,
  initializer,
}) {
  let structureData;
  let dynamicData;
  let timestampData;
  try {
    structureData = JSON.parse(await readFile(`demo-data/${folder}/structure.json`));
    dynamicData = JSON.parse(await readFile(`demo-data/${folder}/dynamic.json`));
    timestampData = JSON.parse(await readFile(`demo-data/${folder}/timestamps.json`));
  } catch {
    console.error("Could not read files for folder:", folder);
    return;
  }

  const landscapeToken = token ? token : structureData.landscapeToken;

  landscapes.push({
    value: landscapeToken,
    ownerId: "github|123456",
    created: timestampData.length > 0 ? timestampData[0].epochMilli : 0,
    alias: alias ? alias : folder,
    sharedUsersIds: [],
  });

  initializer?.(structureData, dynamicData);

  spanApp.get(`${spanRootUrl}/${landscapeToken}/structure`, (req, res) =>
    res.json(structureModifier ? structureModifier(structureData) : structureData)
  );

  spanApp.get(`${spanRootUrl}/${landscapeToken}/dynamic`, (req, res) =>
    res.json(traceModifier ? traceModifier(dynamicData) : dynamicData)
  );

  spanApp.get(`${spanRootUrl}/${landscapeToken}/timestamps`, (req, res) => {
    const potentialLatestTimestamp = req.query.newest;
    if (potentialLatestTimestamp && timestampModifier) {
      const newTimestamp = timestampModifier(potentialLatestTimestamp);

      if (newTimestamp) {
        timestampData.push(newTimestamp);
        res.json([newTimestamp]);
      } else {
        res.json([]);
      }
    } else {
      res.json(timestampData);
    }
  });
}
