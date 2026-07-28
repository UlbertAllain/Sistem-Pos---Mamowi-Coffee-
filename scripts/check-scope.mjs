import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, extname, join, relative, resolve } from "node:path";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDirectory, "..");
const sourceRoot = join(root, "src");

const forbidden = [
  "customers",
  "loyalty",
  "shifts",
  "ingredients",
  "expenses",
  "hold-orders",
  "/kds",
  "barista",
];

const findings = [];

async function walk(directory) {
  const entries = await readdir(directory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const filePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      await walk(filePath);
      continue;
    }

    if (![".ts", ".tsx", ".js", ".mjs"].includes(extname(entry.name))) {
      continue;
    }

    const text = (await readFile(filePath, "utf8")).toLowerCase();

    for (const token of forbidden) {
      if (text.includes(token)) {
        findings.push(`${relative(root, filePath)}: ${token}`);
      }
    }
  }
}

await walk(sourceRoot);

if (findings.length > 0) {
  console.error(
    `Scope POS tercemar oleh modul terlarang:\n${findings.join("\n")}`,
  );

  process.exit(1);
}

console.log("Scope audit lulus: hanya modul POS inti yang ditemukan.");
