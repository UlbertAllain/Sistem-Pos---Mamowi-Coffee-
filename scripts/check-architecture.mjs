import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { builtinModules } from 'node:module';

const root = resolve('.');
const srcRoot = join(root, 'src');
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const declaredPackages = new Set([
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.devDependencies ?? {}),
]);
const builtins = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);
const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const indexFiles = extensions.map((extension) => `/index${extension}`);
const findings = [];
const graph = new Map();

async function walk(directory) {
  const entries = await readdir(directory);
  const output = [];
  for (const entry of entries) {
    const path = join(directory, entry);
    const info = await stat(path);
    if (info.isDirectory()) output.push(...await walk(path));
    else if (extensions.includes(extname(path))) output.push(path);
  }
  return output;
}

async function resolveInternal(fromFile, specifier) {
  const base = specifier.startsWith('@/')
    ? join(srcRoot, specifier.slice(2))
    : resolve(dirname(fromFile), specifier);
  const candidates = [base, ...extensions.map((extension) => `${base}${extension}`), ...indexFiles.map((suffix) => `${base}${suffix}`)];
  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {
      // Try the next extension.
    }
  }
  return null;
}

function packageName(specifier) {
  if (specifier.startsWith('@')) return specifier.split('/').slice(0, 2).join('/');
  return specifier.split('/')[0];
}

const files = await walk(srcRoot);
for (const file of files) {
  const source = await readFile(file, 'utf8');
  const display = relative(root, file);
  const lineCount = source.split(/\r?\n/).length;
  if (lineCount > 250) findings.push(`${display}: terlalu besar (${lineCount} baris).`);
  if (/\b(?:TODO|FIXME|HACK)\b/.test(source)) findings.push(`${display}: marker TODO/FIXME/HACK ditemukan.`);
  if (/\b(?:as\s+any|:\s*any\b|<any>)/.test(source)) findings.push(`${display}: explicit any ditemukan.`);
  if (/console\.(?:log|debug|info)\s*\(/.test(source)) findings.push(`${display}: debug console ditemukan.`);
  if ((display.startsWith('src/app/') || display.startsWith('src/components/')) && /from\s+['"]firebase\/(?:firestore|auth)['"]/.test(source)) {
    findings.push(`${display}: UI tidak boleh mengakses Firebase langsung.`);
  }

  const dependencies = [];
  const importPattern = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1] ?? match[2];
    if (!specifier) continue;
    if (specifier.startsWith('.') || specifier.startsWith('@/')) {
      const target = await resolveInternal(file, specifier);
      if (!target) findings.push(`${display}: import tidak ditemukan: ${specifier}`);
      else dependencies.push(target);
      continue;
    }
    const pkg = packageName(specifier);
    if (!builtins.has(specifier) && !declaredPackages.has(pkg)) {
      findings.push(`${display}: package belum dideklarasikan: ${pkg}`);
    }
  }
  graph.set(file, dependencies);
}

const visiting = new Set();
const visited = new Set();
function visit(file, stack) {
  if (visiting.has(file)) {
    const start = stack.indexOf(file);
    const cycle = [...stack.slice(start), file].map((item) => relative(root, item)).join(' -> ');
    findings.push(`Circular dependency: ${cycle}`);
    return;
  }
  if (visited.has(file)) return;
  visiting.add(file);
  for (const dependency of graph.get(file) ?? []) visit(dependency, [...stack, file]);
  visiting.delete(file);
  visited.add(file);
}
for (const file of files) visit(file, []);

const uniqueFindings = [...new Set(findings)];
if (uniqueFindings.length) {
  console.error(`Architecture audit gagal:\n- ${uniqueFindings.join('\n- ')}`);
  process.exit(1);
}
process.stdout.write(`Architecture audit lulus untuk ${files.length} source file.\n`);
