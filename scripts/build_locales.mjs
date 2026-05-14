import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const GREEN = "\x1b[92m";
const BLUE = "\x1b[34m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[91m";
const RESET = "\x1b[0m";

const BASE_DIR = path.join(ROOT, "src", "features", "i18n", "messages");
const OUTPUT_DIR = path.join(ROOT, "src", "features", "i18n", "locales");

function logInfo(msg) {
  console.log(`${new Date().toISOString().slice(0, 19).replace("T", " ")} - INFO - ${msg}`);
}

function logWarning(msg) {
  console.log(`${new Date().toISOString().slice(0, 19).replace("T", " ")} - WARNING - ${msg}`);
}

function logError(msg) {
  console.log(`${new Date().toISOString().slice(0, 19).replace("T", " ")} - ERROR - ${msg}`);
}

/** @param {string} dir */
function* walkJsonFiles(dir) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) yield* walkJsonFiles(full);
    else if (st.isFile() && name.endsWith(".json")) yield full;
  }
}

/**
 * @param {string} langDirPath
 * @returns {Record<string, unknown>}
 */
function buildLanguageData(langDirPath) {
  const languageData = {};
  const jsonFiles = [...walkJsonFiles(langDirPath)].sort();

  if (jsonFiles.length === 0) {
    logWarning(`No JSON files found in ${langDirPath}`);
    return languageData;
  }

  for (const filepath of jsonFiles) {
    let data;
    try {
      const raw = fs.readFileSync(filepath, "utf8");
      data = JSON.parse(raw);
    } catch (e) {
      if (e instanceof SyntaxError) {
        logError(`${RED}Invalid JSON in file: ${filepath}${RESET}`);
      } else {
        logError(`${RED}Error reading file ${filepath}: ${e}${RESET}`);
      }
      continue;
    }

    const relativePath = path.relative(langDirPath, filepath);
    const dirParts = path.dirname(relativePath).split(path.sep).filter(Boolean);
    const stem = path.basename(relativePath, ".json");
    const parts = [...dirParts, stem];

    let currentLevel = languageData;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLeaf = i === parts.length - 1;
      if (isLeaf) {
        if (
          Object.prototype.hasOwnProperty.call(currentLevel, part) &&
          typeof currentLevel[part] === "object" &&
          currentLevel[part] !== null &&
          !Array.isArray(currentLevel[part])
        ) {
          logWarning(
            `${YELLOW}Key '${part}' from file ${filepath} conflicts with an existing directory structure. Overwriting potentially nested data.${RESET}`
          );
        }
        currentLevel[part] = data;
      } else {
        if (!Object.prototype.hasOwnProperty.call(currentLevel, part)) {
          currentLevel[part] = {};
        } else if (
          typeof currentLevel[part] !== "object" ||
          currentLevel[part] === null ||
          Array.isArray(currentLevel[part])
        ) {
          logWarning(
            `${YELLOW}Key '${part}' from directory structure conflicts with existing data from a file. Creating nested structure anyway, previous data might be lost.${RESET}`
          );
          currentLevel[part] = {};
        }
        currentLevel = /** @type {Record<string, unknown>} */ (currentLevel[part]);
      }
    }
  }

  return languageData;
}

function processAndOutputLanguages() {
  if (!fs.existsSync(BASE_DIR) || !fs.statSync(BASE_DIR).isDirectory()) {
    logError(`${RED}Base directory not found: ${BASE_DIR}${RESET}`);
    return;
  }

  try {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    logInfo(`Output directory set to: ${path.resolve(OUTPUT_DIR)}`);
  } catch (e) {
    logError(`${RED}Could not create output directory ${OUTPUT_DIR}: ${e}${RESET}`);
    return;
  }

  const languageDirs = fs
    .readdirSync(BASE_DIR)
    .map((name) => path.join(BASE_DIR, name))
    .filter((p) => fs.statSync(p).isDirectory());

  if (languageDirs.length === 0) {
    logWarning(`No language directories found in: ${BASE_DIR}`);
    return;
  }

  for (const langDirPath of languageDirs) {
    const langCode = path.basename(langDirPath);
    logInfo(`${BLUE}--- Processing language: ${langCode} ---${RESET}`);

    const langData = buildLanguageData(langDirPath);

    if (Object.keys(langData).length === 0) {
      logWarning(`No data generated for language '${langCode}', skipping output.`);
      continue;
    }

    const outputFilepath = path.join(OUTPUT_DIR, `${langCode}.json`);
    try {
      fs.writeFileSync(outputFilepath, JSON.stringify(langData, null, 2), "utf8");
      logInfo(
        `${GREEN}Successfully wrote combined messages for '${langCode}' to: ${outputFilepath}${RESET}`
      );
    } catch (e) {
      logError(`${RED}Could not write output file ${outputFilepath}: ${e}${RESET}`);
    }
  }
}

logInfo("Starting i18n message processing...");
processAndOutputLanguages();
logInfo("Processing finished.");
