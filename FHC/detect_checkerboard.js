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

  // Let's print the colors of a 30x30 patch at the top left corner (y=0..30, x=0..30)
  // to understand the grid size and colors of the checkerboard
  console.log('Top left 24x24 pixels grid:');
  for (let y = 0; y < 24; y++) {
    let rowStr = '';
    for (let x = 0; x < 24; x++) {
      const p = getPixel(x, y);
      // Let's print W for whiteish, G for greyish, or actual color if different
      if (p.r > 240 && p.g > 240 && p.b > 240) {
        rowStr += 'W';
      } else if (p.r > 190 && p.r < 210 && p.g > 190 && p.g < 210 && p.b > 190 && p.b < 210) {
        rowStr += 'G';
      } else {
        rowStr += '?';
      }
    }
    console.log(rowStr);
  }
}

main();
