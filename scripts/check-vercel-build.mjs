import { access, readdir, readFile } from 'node:fs/promises';
import { dirname, extname, relative, resolve, sep } from 'node:path';

const outputDirectory = resolve(process.argv[2] || 'public');
const failures = [];

const expectedPages = [
  'index.html',
  'sa/index.html',
  'qa/index.html',
  'qa/a/index.html',
  'qa/b/index.html',
  'course/index.html',
  'minicourse/index.html',
  'pythonbackend/index.html',
  'content/index.html',
  'blog/index.html',
  'blog/chto-takoe-qa/index.html',
];

const forbiddenNames = new Set([
  '.env',
  '.gitignore',
  '.vercelignore',
  'CNAME',
  'youtube-honeymontana-videos.md',
  'youtube-links-report.md',
]);

const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    if (entry.isFile()) files.push(path);
  }

  return files;
};

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const localAssetPath = (reference, sourceFile) => {
  if (/^(?:[a-z]+:|\/\/|#)/i.test(reference)) return null;

  const cleanReference = reference.split(/[?#]/, 1)[0];
  if (!cleanReference) return null;

  if (cleanReference.startsWith('/')) {
    return resolve(outputDirectory, `.${cleanReference}`);
  }

  return resolve(dirname(sourceFile), cleanReference);
};

for (const page of expectedPages) {
  if (!await exists(resolve(outputDirectory, page))) {
    failures.push(`Missing page: ${page}`);
  }
}

const files = await walk(outputDirectory);

for (const file of files) {
  const name = relative(outputDirectory, file).split(sep).at(-1);
  if (forbiddenNames.has(name)) {
    failures.push(`Forbidden output file: ${relative(outputDirectory, file)}`);
  }
}

const assetPatterns = [
  /<(?:script|img|iframe|source)\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi,
  /<link\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi,
];

let widgetCount = 0;

for (const file of files.filter((path) => extname(path) === '.html')) {
  const html = await readFile(file, 'utf8');
  const relativeFile = relative(outputDirectory, file);
  const isNestedIndex = relativeFile !== 'index.html' && relativeFile.endsWith(`${sep}index.html`);

  for (const widget of html.matchAll(/<script\b[^>]*\bao-widget-id=["'][^"']+["'][^>]*>/gi)) {
    widgetCount += 1;
    if (/\bao-domain=/i.test(widget[0])) {
      failures.push(`Widget still depends on a custom domain in ${relativeFile}`);
    }
  }

  if (/https:\/\/course\.honeymontana\.com\/b\//i.test(html)) {
    failures.push(`Checkout still uses the unavailable domain in ${relativeFile}`);
  }

  for (const pattern of assetPatterns) {
    for (const match of html.matchAll(pattern)) {
      const reference = match[1].trim();
      const assetPath = localAssetPath(reference, file);
      if (!assetPath) continue;

      if (isNestedIndex && !reference.startsWith('/')) {
        failures.push(`Nested page has a slash-sensitive asset in ${relativeFile}: ${reference}`);
      }

      if (!await exists(assetPath)) {
        failures.push(`Missing local asset in ${relativeFile}: ${reference}`);
      }
    }
  }
}

for (const file of files.filter((path) => extname(path) === '.css')) {
  const css = await readFile(file, 'utf8');
  const relativeFile = relative(outputDirectory, file);

  for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    const reference = match[1].trim();
    const assetPath = localAssetPath(reference, file);
    if (!assetPath) continue;

    if (!await exists(assetPath)) {
      failures.push(`Missing CSS asset in ${relativeFile}: ${reference}`);
    }
  }
}

if (widgetCount !== 3) {
  failures.push(`Expected 3 form widgets, found ${widgetCount}`);
}

if (failures.length > 0) {
  console.error('Vercel build check failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Vercel build check passed: ${expectedPages.length} pages, ${widgetCount} widgets, ${files.length} files`);
