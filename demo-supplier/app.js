const express = require("express");
const { readFile } = require("node:fs/promises");
const cors = require("cors");
const compression = require("compression");
const {
  removeRandomTraces,
  recursivelyRandomizeAllHashCodesOfPackages,
  copyPackageAndTraces,
  createRandomHex,
} = require("./utils.js");

const landscapeApp = createExpressApplication(8082);
const traceApp = createExpressApplication(8083);
const userApp = createExpressApplication(8084);

const landscapeRootUrl = "/v2/landscapes";
const traceRootUrl = "/v2/landscapes";
const userRootUrl = "/user/:uid/token";

(async () => {
  const user = JSON.parse(await readFile("./user.json"));
  userApp.get(`${userRootUrl}`, (req, res) => res.json(user));
})();

createLandscapeSample({
  filePrefix: "plantuml",
  token: "7cd8a9a7-b840-4735-9ef0-2dbbfa01c039",
});

createLandscapeSample({
  filePrefix: "petclinic-distributed",
  token: "26844195-7235-4254-a17b-0f7fb49adb0a",
});

createLandscapeSample({
  filePrefix: "petclinic",
  token: "19844195-7235-4254-a17b-0f7fb49adb0a",
  traceModifier: removeRandomTraces,
});

createLandscapeSample({
  filePrefix: "big-landscape",
  token: "a87167e5-8ec1-4b98-830a-dba87d213bb0",
});

createLandscapeSample({
  filePrefix: "study",
  token: "36844495-7235-4254-a17b-0f7fb49adb0a",
});

createLandscapeSample({
  filePrefix: "vissoft23",
  token: "12444195-6144-4254-a17b-asdgfewefg",
});

createLandscapeSample({
  filePrefix: "petclinic",
  token: "1d8c9223-b790-4873-9b5d-fdf68cdc082f",
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
      const { packageCopy, newTraces } = copyPackageAndTraces(
        package,
        originalTraces
      );

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

{
  // BEGIN Increasing SL Sample
  let previousStructure = null;

  createLandscapeSample({
    filePrefix: "petclinic",
    token: "12444195-6144-4254-a17b-0f7fb49adb0a",
    structureModifier: (structureData) => {
      if (!previousStructure) {
        previousStructure = structuredClone(structureData);
        return previousStructure;
      }

      const node = structureData.nodes[0];
      const app = node.applications[0];
      const package = app.packages[0];

      const newStructure = addTopLevelPackageToFirstApplication(
        package,
        previousStructure
      );
      previousStructure = newStructure;

      return previousStructure;
    },
  });

  function addTopLevelPackageToFirstApplication(
    topLevelPackage,
    structureRecord
  ) {
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
 *  filePrefix: string;
 *  token: string;
 *  traceModifier?: DataModifier,
 *  structureModifier?: DataModifier,
 *  initializer?: (structure, trace) => void
 * }} options
 */
async function createLandscapeSample({
  filePrefix,
  token,
  traceModifier,
  structureModifier,
  initializer,
}) {
  const structureData = JSON.parse(
    await readFile(`demo-data/${filePrefix}-structure.json`)
  );
  const dynamicData = JSON.parse(
    await readFile(`demo-data/${filePrefix}-dynamic.json`)
  );

  structureData.landscapeToken = token;
  initializer?.(structureData, dynamicData);

  landscapeApp.get(`${landscapeRootUrl}/${token}/structure`, (req, res) =>
    res.json(
      structureModifier ? structureModifier(structureData) : structureData
    )
  );

  traceApp.get(`${traceRootUrl}/${token}/dynamic`, (req, res) =>
    res.json(traceModifier ? traceModifier(dynamicData) : dynamicData)
  );
}
