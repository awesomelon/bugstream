import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'src', 'assets', 'icons');

const sizes = [16, 48, 128];

async function generateIcons() {
  for (const size of sizes) {
    const svgBuffer = Buffer.from(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size * 0.4}" stroke="#3b82f6" stroke-width="${Math.max(1, size * 0.05)}"/>
        <circle cx="${size/2}" cy="${size/2}" r="${size * 0.16}" fill="#3b82f6"/>
      </svg>
    `);

    await sharp(svgBuffer)
      .png()
      .toFile(join(iconsDir, `icon${size}.png`));

    console.log(`Generated icon${size}.png`);
  }
}

generateIcons().catch(console.error);
