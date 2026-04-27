const express = require("express");
const { readFile } = require("node:fs/promises");
const cors = require("cors");
const compression = require("compression");
const fs = require("fs");
const path = require("path");
const { removeRandomTraces, calculateTenSecondLaterNeighborTimestamp } = require("./utils.js");

const userApp = createExpressApplication(8084);
const persistenceApp = createExpressApplication(8085);

const userRootUrl = "/user/:uid/token";
const snapshotRootUrl = "/snapshot";
const v3BaseUrl = "/v3/landscapes";

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
      subscribedSnapshots: [],
    }),
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

        if (stats.isDirectory() && !folder.startsWith("v2")) {
          createLandscapeSample({ folder: folder });
        }
      });
    });
  });
}

// Expanding PetClinic
// createLandscapeSample({
//   folder: "PetClinic Sample",
//   token: "19844195-7235-4254-a17b-0f7fb49adb0a",
//   alias: "Petclinic Sample (Random traces and increasing, unrelated timestamps (with random gaps))",
//   traceModifier: removeRandomTraces,
//   timestampModifier: (latestTimestampEpochNano) => {
//     let nextTimestampNano = calculateTenSecondLaterNeighborTimestamp(parseInt(latestTimestampEpochNano));
//     let randomSpanCount = parseInt(Math.random() * (150 - 50) + 50);

//     if (Math.random() > 0.75) {
//       // Add 10 seconds in nanoseconds
//       nextTimestampNano += 10_000_000_000;
//     }

//     return {
//       epochNano: nextTimestampNano,
//       spanCount: randomSpanCount,
//     };
//   },
// });

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
  // traceModifier,
  // structureModifier,
  timestampModifier,
  // initializer,
}) {
  let structureData, dynamicData, timestampData;

  try {
    structureData = JSON.parse(await readFile(`demo-data/${folder}/structure.json`));
  } catch {
    structureData = { landscapeToken: token, nodes: [] };
    console.error("Could not read structure data for:", folder);
  }

  const landscapeToken = token ? token : (structureData.landscapeToken ?? folder);

  persistenceApp.get(`${v3BaseUrl}/${landscapeToken}/structure/runtime`, (req, res) => res.json(structureData));

  try {
    dynamicData = JSON.parse(await readFile(`demo-data/${folder}/dynamic.json`));
  } catch {
    dynamicData = [];
    console.error("Could not read dynamic data for:", folder);
  }

  persistenceApp.get(`${v3BaseUrl}/${landscapeToken}/dynamic`, (req, res) => res.json(dynamicData));

  persistenceApp.get(`${v3BaseUrl}/${landscapeToken}/file-communication`, (req, res) => res.json(dynamicData));

  try {
    timestampData = JSON.parse(await readFile(`demo-data/${folder}/timestamps.json`));
  } catch {
    timestampData = [
      {
        epochNano: 0,
        spanCount: 0,
      },
    ];
    console.error("Could not read timestamps for:", folder);
  }

  persistenceApp.get(`${v3BaseUrl}/${landscapeToken}/timestamps`, async (req, res) => {
    const potentialLatestTimestamp = req.query.newest;
    const commit = req.query.commit;

    let timestampDataToUse = timestampData;

    // Use try-catch block since we only provide a mockup for the evolution to the distributed-petclinic by now
    try {
      const commitIdToTimestampsMap = JSON.parse(
        await readFile(`demo-data/petclinic-distributed-commit-timestamps.json`),
      );
      timestampDataToUse = commit ? (commitIdToTimestampsMap[commit] ?? []) : commitIdToTimestampsMap["cross-commit"];
    } catch (error) {
      try {
        timestampDataToUse = JSON.parse(await readFile(`demo-data/${folder}/timestamps.json`));
      } catch (innerError) {
        // Fall back to the timestampData set earlier (or default if that also failed)
        timestampDataToUse = timestampData;
      }
    }

    // Ensure we have a valid array
    if (!timestampDataToUse || !Array.isArray(timestampDataToUse)) {
      timestampDataToUse = [
        {
          epochNano: 0,
          spanCount: 0,
        },
      ];
    }

    if (potentialLatestTimestamp && timestampModifier) {
      const newTimestamp = timestampModifier(potentialLatestTimestamp);

      if (newTimestamp) {
        timestampDataToUse.push(newTimestamp);
        res.json([newTimestamp]);
      } else {
        res.json([]);
      }
    } else {
      res.json(timestampDataToUse);
    }
  });

  landscapes.push({
    value: landscapeToken,
    ownerId: "github|123456",
    created: timestampData && timestampData.length > 0 ? timestampData[0].epochNano / 1000000 : 0,
    alias: alias ? alias : folder,
    sharedUsersIds: [],
  });

  try {
    await readFile(`demo-data/${folder}/repository-names.json`);
    // Repository names found => csode evolution data is present
    provideEvolutionData(folder, landscapeToken);
  } catch {
    // No demo data for code evolution - this is expected, do not throw error
    // Return empty list of applications since no data is available
    persistenceApp.get(`${v3BaseUrl}/${landscapeToken}/repositories`, (req, res) => {
      res.json([]);
    });
    return;
  }
}

async function provideEvolutionData(folder, landscapeToken) {
  persistenceApp.get(`${v3BaseUrl}/${landscapeToken}/repositories`, async (req, res) => {
    try {
      const fileContentRepoNames = await readFile(`demo-data/${folder}/repository-names.json`);
      const repositoryNames = JSON.parse(fileContentRepoNames);
      res.json(repositoryNames);
    } catch (error) {
      res.json([]);
    }
  });

  persistenceApp.get(`${v3BaseUrl}/${landscapeToken}/commit-tree/:repoName`, async (req, res) => {
    const repoName = req.params.repoName;

    const specificTreePath = `demo-data/${folder}/commit-tree-${repoName}.json`;
    if (fs.existsSync(specificTreePath)) {
      try {
        const fileContent = await readFile(specificTreePath);
        return res.json(JSON.parse(fileContent));
      } catch (e) {
        // continue to fallback
      }
    }

    try {
      const fileContentCommitTrees = await readFile(`demo-data/${folder}/commit-trees.json`);
      const repoNameToCommitTreeMap = JSON.parse(fileContentCommitTrees);
      return res.json(repoNameToCommitTreeMap[repoName] || {});
    } catch (error) {
      return res.json({});
    }
  });

  persistenceApp.get(`${v3BaseUrl}/${landscapeToken}/structure/evolution/:repoName/:commitIds`, async (req, res) => {
    const repoName = req.params.repoName;
    const commitIds = req.params.commitIds;

    const potentialFiles = [
      `demo-data/${folder}/commit-${repoName}-${commitIds}.json`,
      `demo-data/${folder}/${commitIds}.json`,
    ];

    for (const filePath of potentialFiles) {
      if (fs.existsSync(filePath)) {
        try {
          const fileContent = await readFile(filePath);
          return res.json(JSON.parse(fileContent));
        } catch (e) {
          // try next
        }
      }
    }

    res.json({
      cities: {},
      districts: {},
      buildings: {},
      classes: {},
      functions: {},
    });
  });
}
