import sharp from 'sharp';
import { mkdirSync } from 'fs';

const ICONS_DIR = 'static/icons';
mkdirSync(ICONS_DIR, { recursive: true });

// Dice SVG with brand purple gradient
const diceSvg = (size) => {
  const s = size;
  const r = s * 0.1875; // rounded corner radius
  const pad = s * 0.0625; // border padding
  const w = s - pad * 2;
  const dotR = s * 0.078; // dot radius

  // Dot positions (5-face pattern) relative to inner area
  const cx1 = s * 0.3125;
  const cy1 = s * 0.3125;
  const cx2 = s * 0.6875;
  const cy2 = s * 0.3125;
  const cx3 = s * 0.5;
  const cy3 = s * 0.5;
  const cx4 = s * 0.3125;
  const cy4 = s * 0.6875;
  const cx5 = s * 0.6875;
  const cy5 = s * 0.6875;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${s}" y2="${s}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#c084fc"/>
      <stop offset="50%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#7e22ce"/>
    </linearGradient>
  </defs>
  <rect x="${pad}" y="${pad}" width="${w}" height="${w}" rx="${r}" fill="url(#bg)"/>
  <circle cx="${cx1}" cy="${cy1}" r="${dotR}" fill="white" opacity="0.95"/>
  <circle cx="${cx2}" cy="${cy2}" r="${dotR}" fill="white" opacity="0.95"/>
  <circle cx="${cx3}" cy="${cy3}" r="${dotR}" fill="white" opacity="0.95"/>
  <circle cx="${cx4}" cy="${cy4}" r="${dotR}" fill="white" opacity="0.95"/>
  <circle cx="${cx5}" cy="${cy5}" r="${dotR}" fill="white" opacity="0.95"/>
</svg>`;
};

// Maskable icon: full bleed background with dice centered in safe zone (inner 80%)
const maskableSvg = (size) => {
  const s = size;
  // Safe zone is the inner 80% = centered area of 80% size
  const safeStart = s * 0.1;
  const safeSize = s * 0.8;
  const diceSize = safeSize * 0.85;
  const diceOffset = safeStart + (safeSize - diceSize) / 2;
  const r = diceSize * 0.1875;
  const dotR = diceSize * 0.078;

  const cx = (pos) => diceOffset + diceSize * pos;
  const cy = (pos) => diceOffset + diceSize * pos;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">
  <defs>
    <linearGradient id="bgfull" x1="0" y1="0" x2="${s}" y2="${s}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1a1a3a"/>
      <stop offset="100%" stop-color="#0a0a0f"/>
    </linearGradient>
    <linearGradient id="dice" x1="${diceOffset}" y1="${diceOffset}" x2="${diceOffset + diceSize}" y2="${diceOffset + diceSize}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#c084fc"/>
      <stop offset="50%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#7e22ce"/>
    </linearGradient>
  </defs>
  <rect width="${s}" height="${s}" fill="url(#bgfull)"/>
  <rect x="${diceOffset}" y="${diceOffset}" width="${diceSize}" height="${diceSize}" rx="${r}" fill="url(#dice)"/>
  <circle cx="${cx(0.3125)}" cy="${cy(0.3125)}" r="${dotR}" fill="white" opacity="0.95"/>
  <circle cx="${cx(0.6875)}" cy="${cy(0.3125)}" r="${dotR}" fill="white" opacity="0.95"/>
  <circle cx="${cx(0.5)}" cy="${cy(0.5)}" r="${dotR}" fill="white" opacity="0.95"/>
  <circle cx="${cx(0.3125)}" cy="${cy(0.6875)}" r="${dotR}" fill="white" opacity="0.95"/>
  <circle cx="${cx(0.6875)}" cy="${cy(0.6875)}" r="${dotR}" fill="white" opacity="0.95"/>
</svg>`;
};

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generate() {
  // Generate standard icons
  for (const size of sizes) {
    const svg = Buffer.from(diceSvg(size));
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(`${ICONS_DIR}/icon-${size}x${size}.png`);
    console.log(`Generated icon-${size}x${size}.png`);
  }

  // Generate maskable icon (512x512)
  const maskSvg = Buffer.from(maskableSvg(512));
  await sharp(maskSvg)
    .resize(512, 512)
    .png()
    .toFile(`${ICONS_DIR}/icon-maskable-512x512.png`);
  console.log('Generated icon-maskable-512x512.png');

  // Generate apple-touch-icon (180x180)
  const appleSvg = Buffer.from(diceSvg(180));
  await sharp(appleSvg)
    .resize(180, 180)
    .png()
    .toFile(`${ICONS_DIR}/apple-touch-icon.png`);
  console.log('Generated apple-touch-icon.png');

  // Update favicon.svg to match brand colors
  const faviconSvg = diceSvg(32);
  const { writeFileSync } = await import('fs');
  writeFileSync('static/favicon.svg', faviconSvg);
  console.log('Updated favicon.svg with brand colors');

  console.log('\nAll icons generated successfully!');
}

generate().catch(console.error);
