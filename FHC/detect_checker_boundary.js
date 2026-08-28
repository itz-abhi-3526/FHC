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

  console.log('Values around boundary y=10..15, x=13..18:');
  for (let y = 10; y <= 15; y++) {
    let rowStr = `y=${y}: `;
    for (let x = 13; x <= 18; x++) {
      const p = getPixel(x, y);
      rowStr += `[${x},${y}]=(${p.r},${p.g},${p.b},${p.a}) `;
    }
    console.log(rowStr);
  }
}

main();
