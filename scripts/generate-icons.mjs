/**
 * generate-icons.mjs
 * Generates the temporary utan icons from the self-hosted Familjen Grotesk font.
 *
 * Output:
 *   public/favicon.svg         — white "U" on accent
 *   public/favicon.png         — 64×64
 *   public/icons/icon-192.png  — 192×192
 *   public/icons/icon-512.png  — 512×512 (maskable: glyph stays inside the safe zone)
 *   public/og-image.png        — 1200×630, "UTAN" wordmark in ink on bg
 *
 * The colours mirror the tokens in styles/globals.css — keep them in sync.
 * When the final logo exists, replace this script's output with exported files.
 *
 * Usage: node scripts/generate-icons.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import opentype from 'opentype.js';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const ACCENT    = '#1F2BFF';
const ON_ACCENT = '#FFFFFF';
const BG        = '#F7F6F2';
const INK       = '#0B0B0B';

const fontFile = join(root, 'node_modules/@fontsource/familjen-grotesk/files/familjen-grotesk-latin-500-normal.woff');
const fontBuffer = readFileSync(fontFile);
const font = opentype.parse(fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.byteLength));

/**
 * Lays out `text` glyph by glyph (letterSpacing in em) starting at x, y.
 * Done by hand because opentype.js can't run this font's GSUB features.
 */
function textPath(text, x, y, fontSize, letterSpacing) {
  const scale = fontSize / font.unitsPerEm;
  const path = new opentype.Path();
  for (const char of text) {
    const glyph = font.charToGlyph(char);
    path.extend(glyph.getPath(x, y, fontSize));
    x += glyph.advanceWidth * scale + letterSpacing * fontSize;
  }
  return path;
}

/** Path data for `text`, centred in a width×height box. */
function centredText(text, fontSize, width, height, letterSpacing = 0) {
  const box = textPath(text, 0, 0, fontSize, letterSpacing).getBoundingBox();
  const dx = (width  - (box.x2 - box.x1)) / 2 - box.x1;
  const dy = (height - (box.y2 - box.y1)) / 2 - box.y1;
  return textPath(text, dx, dy, fontSize, letterSpacing).toPathData(2);
}

function iconSvg(size) {
  // Cap height ≈ 46% of the icon keeps the "U" inside the maskable safe zone.
  const d = centredText('U', size * 0.66, size, size);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${ACCENT}"/><path d="${d}" fill="${ON_ACCENT}"/></svg>`;
}

function ogSvg() {
  const [w, h] = [1200, 630];
  const d = centredText('UTAN', 220, w, h, 0.04);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${BG}"/><path d="${d}" fill="${INK}"/></svg>`;
}

function writePng(svg, outPath) {
  const png = new Resvg(svg).render().asPng();
  writeFileSync(outPath, png);
  console.log(`✓ ${outPath.replace(root, '').replace(/\\/g, '/')}  (${png.length.toLocaleString()} bytes)`);
}

mkdirSync(join(root, 'public', 'icons'), { recursive: true });

writeFileSync(join(root, 'public', 'favicon.svg'), iconSvg(64));
console.log('✓ /public/favicon.svg');

writePng(iconSvg(64),  join(root, 'public', 'favicon.png'));
writePng(iconSvg(192), join(root, 'public', 'icons', 'icon-192.png'));
writePng(iconSvg(512), join(root, 'public', 'icons', 'icon-512.png'));
writePng(ogSvg(),      join(root, 'public', 'og-image.png'));
