const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'src', 'assets', 'fhc-source.png');
const outputDir = path.join(__dirname, 'public', 'assets', 'fhc-loader');

async function extractPrecise() {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Based on analysis, define precise crop regions
  // Band 1: y=58-726 (two large sprites side by side)
  // Left: Large laptop (x=57-409)
  // Right: Robot (x=429-853)
  
  // Band 2: y=757-920 (three medium sprites)
  // Band 3: y=967-1139 (four sprites including tiny heart)
  
  // Let's extract each region and also create individual sprites with transparency
  
  // First, let's create a function to extract a region and remove checkerboard background
  async function extractSprite(name, left, top, width, height) {
    // Extract the region
    const region = await sharp(inputPath)
      .extract({ left, top, width, height })
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const { data: rData, info: rInfo } = region;
    
    // Remove checkerboard background (dark gray pixels)
    // Checkerboard colors are around (2,2,2), (40,40,40), etc.
    const outData = Buffer.alloc(rData.length);
    const bgThreshold = 60;
    
    for (let i = 0; i < rData.length; i += 4) {
      const r = rData[i];
      const g = rData[i + 1];
      const b = rData[i + 2];
      const a = rData[i + 3];
      
      const isDarkGray = r < bgThreshold && g < bgThreshold && b < bgThreshold && Math.abs(r - g) < 10 && Math.abs(g - b) < 10;
      const isCheckerboard = a === 255 && isDarkGray;
      
      if (isCheckerboard) {
        // Make transparent
        outData[i] = 0;
        outData[i + 1] = 0;
        outData[i + 2] = 0;
        outData[i + 3] = 0;
      } else {
        outData[i] = r;
        outData[i + 1] = g;
        outData[i + 2] = b;
        outData[i + 3] = a;
      }
    }
    
    await sharp(outData, { raw: { width: rInfo.width, height: rInfo.height, channels: 4 } })
      .png()
      .toFile(path.join(outputDir, `${name}.png`));
    
    console.log(`Extracted ${name}: ${width}x${height} at (${left},${top})`);
  }
  
  // Extract Band 1 - Left: Large Laptop
  await extractSprite('hero-laptop', 57, 58, 352, 668);
  
  // Extract Band 1 - Right: Robot
  await extractSprite('hero-robot', 429, 58, 424, 668);
  
  // Band 2: Three sprites at y=757-920
  // x=96-255, x=365-532, x=640-820
  await extractSprite('robot-heart', 96, 757, 159, 163);
  await extractSprite('satellite-dish', 365, 757, 167, 163);
  await extractSprite('module-laptop', 640, 757, 180, 163);
  
  // Band 3: Four sprites at y=967-1139
  // x=94-259, x=370-524, x=693-766, x=829-843
  await extractSprite('microchip', 94, 967, 165, 172);
  await extractSprite('lightbulb', 370, 967, 154, 172);
  await extractSprite('collaboration', 693, 967, 73, 172);
  await extractSprite('rocket', 693, 967, 73, 172); // Wait, this overlaps with collaboration
  
  // The last tiny one at x=829-843 is the pixel heart
  await extractSprite('pixel-heart', 829, 967, 14, 172);
  
  // We need earth and rocket - let me check if they're in different positions
  // The user listed 11 items but we only have 10 regions (excluding the tiny heart)
  // Let me re-examine: the collaboration and rocket might be separate
  // Actually, looking at the clusters again:
  // Band 3 has 4 clusters: x=94-259, x=370-524, x=693-766, x=829-843
  // That's only 4 sprites in band 3, but we need: microchip, lightbulb, collaboration, rocket, earth, pixel-heart = 6
  // And band 2 has 3 sprites: robot-heart, satellite-dish, module-laptop = 3
  // Band 1 has 2: laptop, robot = 2
  // Total = 11 sprites. But we only have 9 regions (2+3+4).
  
  // Some sprites might be stacked vertically within a band, or the bands might have more detail
  // Let me check the vertical distribution within band 3 more carefully
  
  console.log('\nAnalyzing Band 3 vertical distribution...');
  const band3Pixels = [];
  for (let y = 967; y < 1139; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];
      const isDarkGray = r < 60 && g < 60 && b < 60 && Math.abs(r - g) < 10 && Math.abs(g - b) < 10;
      const isCheckerboard = a === 255 && isDarkGray;
      if (!isCheckerboard && a > 0) {
        band3Pixels.push({ x, y });
      }
    }
  }
  
  // Group by y to see horizontal bands within band 3
  const yGroups = {};
  for (const p of band3Pixels) {
    if (!yGroups[p.y]) yGroups[p.y] = [];
    yGroups[p.y].push(p.x);
  }
  
  const yRanges = Object.keys(yGroups).map(k => parseInt(k)).sort((a,b) => a-b);
  console.log('Band 3 Y range:', yRanges[0], 'to', yRanges[yRanges.length-1]);
  
  // Find horizontal sub-bands
  let inSubBand = false;
  let subStart = 0;
  const subBands = [];
  for (let y = 967; y < 1139; y++) {
    const hasContent = yGroups[y] && yGroups[y].length > 10;
    if (hasContent && !inSubBand) {
      inSubBand = true;
      subStart = y;
    } else if (!hasContent && inSubBand) {
      inSubBand = false;
      subBands.push({ start: subStart, end: y });
    }
  }
  if (inSubBand) subBands.push({ start: subStart, end: 1139 });
  
  console.log('Band 3 sub-bands:', subBands);
  
  // For each sub-band, find x clusters
  for (const sb of subBands) {
    const xCounts = {};
    for (let y = sb.start; y < sb.end; y++) {
      if (yGroups[y]) {
        for (const x of yGroups[y]) {
          xCounts[x] = (xCounts[x] || 0) + 1;
        }
      }
    }
    const xs = Object.keys(xCounts).map(k => parseInt(k)).sort((a,b) => a-b);
    if (xs.length > 0) {
      console.log(`  Sub-band y=${sb.start}-${sb.end}: x range ${xs[0]}-${xs[xs.length-1]}`);
      // Find clusters
      let inCluster = false;
      let clusterStart = 0;
      const clusters = [];
      for (let x = xs[0]; x <= xs[xs.length-1]; x++) {
        if ((xCounts[x] || 0) > 2 && !inCluster) {
          inCluster = true;
          clusterStart = x;
        } else if ((xCounts[x] || 0) <= 2 && inCluster) {
          inCluster = false;
          clusters.push({ start: clusterStart, end: x });
        }
      }
      if (inCluster) clusters.push({ start: clusterStart, end: xs[xs.length-1] });
      console.log(`    Clusters:`, clusters.map(c => `${c.start}-${c.end} (w=${c.end-c.start})`).join(', '));
    }
  }
}

extractPrecise().catch(console.error);