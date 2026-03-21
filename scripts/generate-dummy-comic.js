const fs = require('fs');
const JSZip = require('jszip');
const path = require('path');

const pngHex = '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082';
const pngBuffer = Buffer.from(pngHex, 'hex');

async function generateComic() {
  const zip = new JSZip();
  
  // Add 3 pages
  zip.file('page01.png', pngBuffer);
  zip.file('page02.png', pngBuffer);
  zip.file('page03.png', pngBuffer);
  
  const content = await zip.generateAsync({ type: 'nodebuffer' });
  const outputPath = path.join(__dirname, 'test-comic.cbz');
  fs.writeFileSync(outputPath, content);
  console.log(`Generated: ${outputPath}`);
}

generateComic().catch(console.error);
