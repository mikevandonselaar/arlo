/**
 * generate-icons.mjs
 * Generates placeholder PWA icons with zero npm dependencies.
 * Uses only Node.js built-ins: zlib (PNG compression), fs, path.
 *
 * Output:
 *   public/icons/icon-192.png  — 192×192
 *   public/icons/icon-512.png  — 512×512
 *
 * Design: #51EAA7 (green) background, white "H" lettermark.
 *
 * Usage: node scripts/generate-icons.mjs
 */

import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── CRC32 (IEEE 802.3 polynomial) ───────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// ─── PNG encoder ─────────────────────────────────────────────────────────────

function pngChunk(type, data) {
  const typeBuf  = Buffer.from(type, 'ascii');
  const lenBuf   = Buffer.allocUnsafe(4);
  const crcBuf   = Buffer.allocUnsafe(4);
  lenBuf.writeUInt32BE(data.length, 0);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/**
 * Encodes a raw RGBA pixel array (Uint8Array, width×height×4 bytes) into a
 * valid PNG buffer using RGB color type + zlib DEFLATE compression.
 */
function encodePNG(width, height, rgba) {
  // Build raw scanlines: one filter byte (0 = None) then RGB triplets per row
  const raw = Buffer.allocUnsafe(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const pi = (y * width + x) * 4;
      const ri = y * (1 + width * 3) + 1 + x * 3;
      raw[ri]     = rgba[pi];
      raw[ri + 1] = rgba[pi + 1];
      raw[ri + 2] = rgba[pi + 2];
    }
  }

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(width,  0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8]  = 8; // bit depth
  ihdr[9]  = 2; // color type: RGB
  ihdr[10] = 0; // compression method
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace method

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── Icon pixel drawing ───────────────────────────────────────────────────────

/**
 * Fills `rgba` with the KODA icon design:
 * - Background: #51EAA7  (81, 234, 167)
 * - Lettermark:  white "H" centered, strokes at ~22% of letter width
 */
function drawIcon(rgba, w, h) {
  // Background fill
  for (let i = 0; i < w * h * 4; i += 4) {
    rgba[i]     = 81;   // R
    rgba[i + 1] = 234;  // G
    rgba[i + 2] = 167;  // B
    rgba[i + 3] = 255;  // A
  }

  // "H" lettermark — proportional to icon size
  const lh  = Math.round(h * 0.55);                        // letter height
  const lw  = Math.round(w * 0.42);                        // letter width
  const tk  = Math.max(3, Math.round(lw * 0.22));          // stroke thickness
  const ox  = Math.round((w - lw) / 2);                    // x offset (centered)
  const oy  = Math.round((h - lh) / 2);                    // y offset (centered)
  const mid = Math.round(lh / 2);                          // crossbar centre y

  for (let y = oy; y < oy + lh; y++) {
    for (let x = ox; x < ox + lw; x++) {
      const lx = x - ox;
      const ly = y - oy;

      const inLeft   = lx < tk;
      const inRight  = lx >= lw - tk;
      const inCrossY = ly >= mid - Math.round(tk / 2) && ly < mid + Math.ceil(tk / 2);
      const inCrossX = lx >= tk && lx < lw - tk;

      if (inLeft || inRight || (inCrossY && inCrossX)) {
        const i = (y * w + x) * 4;
        rgba[i] = rgba[i + 1] = rgba[i + 2] = 255; // white
      }
    }
  }
}

// ─── Generate ─────────────────────────────────────────────────────────────────

const outDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

for (const size of [192, 512]) {
  const rgba = new Uint8Array(size * size * 4);
  drawIcon(rgba, size, size);
  const png = encodePNG(size, size, rgba);
  const outPath = join(outDir, `icon-${size}.png`);
  writeFileSync(outPath, png);
  console.log(`✓ icon-${size}.png  (${png.length.toLocaleString()} bytes)`);
}
