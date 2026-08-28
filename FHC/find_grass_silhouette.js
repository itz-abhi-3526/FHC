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

  // Scan columns from top to bottom, find where grass starts
  // Grass colors should be green, e.g. G is significantly larger than R and B.
  // Or let's see: what are the grass colors? Let's sample a few columns
  console.log('Sampling column x=600 for grass top transition:');
  for (let y = 600; y < 864; y++) {
    const p = getPixel(600, y);
    // Print pixels when they transition to grass
    // Let's print if they are not white/grey checkerboard
    const isBg = (p.r > 190 && p.g > 190 && p.b > 190 && Math.abs(p.r - p.g) < 15 && Math.abs(p.g - p.b) < 15);
    if (!isBg) {
      console.log(`  y=${y}: R=${p.r}, G=${p.g}, B=${p.b} (isBg=${isBg})`);
      // print 10 more pixels
      for (let k = 1; k <= 15; k++) {
        const p2 = getPixel(600, y + k);
        console.log(`  y=${y+k}: R=${p2.r}, G=${p2.g}, B=${p2.b}`);
      }
      break;
    }
  }
}

main();
