const fs = require('fs');
const path = require('path');

function getJpegSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  let offset = 2; // skip SOI
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xFF) break;
    const marker = buffer[offset + 1];
    if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }
    const len = buffer.readUInt16BE(offset + 2);
    offset += 2 + len;
  }
  return { width: null, height: null };
}

const photoDir = 'c:\\Users\\sankalp pingalwad\\OneDrive\\Desktop\\samarth\\photo';
const files = fs.readdirSync(photoDir);

const results = [];
for (const file of files) {
  const fullPath = path.join(photoDir, file);
  const stats = fs.statSync(fullPath);
  if (file.endsWith('.jpeg') || file.endsWith('.jpg')) {
    const dim = getJpegSize(fullPath);
    results.push({
      file,
      size: stats.size,
      width: dim.width,
      height: dim.height,
      ext: path.extname(file)
    });
  } else {
    results.push({
      file,
      size: stats.size,
      width: null,
      height: null,
      ext: path.extname(file)
    });
  }
}

console.log(JSON.stringify(results, null, 2));
