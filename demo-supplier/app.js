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
const evolutionApp = createExpressApplication(8085);

const spanRootUrl = "/v2/landscapes";
const userRootUrl = "/user/:uid/token";
const snapshotRootUrl = "/snapshot";
const evolutionRootUrl = "/v2/code";

const landscapes = [];

// Request for list of landscapes
(async () => {
  userApp.get(`${userRootUrl}`, (req, res) => res.json(landscapes));
})();

// Return empty list for snapshot requests
(async () => {
  userApp.get(`${snapshotRootUrl}`, (req, res) =>
    res.json({
      personalSnapshots: [],
      sharedSnapshots: [],
      subsricedSnapshots: [],
    })
  );
})();

iterateOverDemoData("demo-data");

async function iterateOverDemoData(directoryPath) {
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
  folder: "PetClinic Sample",
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
  folder: "PetClinic Sample",
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
    folder: "Distributed PetClinic Sample",
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
  let structureData, dynamicData, timestampData;

  try {
    structureData = JSON.parse(await readFile(`demo-data/${folder}/structure.json`));
  } catch {
    structureData = { landscapeToken: token, nodes: [] };
    console.error("Could not read structure data for:", folder);
  }

  const landscapeToken = token ? token : structureData.landscapeToken;

  spanApp.get(`${spanRootUrl}/${landscapeToken}/structure`, (req, res) =>
    res.json(structureModifier ? structureModifier(structureData) : structureData)
  );

  try {
    dynamicData = JSON.parse(await readFile(`demo-data/${folder}/dynamic.json`));
  } catch {
    dynamicData = [];
    console.error("Could not read dynamic data for:", folder);
  }

  spanApp.get(`${spanRootUrl}/${landscapeToken}/dynamic`, (req, res) =>
    res.json(traceModifier ? traceModifier(dynamicData) : dynamicData)
  );
  initializer?.(structureData, dynamicData);

  try {
    timestampData = JSON.parse(await readFile(`demo-data/${folder}/timestamps.json`));
  } catch {
    timestampData = [
      {
        epochMilli: 0,
        spanCount: 0,
      },
    ];
    console.error("Could not read timestamps for:", folder);
  }

  spanApp.get(`${spanRootUrl}/${landscapeToken}/timestamps`, async (req, res) => {
    const potentialLatestTimestamp = req.query.newest;
    const commit = req.query.commit;

    let timestampData;

    // Use try-catch block since we only provide a mockup for the evolution to the distributed-petclinic by now
    try {
      const commitIdToTimestampsMap = JSON.parse(
        await readFile(`demo-data/petclinic-distributed-commit-timestamps.json`)
      );
      timestampData = commit ? commitIdToTimestampsMap[commit] ?? [] : commitIdToTimestampsMap["cross-commit"];
    } catch (error) {
      timestampData = JSON.parse(await readFile(`demo-data/${folder}/timestamps.json`));
    }

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

  landscapes.push({
    value: landscapeToken,
    ownerId: "github|123456",
    created: timestampData && timestampData.length > 0 ? timestampData[0].epochMilli : 0,
    alias: alias ? alias : folder,
    sharedUsersIds: [],
  });

  try {
    await readFile(`demo-data/${folder}/application-names.json`);
    // Application names found => csode evolution data is present
    provideEvolutionData(folder, landscapeToken);
  } catch {
    // No demo data for code evolution - this is expected, do not throw error
    // Return empty list of applications since no data is available
    evolutionApp.get(`${evolutionRootUrl}/applications/${landscapeToken}`, (req, res) => {
      res.json([]);
    });
    return;
  }
}

async function provideEvolutionData(folder, landscapeToken) {
  // ToDo: Refactor such function can handle if individual files are missing
  try {
    const fileContentAppNames = await readFile(`demo-data/${folder}/application-names.json`);
    const applicationNames = JSON.parse(fileContentAppNames);

    const fileContentCommitTrees = await readFile(`demo-data/${folder}/commit-trees.json`);
    const appNameToCommitTreeMap = JSON.parse(fileContentCommitTrees);

    const fileContentStructures = await readFile(`demo-data/${folder}/evolution-structures.json`);
    const commitIdToStructureMap = JSON.parse(fileContentStructures);

    const fileContentMetrics = await readFile(`demo-data/${folder}/evolution-metrics.json`);
    const commitIdToMetricsMap = JSON.parse(fileContentMetrics);

    const fileContentCommitComparisons = await readFile(`demo-data/${folder}/commit-comparisons.json`);
    const commitIdsToCommitComparisonMap = JSON.parse(fileContentCommitComparisons);

    if (applicationNames) {
      evolutionApp.get(`${evolutionRootUrl}/applications/${landscapeToken}`, (req, res) => {
        res.json(applicationNames);
      });

      for (const appName of applicationNames) {
        evolutionApp.get(`${evolutionRootUrl}/commit-tree/${landscapeToken}/${appName}/`, (req, res) => {
          res.json(appNameToCommitTreeMap[appName]);
        });
        evolutionApp.get(`${evolutionRootUrl}/structure/${landscapeToken}/${appName}/:commitId`, (req, res) => {
          const landscapeStructure = commitIdToStructureMap[req.params["commitId"]] ?? { nodes: [] };
          landscapeStructure.landscapeToken = landscapeToken;
          res.json(landscapeStructure);
        });
        evolutionApp.get(`${evolutionRootUrl}/metrics/${landscapeToken}/${appName}/:commitId`, (req, res) => {
          const metrics = commitIdToMetricsMap[req.params["commitId"]] ?? {
            files: [],
            fileMetrics: [],
            classMetrics: [],
            methodMetrics: [],
          };
          res.json(metrics);
        });
        evolutionApp.get(
          `${evolutionRootUrl}/commit-comparison/${landscapeToken}/${appName}/:commitIds`,
          (req, res) => {
            const commitComparison = commitIdsToCommitComparisonMap[req.params["commitIds"]] ?? {
              modified: [],
              added: [],
              deleted: [],
              addedPackages: [],
              deletedPackages: [],
              metrics: [],
            };
            res.json(commitComparison);
          }
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
}
