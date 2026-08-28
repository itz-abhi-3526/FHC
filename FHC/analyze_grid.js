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

  // Find green pixels: where G > R + 20 and G > B + 5 (or similar green criteria)
  // Let's analyze pixel colors at the bottom (y from h-150 to h-1)
  let firstGreenY = -1;
  let lastGreenY = -1;
  let greenCount = 0;

  for (let y = 0; y < h; y++) {
    let rowHasGreen = false;
    for (let x = 0; x < w; x++) {
      const p = getPixel(x, y);
      // Green color check: G is dominant or it matches known grass greens: (9,56,40), (8,55,39), (8,56,40) etc.
      // Let's check if G is the largest and G > 30 and R < 100
      if (p.g > p.r && p.g > p.b && p.g > 30 && p.r < 100) {
        rowHasGreen = true;
        greenCount++;
      }
    }
    if (rowHasGreen) {
      if (firstGreenY === -1) firstGreenY = y;
      lastGreenY = y;
    }
  }

  console.log(`Green pixels summary: total=${greenCount}, y-range=[${firstGreenY}, ${lastGreenY}]`);

  // Let's print colors at some random rows or print representative row transitions
  // Let's find background pattern. Is the background color gradient?
  // Let's inspect column 0 (x=0) for each row to see if it changes (gradient)
  console.log('Column x=0 values (every 50 rows):');
  for (let y = 0; y < h; y += 50) {
    const p = getPixel(0, y);
    console.log(`  y=${y}: R=${p.r}, G=${p.g}, B=${p.b}, A=${p.a}`);
  }
  const lastRowP = getPixel(0, h-1);
  console.log(`  y=${h-1}: R=${lastRowP.r}, G=${lastRowP.g}, B=${lastRowP.b}, A=${lastRowP.a}`);

  // Let's find all colors that might be clouds (white/off-white with pale-blue shading)
  // Let's find where they are located.
  // Clouds are white/off-white, so R,G,B are very high, e.g., R>230, G>230, B>230, or maybe with pale-blue (R,G,B high but B slightly higher)
}

main();
