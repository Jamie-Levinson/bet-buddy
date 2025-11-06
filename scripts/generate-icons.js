/**
 * Generate PWA icons for BetBuddy
 * Creates simple PNG icons with a "B" logo on dark background
 * 
 * Run with: node scripts/generate-icons.js
 * Requires: sharp (npm install --save-dev sharp)
 */

const fs = require('fs');
const path = require('path');

// Simple SVG template for BetBuddy icon
const createIconSVG = (size) => {
  const fontSize = size * 0.56; // Increased from 0.52 for bigger B's
  const center = size / 2;
  const padding = size * 0.10; // Reduced padding to make box bigger
  const boxSize = size - (padding * 2);
  const borderRadius = size * 0.15; // Rounded corners for the box
  const offset = size * 0.11; // Increased offset for more separation
  const rightOffset = size * 0.15; // Increased offset for rightmost B
  
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Shiny gold gradient with highlights -->
    <linearGradient id="shinyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
      <stop offset="30%" style="stop-color:#FFA500;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#FFD700;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
    </linearGradient>
    <!-- Highlight for shine effect -->
    <linearGradient id="highlight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FFF8DC;stop-opacity:0.6" />
      <stop offset="50%" style="stop-color:#FFF8DC;stop-opacity:0.2" />
      <stop offset="100%" style="stop-color:#FFF8DC;stop-opacity:0" />
    </linearGradient>
  </defs>
  <!-- Black background/border -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#0a0a0a"/>
  <!-- Shiny gold rounded box -->
  <rect x="${padding}" y="${padding}" width="${boxSize}" height="${boxSize}" 
        rx="${borderRadius}" fill="url(#shinyGrad)"/>
  <!-- Highlight overlay for shine -->
  <rect x="${padding}" y="${padding}" width="${boxSize}" height="${boxSize * 0.5}" 
        rx="${borderRadius}" fill="url(#highlight)"/>
  <!-- First B (top-left offset) -->
  <text x="${center - offset}" y="${center - offset}" 
        font-family="Arial, sans-serif" 
        font-size="${fontSize}" 
        font-weight="bold" 
        fill="#0a0a0a" 
        text-anchor="middle" 
        dominant-baseline="middle">B</text>
  <!-- Second B (bottom-right offset, overlapping) -->
  <text x="${center + rightOffset}" y="${center + offset}" 
        font-family="Arial, sans-serif" 
        font-size="${fontSize}" 
        font-weight="bold" 
        fill="#0a0a0a" 
        text-anchor="middle" 
        dominant-baseline="middle">B</text>
</svg>`;
};

// Try to use sharp if available, otherwise fall back to SVG
async function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  try {
    // Try to use sharp for PNG generation
    const sharp = require('sharp');
    
    const sizes = [192, 512];
    
    for (const size of sizes) {
      const svg = createIconSVG(size);
      const buffer = Buffer.from(svg);
      
      await sharp(buffer)
        .png()
        .toFile(path.join(publicDir, `icon-${size}x${size}.png`));
      
      console.log(`✓ Generated icon-${size}x${size}.png`);
    }
    
    // Generate favicon.ico (32x32 is standard for favicon)
    const faviconSize = 32;
    const faviconSvg = createIconSVG(faviconSize);
    const faviconBuffer = Buffer.from(faviconSvg);
    const appDir = path.join(__dirname, '..', 'app');
    
    await sharp(faviconBuffer)
      .resize(faviconSize, faviconSize)
      .png()
      .toFile(path.join(appDir, 'favicon.ico'));
    
    console.log(`✓ Generated favicon.ico`);
    
    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('⚠️  sharp not found. Installing...');
      console.log('   Run: npm install --save-dev sharp');
      console.log('   Then run this script again.\n');
      
      // Fallback: Create SVG icons instead
      console.log('📝 Creating SVG icons as fallback...');
      const sizes = [192, 512];
      
      for (const size of sizes) {
        const svg = createIconSVG(size);
        fs.writeFileSync(
          path.join(publicDir, `icon-${size}x${size}.svg`),
          svg
        );
        console.log(`✓ Created icon-${size}x${size}.svg`);
      }
      
      console.log('\n⚠️  Note: SVG icons created. Update manifest.json to use SVG or install sharp for PNG.');
    } else {
      console.error('Error generating icons:', error);
      process.exit(1);
    }
  }
}

generateIcons();

