exports.removeRandomTraces = removeRandomTraces;
exports.recursivelyRandomizeAllHashCodesOfPackages =
  recursivelyRandomizeAllHashCodesOfPackages;
exports.copyPackageAndTraces = copyPackageAndTraces;
exports.createRandomHex = createRandomHex;
exports.calculateTenSecondLaterNeighbourTimestamp =
  calculateTenSecondLaterNeighbourTimestamp;

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
  const uniqueTraceIds = new Set(traceArray.map((trace) => trace["traceId"]));

  // remove random count of uniqueTraceIds

  const itemsToRemove =
    uniqueTraceIds.size > 1
      ? Math.floor(Math.random() * uniqueTraceIds.size)
      : 1;

  const shuffledTraceIdArray = shuffle([...uniqueTraceIds]);
  shuffledTraceIdArray.splice(itemsToRemove);
  const remainingTraceIds = new Set(shuffledTraceIdArray);

  const randomizedTraces = traceArray.filter((trace) =>
    remainingTraceIds.has(trace["traceId"])
  );

  return randomizedTraces;
}

/**
 * Walks the package tree and changes the hash values of each method.
 * Can return a Map mapping old hashes to new hashes if an empty map is provided.
 * @param {any} topLevelPackageRecord
 * @param {Map<string, string> | undefined} hashMap
 * @returns {Map<string, string> | undefined}
 */
function recursivelyRandomizeAllHashCodesOfPackages(
  topLevelPackageRecord,
  hashMap
) {
  for (let clazz of topLevelPackageRecord.classes) {
    for (let method of clazz.methods) {
      const newHash = createRandomHex(64);

      if (hashMap) {
        hashMap.set(method.hashCode, newHash);
      }

      method.hashCode = newHash;
    }
  }

  for (let subPackage of topLevelPackageRecord.subPackages) {
    recursivelyRandomizeAllHashCodesOfPackages(subPackage, hashMap);
  }

  return hashMap;
}

function copyPackageAndTraces(package, traces) {
  const packageCopy = structuredClone(package);
  const hashMap = recursivelyRandomizeAllHashCodesOfPackages(
    packageCopy,
    new Map()
  );
  const newTraces = duplicateTraces(traces);

  // Switch traces to the new package:
  for (const trace of newTraces) {
    for (const span of trace.spanList) {
      const newHash = hashMap.get(span.hashCode);
      if (newHash) {
        span.hashCode = newHash;
      }
    }
  }

  return {
    packageCopy,
    newTraces,
  };
}

function duplicateTraces(traces) {
  const tracesCopy = structuredClone(traces);
  const spanIdMap = new Map();

  function getNewId(oldId) {
    if (oldId === "") {
      return "";
    }

    let newId = spanIdMap.get(oldId);

    if (newId === undefined) {
      newId = createRandomHex(16);
      spanIdMap.set(oldId, newId);
    }

    return newId;
  }

  // Change spanId and traceId
  for (const trace of tracesCopy) {
    trace.traceId = createRandomHex(32);

    for (const span of trace.spanList) {
      span.traceId = trace.traceId;

      span.spanId = getNewId(span.spanId);
      span.parentSpanId = getNewId(span.parentSpanId);
    }
  }

  return tracesCopy;
}

/**
 * Generate a random hex string of the given length.
 * @param {number} length
 * @returns {string}
 */
function createRandomHex(length) {
  let id = "";
  for (let i = 0; i < length; i++) {
    id += Math.floor(Math.random() * 16).toString(16);
  }
  return id;
}

function calculateTenSecondLaterNeighbourTimestamp(epochMilli) {
  return epochMilli + 10000;
}
