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

  // Measure horizontal runs of identical colors (excluding the background if possible, or overall)
  const runs = {};
  for (let y = 0; y < h; y += 10) { // sample every 10th row
    let currentRun = 1;
    let prevColor = null;
    for (let x = 0; x < w; x++) {
      const p = getPixel(x, y);
      const colorStr = `${p.r},${p.g},${p.b}`;
      if (colorStr === prevColor) {
        currentRun++;
      } else {
        if (prevColor !== null) {
          runs[currentRun] = (runs[currentRun] || 0) + 1;
        }
        currentRun = 1;
        prevColor = colorStr;
      }
    }
  }

  // Sort and print the run lengths
  const sortedRuns = Object.entries(runs)
    .map(([len, count]) => [parseInt(len), count])
    .sort((a, b) => b[1] - a[1]);

  console.log('Horizontal run lengths (length: count):');
  sortedRuns.slice(0, 15).forEach(([len, count]) => {
    console.log(`  ${len}: ${count}`);
  });
}

main();
