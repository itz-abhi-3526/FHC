import sharp from 'sharp';

async function main() {
  const imgPath = 'src/assets/fhc3.png';
  const { data, info } = await sharp(imgPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const channels = info.channels;

  const getPixel = (x, y) => {
    const idx = (y * w + x) * channels;
    return {
      r: data[idx],
      g: data[idx+1],
      b: data[idx+2],
      a: channels === 4 ? data[idx+3] : 255
    };
  };

  // Find any non-green, non-bg pixels in y = 700 to 863.
  // What is "green"? Let's define a strict check for greens and dark green/ground pixels.
  // Let's check color of pixels.
  const nonGreenPixels = [];
  for (let y = 700; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = getPixel(x, y);
      const isBg = (p.r > 190 && p.g > 190 && p.b > 190 && Math.abs(p.r - p.g) < 15 && Math.abs(p.g - p.b) < 15);
      if (isBg) continue;

      // Grass greens have G > R and G > B, or they are very dark like (13, 62, 32).
      // Let's see: G should be larger than R, and G should be larger than B.
      const isGreen = (p.g > p.r && p.g > p.b) || (p.g >= p.r && p.g >= p.b && p.g > 20);
      if (!isGreen) {
        nonGreenPixels.push({ x, y, r: p.r, g: p.g, b: p.b });
      }
    }
  }

  console.log(`Found ${nonGreenPixels.length} non-green non-bg pixels in y >= 700.`);
  if (nonGreenPixels.length > 0) {
    console.log('Sample non-green pixels:');
    nonGreenPixels.slice(0, 50).forEach(p => {
      console.log(`  x=${p.x}, y=${p.y}: R=${p.r}, G=${p.g}, B=${p.b}`);
    });
  }
}

main();
