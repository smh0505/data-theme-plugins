import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const THEMES_DIR = "themes";
const ID_RE = /^[a-z0-9][a-z0-9-]*$/;

let ok = true;
function fail(msg) {
  console.error(`x ${msg}`);
  ok = false;
}

for (const dir of readdirSync(THEMES_DIR)) {
  const before = ok;
  const manifestPath = join(THEMES_DIR, dir, "manifest.json");
  if (!existsSync(manifestPath)) {
    fail(`${dir}: missing manifest.json`);
    continue;
  }

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch (e) {
    fail(`${dir}: invalid JSON (${e.message})`);
    continue;
  }

  if (!ID_RE.test(dir)) fail(`${dir}: folder name must be lowercase kebab-case`);
  if (manifest.id !== dir) fail(`${dir}: manifest id "${manifest.id}" must match folder name`);
  if (typeof manifest.name !== "string" || !manifest.name.trim()) fail(`${dir}: missing name`);
  if (typeof manifest.version !== "string" || !manifest.version.trim()) {
    fail(`${dir}: missing version`);
  }
  if (manifest.kind !== "theme") {
    fail(`${dir}: kind must be "theme" (matches source plugin manifests' own kind field, so Concourse's install-by-URL flow can tell plugin kinds apart)`);
  }

  const vars = manifest.cssVariables;
  if (typeof vars !== "object" || vars === null || Array.isArray(vars) || Object.keys(vars).length === 0) {
    fail(`${dir}: cssVariables must be a non-empty object`);
  } else {
    for (const [key, value] of Object.entries(vars)) {
      if (!key.startsWith("--")) fail(`${dir}: cssVariables key "${key}" must start with --`);
      if (typeof value !== "string") fail(`${dir}: cssVariables["${key}"] must be a string`);
    }
  }

  // fontFaces is functional (Concourse strictly validates every field before trusting it -
  // this is just a basic shape sanity check, not a substitute for that). url must be a
  // same-repo, commit-pinned raw.githubusercontent.com link - never a third-party CDN.
  if (manifest.fontFaces !== undefined) {
    if (!Array.isArray(manifest.fontFaces)) {
      fail(`${dir}: fontFaces must be an array`);
    } else {
      for (const face of manifest.fontFaces) {
        if (typeof face?.family !== "string" || typeof face?.url !== "string") {
          fail(`${dir}: each fontFaces entry needs a string family and url`);
        } else if (!face.url.startsWith("https://raw.githubusercontent.com/smh0505/data-theme-plugins/")) {
          fail(`${dir}: fontFaces["${face.family}"].url must be a commit-pinned raw.githubusercontent.com link into this repo, not a third-party CDN`);
        }
      }
    }
  }

  // fonts is pure attribution metadata (crediting the original font author) - not consumed by
  // Concourse at all, so this is just a basic shape check, not a security gate.
  if (manifest.fonts !== undefined) {
    if (!Array.isArray(manifest.fonts)) {
      fail(`${dir}: fonts must be an array`);
    } else {
      for (const font of manifest.fonts) {
        if (typeof font?.name !== "string" || typeof font?.author !== "string") {
          fail(`${dir}: each fonts entry needs a string name and author`);
        }
      }
    }
  }

  if (ok === before) console.log(`ok ${dir}`);
}

if (!ok) {
  console.error("\nTheme validation failed.");
  process.exit(1);
}
console.log("\nAll themes valid.");
