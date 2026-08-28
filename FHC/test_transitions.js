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

  // Find transitions along row 5
  const row = 5;
  const transitions = [];
  let prevColorType = null; // 'W', 'G', or '?'
  
  const getColorType = (p) => {
    if (p.r > 240 && p.g > 240 && p.b > 240) return 'W';
    if (p.r > 190 && p.r < 210 && p.g > 190 && p.g < 210 && p.b > 190 && p.b < 210) return 'G';
    return '?';
  };

  for (let x = 0; x < w; x++) {
    const p = getPixel(x, row);
    const ct = getColorType(p);
    if (ct !== prevColorType) {
      transitions.push({ x, prev: prevColorType, curr: ct, color: `${p.r},${p.g},${p.b}` });
      prevColorType = ct;
    }
  }

  console.log(`Transitions along row ${row}:`, transitions.slice(0, 30));
}

main();
