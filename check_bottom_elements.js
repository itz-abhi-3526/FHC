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

  // Let's scan y from 700 to 863, and x from 0 to w-1.
  // We want to find any non-green, non-ground, non-checkerboard pixels.
  // Ground colors are shades of green or dark brown/black?
  // Let's analyze what colors are present in the y=700 to 863 region.
  const colorCounts = {};
  for (let y = 700; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = getPixel(x, y);
      const isBg = (p.r > 190 && p.g > 190 && p.b > 190 && Math.abs(p.r - p.g) < 15 && Math.abs(p.g - p.b) < 15);
      if (!isBg) {
        const key = `${p.r},${p.g},${p.b}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;
      }
    }
  }

  // Sort and print the top colors in the bottom region
  const sortedColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1]);

  console.log('Top non-background colors in bottom region (y >= 700):');
  sortedColors.slice(0, 30).forEach(([color, count]) => {
    console.log(`  ${color}: ${count}`);
  });
}

main();
