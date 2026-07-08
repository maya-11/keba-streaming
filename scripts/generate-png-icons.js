/**
 * Generates PNG icons for the PWA manifest.
 * Uses only Node.js built-ins (zlib + Buffer) — no extra packages needed.
 * Design: dark navy (#0f172a) background with rounded corners, bold red "K".
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');

// ----- PNG encoder helpers -----

function crc32(buf) {
  let crc = 0xffffffff;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c;
    }
    return t;
  })());
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcVal = Buffer.alloc(4); crcVal.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBytes, data, crcVal]);
}

function encodePNG(width, height, pixels) {
  // pixels: Uint8Array of width*height*4 RGBA values
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0; // filter type None
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      row[1 + x * 4 + 0] = pixels[i + 0];
      row[1 + x * 4 + 1] = pixels[i + 1];
      row[1 + x * 4 + 2] = pixels[i + 2];
      row[1 + x * 4 + 3] = pixels[i + 3];
    }
    rawRows.push(row);
  }

  const raw = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(raw, { level: 6 });

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const IHDR = Buffer.alloc(13);
  IHDR.writeUInt32BE(width, 0);
  IHDR.writeUInt32BE(height, 4);
  IHDR[8] = 8;  // bit depth
  IHDR[9] = 6;  // RGBA
  IHDR[10] = 0; IHDR[11] = 0; IHDR[12] = 0;

  return Buffer.concat([
    sig,
    chunk('IHDR', IHDR),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ----- Icon renderer -----

function renderIcon(size) {
  const pixels = new Uint8Array(size * size * 4);

  // Background color: #0f172a → r=15, g=23, b=42
  const BG = [15, 23, 42];
  // Text color: #ef4444 → r=239, g=68, b=68
  const FG = [239, 68, 68];

  // Corner radius (15% of size, matching rx="76.8" at 512px → ~15%)
  const radius = Math.round(size * 0.15);

  function inRoundedRect(x, y) {
    const cx = Math.min(Math.max(x, radius), size - 1 - radius);
    const cy = Math.min(Math.max(y, radius), size - 1 - radius);
    const dx = x - cx, dy = y - cy;
    return dx * dx + dy * dy <= radius * radius;
  }

  // Pre-render a simple "K" glyph into a boolean grid using strokes
  // The K is drawn at ~35% width strokes, centred in the icon
  const kPixels = new Uint8Array(size * size); // 1 = red, 0 = bg

  const cx = size / 2;
  const cy = size / 2;
  const fontH = size * 0.62;   // total glyph height
  const sw = size * 0.12;       // stroke width

  // Draw filled rectangle helper (axis-aligned)
  function fillRect(x0, y0, x1, y1, alpha = 255) {
    for (let py = Math.max(0, Math.round(y0)); py < Math.min(size, Math.round(y1)); py++) {
      for (let px = Math.max(0, Math.round(x0)); px < Math.min(size, Math.round(x1)); px++) {
        kPixels[py * size + px] = alpha ? 1 : 0;
      }
    }
  }

  // Draw a rotated rectangle (parallelogram) for the diagonal strokes
  function fillQuad(pts) {
    // pts: [{x,y}, ...] 4 corners, fill with scanlines
    const minY = Math.max(0, Math.floor(Math.min(...pts.map(p => p.y))));
    const maxY = Math.min(size - 1, Math.ceil(Math.max(...pts.map(p => p.y))));

    function edgeX(p1, p2, y) {
      if (p2.y === p1.y) return null;
      return p1.x + (p2.x - p1.x) * (y - p1.y) / (p2.y - p1.y);
    }

    const edges = [
      [pts[0], pts[1]],
      [pts[1], pts[2]],
      [pts[2], pts[3]],
      [pts[3], pts[0]],
    ];

    for (let y = minY; y <= maxY; y++) {
      const xs = [];
      for (const [p1, p2] of edges) {
        const x = edgeX(p1, p2, y + 0.5);
        if (x !== null && ((p1.y <= y + 0.5 && p2.y > y + 0.5) || (p2.y <= y + 0.5 && p1.y > y + 0.5))) {
          xs.push(x);
        }
      }
      if (xs.length >= 2) {
        xs.sort((a, b) => a - b);
        for (let px = Math.max(0, Math.floor(xs[0])); px <= Math.min(size - 1, Math.floor(xs[xs.length - 1])); px++) {
          kPixels[y * size + px] = 1;
        }
      }
    }
  }

  // K geometry:
  // Vertical bar (left stem)
  const stemX = cx - fontH * 0.28;
  const topY = cy - fontH / 2;
  const botY = cy + fontH / 2;
  fillRect(stemX - sw / 2, topY, stemX + sw / 2, botY);

  // Upper diagonal: from stem (midpoint) going up-right
  const midY = cy;
  const tipRX = cx + fontH * 0.36; // right x tip
  const halfSW = sw / 2;

  // Upper arm: stem meeting point (stemX+sw/2, midY) → top-right (tipRX, topY)
  // drawn as a parallelogram with stroke width sw
  {
    const dx = tipRX - (stemX + sw / 2);
    const dy = topY - midY;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len * halfSW;
    const ny = dx / len * halfSW;
    fillQuad([
      { x: stemX + sw / 2 + nx, y: midY + ny },
      { x: tipRX + nx, y: topY + ny },
      { x: tipRX - nx, y: topY - ny },
      { x: stemX + sw / 2 - nx, y: midY - ny },
    ]);
  }

  // Lower arm: stem meeting point → bottom-right
  {
    const dx = tipRX - (stemX + sw / 2);
    const dy = botY - midY;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len * halfSW;
    const ny = dx / len * halfSW;
    fillQuad([
      { x: stemX + sw / 2 + nx, y: midY + ny },
      { x: tipRX + nx, y: botY + ny },
      { x: tipRX - nx, y: botY - ny },
      { x: stemX + sw / 2 - nx, y: midY - ny },
    ]);
  }

  // Now compose pixels
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      if (!inRoundedRect(x, y)) {
        // Transparent outside rounded rect
        pixels[idx] = 0; pixels[idx+1] = 0; pixels[idx+2] = 0; pixels[idx+3] = 0;
      } else if (kPixels[y * size + x]) {
        pixels[idx] = FG[0]; pixels[idx+1] = FG[1]; pixels[idx+2] = FG[2]; pixels[idx+3] = 255;
      } else {
        pixels[idx] = BG[0]; pixels[idx+1] = BG[1]; pixels[idx+2] = BG[2]; pixels[idx+3] = 255;
      }
    }
  }

  return encodePNG(size, size, pixels);
}

// ----- Main -----

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

for (const size of SIZES) {
  const outPath = path.join(OUT_DIR, `icon-${size}x${size}.png`);
  const png = renderIcon(size);
  fs.writeFileSync(outPath, png);
  console.log(`Generated ${outPath} (${png.length} bytes)`);
}

console.log('\nAll PNG icons generated successfully.');
