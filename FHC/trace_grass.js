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

  // For each column x from 0 to w-1, find the minimum y (top of grass)
  // which is green. Let's define a green pixel:
  // p.g > p.r and p.g > p.b, or some specific green thresholds
  const grassTop = new Array(w);
  for (let x = 0; x < w; x++) {
    grassTop[x] = -1;
    // We can search from y=650 to h-1
    for (let y = 650; y < h; y++) {
      const p = getPixel(x, y);
      const isGreen = (p.g > p.r && p.g > p.b && p.g > 25) || (p.g >= p.r && p.g >= p.b && p.g > 30 && p.r < 100);
      if (isGreen) {
        grassTop[x] = y;
        break;
      }
    }
  }

  // Print summary of grass top coordinates
  const minTop = Math.min(...grassTop.filter(y => y !== -1));
  const maxTop = Math.max(...grassTop.filter(y => y !== -1));
  console.log(`Grass top boundary: min_y=${minTop}, max_y=${maxTop}`);

  // Let's print grassTop values for a few columns
  console.log('Sample columns grass top y:');
  for (let x = 0; x < w; x += 100) {
    console.log(`  x=${x}: y=${grassTop[x]}`);
  }
}

main();
