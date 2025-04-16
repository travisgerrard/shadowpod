#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_ICON = path.join(__dirname, '../public/icon.png');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Icon sizes for PWA (following common PWA standards)
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  try {
    console.log(`Generating icons from ${SOURCE_ICON}...`);
    
    // Verify source file exists
    if (!fs.existsSync(SOURCE_ICON)) {
      console.error(`Source icon not found at ${SOURCE_ICON}`);
      console.log('Please place a high-resolution "icon.png" file in the public directory');
      process.exit(1);
    }
    
    // Process each size
    const promises = sizes.map(async (size) => {
      const outputFile = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
      
      await sharp(SOURCE_ICON)
        .resize(size, size)
        .png()
        .toFile(outputFile);
      
      console.log(`Generated: ${outputFile}`);
    });
    
    // Add maskable icon
    promises.push(
      sharp(SOURCE_ICON)
        .resize(512, 512)
        .png()
        .toFile(path.join(OUTPUT_DIR, 'maskable-icon.png'))
        .then(() => console.log('Generated maskable icon'))
    );
    
    // Add Apple touch icon
    promises.push(
      sharp(SOURCE_ICON)
        .resize(180, 180)
        .png()
        .toFile(path.join(OUTPUT_DIR, 'apple-touch-icon.png'))
        .then(() => console.log('Generated Apple touch icon'))
    );
    
    await Promise.all(promises);
    console.log('All icons generated successfully!');
    
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons(); 