const fs = require("node:fs");
const path = require("node:path");

// tsc does not remove compiled files for deleted modules, so old routes can
// remain in Swagger's production glob after a feature is removed.
const project = path.resolve(__dirname, "..");
const output = path.resolve(project, "dist");
if (path.relative(project, output) !== "dist") {
  throw new Error("Refusing to clean a directory outside the backend build output");
}
fs.rmSync(output, { recursive: true, force: true });
