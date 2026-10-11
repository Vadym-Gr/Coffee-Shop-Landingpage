import sharp from 'sharp';
import { mkdir, copyFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
const source = process.argv[2];
if (!source)
  throw new Error(
    'Usage: node scripts/prepare-images.mjs <original-assets-directory>'
  );
const target = path.resolve('src/img');
await mkdir(target, { recursive: true });
const assets = {
  hero: 1440,
  footer_image: 1440,
  'coffee-background': 1440,
  'about-coffee': 680,
  cappuccino: 360,
  'chai-latte': 360,
  macchiato: 360,
  espresso: 360,
  'beans-icon': 88,
  'quality-icon': 88,
  'cup-icon': 88,
  'price-icon': 88,
  'coffee-blast': 498,
  'coffee-beans': 657,
  'takeaway-cup': 300,
  'splash-cup': 444,
  'jonny-thomas': 112,
};
const report = [];
for (const [name, width] of Object.entries(assets)) {
  const input = path.join(source, name + '.png'),
    meta = await sharp(input).metadata();
  for (const density of [1, 2]) {
    const filename = name + (density === 2 ? '@2x' : '') + '.webp';
    await sharp(input)
      .resize({ width: width * density })
      .webp({ quality: 86, alphaQuality: 100, effort: 6 })
      .toFile(path.join(target, filename));
    report.push({
      filename,
      sourceWidth: meta.width,
      sourceHeight: meta.height,
      outputWidth: width * density,
      bytes: (await stat(path.join(target, filename))).size,
      upscaled: width * density > meta.width,
    });
  }
}
for (const name of [
  'about-mask',
  'arrow-left',
  'arrow-right',
  'facebook',
  'instagram',
  'twitter',
  'youtube',
])
  await copyFile(
    path.join(
      source,
      (name === 'twitter' ? 'youtube' : name === 'youtube' ? 'twitter' : name) +
        '.svg'
    ),
    path.join(target, name + '.svg')
  );
await mkdir('docs', { recursive: true });
await writeFile(
  'docs/image-manifest.json',
  JSON.stringify(report, null, 2) + '\n'
);
console.log(JSON.stringify(report, null, 2));
