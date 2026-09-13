import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const publicDir = path.join(root, 'public');

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])), 0);
  return Buffer.concat([length, name, data, checksum]);
}

function insideRoundedRect(x, y, left, top, right, bottom, radius) {
  const cx = Math.max(left + radius, Math.min(x, right - radius));
  const cy = Math.max(top + radius, Math.min(y, bottom - radius));
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function insideCircle(x, y, cx, cy, radius) {
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function distanceToSegment(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

function blend(pixel, color, alpha) {
  pixel[0] = pixel[0] * (1 - alpha) + color[0] * alpha;
  pixel[1] = pixel[1] * (1 - alpha) + color[1] * alpha;
  pixel[2] = pixel[2] * (1 - alpha) + color[2] * alpha;
  pixel[3] = Math.min(255, pixel[3] + 255 * alpha);
}

function renderIcon(size) {
  const supersample = 3;
  const highSize = size * supersample;
  const pixels = new Uint8Array(highSize * highSize * 4);
  const unit = 512 / highSize;

  for (let y = 0; y < highSize; y += 1) {
    for (let x = 0; x < highSize; x += 1) {
      const designX = (x + 0.5) * unit;
      const designY = (y + 0.5) * unit;
      const pixel = [0, 0, 0, 0];
      if (insideRoundedRect(designX, designY, 28, 28, 484, 484, 96)) blend(pixel, [216, 244, 231], 1);
      if (insideRoundedRect(designX, designY, 42, 42, 470, 470, 82)) {
        const gradient = Math.max(0, Math.min(1, (designX + designY - 84) / 856));
        blend(pixel, [18 - 11 * gradient, 136 - 42 * gradient, 121 - 33 * gradient], 1);
      }
      if (insideCircle(designX, designY, 256, 248, 126)) blend(pixel, [255, 255, 255], 0.13);

      const wrenchLine = distanceToSegment(designX, designY, 175, 382, 321, 236) <= 26;
      const handle = insideCircle(designX, designY, 175, 382, 38);
      const wrenchHead = insideCircle(designX, designY, 356, 203, 55);
      if (wrenchLine || handle || wrenchHead) blend(pixel, [255, 255, 255], 1);
      if (insideCircle(designX, designY, 356, 203, 19)) blend(pixel, [11, 111, 101], 1);
      if (insideCircle(designX, designY, 346, 175, 10)) blend(pixel, [247, 201, 72], 1);
      if (distanceToSegment(designX, designY, 139, 420, 373, 420) <= 7) blend(pixel, [255, 255, 255], 0.7);
      if (distanceToSegment(designX, designY, 178, 449, 334, 449) <= 4) blend(pixel, [255, 255, 255], 0.36);

      const index = (y * highSize + x) * 4;
      pixels[index] = Math.round(pixel[0]);
      pixels[index + 1] = Math.round(pixel[1]);
      pixels[index + 2] = Math.round(pixel[2]);
      pixels[index + 3] = Math.round(pixel[3]);
    }
  }

  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const totals = [0, 0, 0, 0];
      for (let sy = 0; sy < supersample; sy += 1) {
        for (let sx = 0; sx < supersample; sx += 1) {
          const source = ((y * supersample + sy) * highSize + (x * supersample + sx)) * 4;
          for (let channel = 0; channel < 4; channel += 1) totals[channel] += pixels[source + channel];
        }
      }
      const target = (y * size + x) * 4;
      for (let channel = 0; channel < 4; channel += 1) rgba[target + channel] = Math.round(totals[channel] / (supersample * supersample));
    }
  }

  const scanlines = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    scanlines[y * (size * 4 + 1)] = 0;
    rgba.copy(scanlines, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(scanlines, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const [filename, size] of [['app-icon-512.png', 512], ['app-icon-192.png', 192], ['app-touch-icon.png', 180]]) {
  fs.writeFileSync(path.join(publicDir, filename), renderIcon(size));
}
