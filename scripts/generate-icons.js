import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to write minimal uncompressed PNG
function createPngBuffer(width, height, r, g, b) {
  // Simple uncompressed RGBA PNG generator
  // We construct valid minimal PNG binary
  const p = [137, 80, 78, 71, 13, 10, 26, 10]; // PNG header
  
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    
    // Compute crc32
    let c = 0xffffffff;
    const combined = Buffer.concat([t, data]);
    for (let i = 0; i < combined.length; i++) {
      c ^= combined[i];
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
      }
    }
    c = (c ^ 0xffffffff) >>> 0;
    crc.writeUInt32BE(c, 0);
    return Buffer.concat([len, t, data, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Raw image data with scanline filter 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter byte: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Gradient / Monad purple circle icon
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = width / 2 - 1;
      
      if (dist <= radius) {
        rawData[pxOffset] = r;     // R
        rawData[pxOffset + 1] = g; // G
        rawData[pxOffset + 2] = b; // B
        rawData[pxOffset + 3] = 255; // Alpha
      } else {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  // zlib deflate uncompressed blocks
  // header: 0x78 0x01 (low compression)
  const zlibHeader = Buffer.from([0x78, 0x01]);
  // Deflate block (BFINAL=1, BTYPE=00 non-compressed)
  const maxBlock = 65535;
  const blocks = [];
  let offset = 0;
  while (offset < rawData.length) {
    const end = Math.min(offset + maxBlock, rawData.length);
    const isLast = end === rawData.length ? 1 : 0;
    const len = end - offset;
    const nlen = (~len) & 0xffff;
    
    const blockHeader = Buffer.alloc(5);
    blockHeader[0] = isLast;
    blockHeader.writeUInt16LE(len, 1);
    blockHeader.writeUInt16LE(nlen, 3);
    blocks.push(blockHeader, rawData.slice(offset, end));
    offset = end;
  }

  // Adler-32
  let s1 = 1;
  let s2 = 0;
  for (let i = 0; i < rawData.length; i++) {
    s1 = (s1 + rawData[i]) % 65521;
    s2 = (s2 + s1) % 65521;
  }
  const adler = Buffer.alloc(4);
  adler.writeUInt32BE(((s2 << 16) | s1) >>> 0, 0);

  const idatData = Buffer.concat([zlibHeader, ...blocks, adler]);

  return Buffer.concat([
    Buffer.from(p),
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const iconsDir = path.resolve(__dirname, "../extension/icons");
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Monad Purple: rgb(131, 110, 249) -> #836EF9
fs.writeFileSync(path.join(iconsDir, "icon-16.png"), createPngBuffer(16, 16, 131, 110, 249));
fs.writeFileSync(path.join(iconsDir, "icon-48.png"), createPngBuffer(48, 48, 131, 110, 249));
fs.writeFileSync(path.join(iconsDir, "icon-128.png"), createPngBuffer(128, 128, 131, 110, 249));

console.log("✓ Generated valid Chrome Extension icons in extension/icons/");
