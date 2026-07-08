const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

sizes.forEach((size) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0f172a" rx="${size * 0.15}"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#ef4444" font-family="Arial,sans-serif" font-weight="bold" font-size="${size * 0.35}">K</text>
</svg>`;

  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svg);
  console.log(`Created icon-${size}x${size}.svg`);
});

console.log('\nNote: For production, convert these SVGs to PNGs using a tool like sharp or an online converter.');
console.log('The manifest.json references .png files. Replace .svg icons with .png versions before deploying.');
