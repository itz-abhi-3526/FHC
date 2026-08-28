const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = path.join(__dirname, 'src', 'assets', 'fhc-source.png');
const OUT = path.join(__dirname, 'public', 'assets', 'fhc-loader');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

async function main() {
  const img = sharp(SRC);
  const meta = await img.metadata();
  const { width, height } = meta;
  console.log(`Source: ${width}x${height}`);

  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;

  function getPixel(x, y) {
    const i = (y * width + x) * ch;
    return { r: data[i], g: data[i+1], b: data[i+2], a: data[i+3] };
  }

  // Detect background: checkerboard = low saturation, low brightness
  function isBg(x, y) {
    const p = getPixel(x, y);
    const max = Math.max(p.r, p.g, p.b);
    const min = Math.min(p.r, p.g, p.b);
    const sat = max === 0 ? 0 : (max - min) / max;
    return sat < 0.2 && max < 60;
  }

  // Create binary mask: 1 = object, 0 = background
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      mask[y * width + x] = isBg(x, y) ? 0 : 1;
    }
  }

  // Simple morphological cleanup: erode then dilate to remove noise
  // Erode: remove isolated pixels
  const temp1 = new Uint8Array(width * height);
  for (let y = 1; y < height-1; y++) {
    for (let x = 1; x < width-1; x++) {
      const idx = y*width+x;
      if (mask[idx] === 1) {
        // Check 4-connectivity
        if (mask[idx-1] && mask[idx+1] && mask[idx-width] && mask[idx+width]) {
          temp1[idx] = 1;
        }
      }
    }
  }

  // Dilate: expand remaining objects slightly
  const temp2 = new Uint8Array(width * height);
  for (let y = 1; y < height-1; y++) {
    for (let x = 1; x < width-1; x++) {
      const idx = y*width+x;
      if (temp1[idx] === 1 || temp1[idx-1] === 1 || temp1[idx+1] === 1 || 
          temp1[idx-width] === 1 || temp1[idx+width] === 1) {
        temp2[idx] = 1;
      }
    }
  }

  // Flood fill to find connected components
  const labels = new Int32Array(width * height).fill(-1);
  let nextLabel = 0;
  const bboxes = [];

  function floodFill(sx, sy, label) {
    const stack = [[sx, sy]];
    let minX = sx, maxX = sx, minY = sy, maxY = sy;
    let count = 0;
    while (stack.length > 0) {
      const [x, y] = stack.pop();
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      const idx = y * width + x;
      if (labels[idx] !== -1 || temp2[idx] === 0) continue;
      labels[idx] = label;
      count++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
    }
    return { minX, minY, maxX, maxY, count };
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (temp2[idx] === 1 && labels[idx] === -1) {
        const bbox = floodFill(x, y, nextLabel);
        if (bbox.count > 200) {
          bboxes.push({ label: nextLabel, ...bbox });
        }
        nextLabel++;
      }
    }
  }

  console.log(`Found ${bboxes.length} significant components`);
  bboxes.forEach((c, i) => {
    const w = c.maxX - c.minX + 1;
    const h = c.maxY - c.minY + 1;
    console.log(`  ${i}: (${c.minX},${c.minY})-(${c.maxX},${c.maxY}) ${w}x${h} ${c.count}px`);
  });

  // Group into rows
  const sorted = [...bboxes].sort((a, b) => a.minY - b.minY || a.minX - b.minX);
  const rows = [];
  let curRow = [];
  let lastEndY = -100;
  for (const c of sorted) {
    if (c.minY - lastEndY > 80 && curRow.length > 0) {
      rows.push(curRow);
      curRow = [];
    }
    curRow.push(c);
    lastEndY = Math.max(lastEndY, c.maxY);
  }
  if (curRow.length > 0) rows.push(curRow);

  console.log(`\n${rows.length} rows:`);
  rows.forEach((row, i) => {
    console.log(`  Row ${i}: ${row.map(c => `(${c.minX},${c.minY})-${c.maxX},${c.maxY} ${c.maxX-c.minX+1}x${c.maxY-c.minY+1}`).join(' | ')}`);
  });

  // Manual mapping based on expected layout from source image
  // Row 0: hero-laptop (left) + hero-robot+bubble (right)
  // Row 1: satellite-dish (left) + module-laptop (right)
  // Row 2: microchip (left) + lightbulb (center) + collaboration (right)
  // Row 3: rocket (left) + earth (center) + pixel-heart (right)

  const PAD = 8;

  async function extractObject(name, bbox, extraPad = 0) {
    const p = PAD + extraPad;
    const x = Math.max(0, bbox.minX - p);
    const y = Math.max(0, bbox.minY - p);
    const w = Math.min(width - x, bbox.maxX - bbox.minX + 1 + p * 2);
    const h = Math.min(height - y, bbox.maxY - bbox.minY + 1 + p * 2);

    // Extract region and create proper alpha channel
    const region = await sharp(SRC)
      .extract({ left: x, top: y, width: w, height: h })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const rData = region.data;
    const rCh = region.info.channels;
    const rW = region.info.width;
    const rH = region.info.height;

    // Create output buffer with proper alpha
    const outBuf = Buffer.alloc(rW * rH * 4);
    for (let ry = 0; ry < rH; ry++) {
      for (let rx = 0; rx < rW; rx++) {
        const si = (ry * rW + rx) * rCh;
        const di = (ry * rW + rx) * 4;
        const srcX = x + rx;
        const srcY = y + ry;

        outBuf[di] = rData[si];       // R
        outBuf[di+1] = rData[si+1];   // G
        outBuf[di+2] = rData[si+2];   // B

        // Set alpha: object pixels = 255, background = 0
        // Check if this pixel was part of an object in the original mask
        if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
          outBuf[di+3] = mask[srcY * width + srcX] === 1 ? 255 : 0;
        } else {
          outBuf[di+3] = 0;
        }
      }
    }

    const outPath = path.join(OUT, `${name}.png`);
    await sharp(outBuf, { raw: { width: rW, height: rH, channels: 4 } })
      .png()
      .toFile(outPath);

    console.log(`  -> ${name}: ${rW}x${rH}`);
    return { name, x, y, w: rW, h: rH };
  }

  // Extract based on row analysis
  const extracted = [];

  if (rows.length >= 1 && rows[0].length >= 2) {
    // Row 0: leftmost = laptop, rightmost = robot
    const laptop = rows[0].find(c => c.minX < width/2) || rows[0][0];
    const robot = rows[0].find(c => c.minX > width/2) || rows[0][1];
    extracted.push(await extractObject('hero-laptop', laptop, 5));
    extracted.push(await extractObject('hero-robot', robot, 10));
  }

  if (rows.length >= 2 && rows[1].length >= 2) {
    const sat = rows[1].find(c => c.minX < width/2) || rows[1][0];
    const modLap = rows[1].find(c => c.minX > width/2) || rows[1][1];
    extracted.push(await extractObject('satellite-dish', sat, 15));
    extracted.push(await extractObject('module-laptop', modLap, 5));
  }

  if (rows.length >= 3 && rows[2].length >= 3) {
    // Sort by X within row
    const r2 = [...rows[2]].sort((a,b) => a.minX - b.minX);
    extracted.push(await extractObject('microchip', r2[0], 5));
    extracted.push(await extractObject('lightbulb', r2[1], 15));
    extracted.push(await extractObject('collaboration', r2[2], 5));
  }

  if (rows.length >= 4 && rows[3].length >= 3) {
    const r3 = [...rows[3]].sort((a,b) => a.minX - b.minX);
    extracted.push(await extractObject('rocket', r3[0], 10));
    extracted.push(await extractObject('earth', r3[1], 5));
    extracted.push(await extractObject('pixel-heart', r3[2], 5));
  }

  // Extract robot-heart (speech bubble) from the robot component
  // The robot bbox includes the speech bubble to the right
  if (rows.length >= 1 && rows[1] && rows[0].length >= 2) {
    const robot = rows[0].find(c => c.minX > width/2) || rows[0][1];
    const robotW = robot.maxX - robot.minX;
    // Speech bubble is in the upper-right portion of the robot component
    // Extract right ~40% and top ~40%
    const bubbleBbox = {
      minX: robot.minX + Math.round(robotW * 0.55),
      minY: robot.minY,
      maxX: robot.maxX,
      maxY: robot.minY + Math.round((robot.maxY - robot.minY) * 0.45)
    };
    extracted.push(await extractObject('robot-heart', bubbleBbox, 5));
  }

  console.log(`\nExtracted ${extracted.length} assets:`);
  extracted.forEach(e => console.log(`  ${e.name}: ${e.w}x${e.h}`));

  // Verify all files exist
  const expected = ['hero-laptop','hero-robot','robot-heart','satellite-dish','module-laptop',
    'microchip','lightbulb','collaboration','rocket','earth','pixel-heart'];
  for (const name of expected) {
    const fp = path.join(OUT, `${name}.png`);
    if (fs.existsSync(fp)) {
      const stat = fs.statSync(fp);
      console.log(`  [OK] ${name}.png (${stat.size} bytes)`);
    } else {
      console.log(`  [MISSING] ${name}.png`);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
