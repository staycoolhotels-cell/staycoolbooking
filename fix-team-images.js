const { Jimp } = require('jimp');
const path = require('path');

const imgDir = path.join(__dirname, 'public/assets/images');

async function processImage(filename) {
  const imgPath = path.join(imgDir, filename);
  console.log('Processing', filename);

  const img = await Jimp.read(imgPath);
  const origW = img.bitmap.width;
  const origH = img.bitmap.height;
  console.log('  Original:', origW, 'x', origH);

  // Resize to 900px wide for web clarity
  if (origW > 900) {
    img.resize({ w: 900 });
  }

  const newW = img.bitmap.width;
  const newH = img.bitmap.height;
  console.log('  Resized:', newW, 'x', newH);

  // Paint over watermark: top-right ~20% of width, top 6% of height
  const wmX = Math.floor(newW * 0.80);
  const wmH = Math.floor(newH * 0.07);
  for (let x = wmX; x < newW; x++) {
    for (let y = 0; y < wmH; y++) {
      img.setPixelColor(0x000000FF, x, y);
    }
  }
  console.log('  Watermark painted: x=' + wmX + '-' + newW + ', y=0-' + wmH);

  await img.write(imgPath, { quality: 90 });
  console.log('  Saved!', imgPath);
}

(async () => {
  try {
    await processImage('team-member-1.jpg');
    await processImage('team-member-2.jpg');
    console.log('All done!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
