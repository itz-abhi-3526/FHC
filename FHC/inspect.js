import sharp from 'sharp';

async function main() {
  const imgPath = 'src/assets/fhc3.png';
  try {
    const image = sharp(imgPath);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    console.log(`Image info: width=${info.width}, height=${info.height}, channels=${info.channels}`);
    
    // Count color frequencies
    const colorCounts = {};
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];
      const a = info.channels === 4 ? data[i+3] : 255;
      const key = `${r},${g},${b},${a}`;
      colorCounts[key] = (colorCounts[key] || 0) + 1;
    }
    
    // Sort and print top 15 colors
    const sortedColors = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    
    console.log('Top 20 colors (R,G,B,A: count):');
    sortedColors.forEach(([color, count]) => {
      console.log(`  ${color}: ${count}`);
    });

    // Check pixel at (0,0) which is likely sky background
    const getPixel = (x, y) => {
      const idx = (y * info.width + x) * info.channels;
      return {
        r: data[idx],
        g: data[idx+1],
        b: data[idx+2],
        a: info.channels === 4 ? data[idx+3] : 255
      };
    };
    const topLeft = getPixel(0, 0);
    console.log(`Top-left pixel: R=${topLeft.r}, G=${topLeft.g}, B=${topLeft.b}, A=${topLeft.a}`);

  } catch (err) {
    console.error('Error:', err);
  }
}

main();
