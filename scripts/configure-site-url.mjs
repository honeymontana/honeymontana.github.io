import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const outputDirectory = resolve(process.argv[2] || 'public');
const requestedSiteUrl = process.argv[3] || process.env.SITE_URL;

if (!requestedSiteUrl) {
  throw new Error('SITE_URL is required');
}

const parsedSiteUrl = new URL(requestedSiteUrl);

if (!['http:', 'https:'].includes(parsedSiteUrl.protocol)) {
  throw new Error(`Unsupported SITE_URL protocol: ${parsedSiteUrl.protocol}`);
}

const siteOrigin = parsedSiteUrl.origin;
const sourceOrigin = 'https://quickitstart.com';
const textExtensions = new Set(['.html', '.txt', '.xml']);

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

const files = await walk(outputDirectory);
let changedFiles = 0;

for (const file of files) {
  const extension = file.slice(file.lastIndexOf('.'));
  if (!textExtensions.has(extension)) continue;

  const current = await readFile(file, 'utf8');
  const updated = current.replaceAll(sourceOrigin, siteOrigin);

  if (updated !== current) {
    await writeFile(file, updated);
    changedFiles += 1;
  }
}

console.log(`Configured canonical site URL: ${siteOrigin} (${changedFiles} files)`);
