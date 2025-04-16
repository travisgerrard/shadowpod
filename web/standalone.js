const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create a clean src/shared directory
console.log('Setting up standalone build environment...');

try {
  // Create directories if they don't exist
  if (!fs.existsSync(path.join(__dirname, 'src', 'shared'))) {
    fs.mkdirSync(path.join(__dirname, 'src', 'shared'), { recursive: true });
  }

  // Copy only the web-specific files from shared
  console.log('Copying shared files...');
  
  // Clean any previous shared files
  const sharedDir = path.join(__dirname, 'src', 'shared');
  fs.readdirSync(sharedDir).forEach(file => {
    if (file.includes('.native.')) {
      fs.unlinkSync(path.join(sharedDir, file));
    }
  });

  // Define files to copy (exclude .native. files)
  const sharedSourceDir = path.join(__dirname, '..', 'shared', 'lib');
  
  fs.readdirSync(sharedSourceDir).forEach(file => {
    if (!file.includes('.native.')) {
      fs.copyFileSync(
        path.join(sharedSourceDir, file),
        path.join(sharedDir, file)
      );
      console.log(`Copied ${file}`);
    }
  });

  // Create an index.ts file if it doesn't exist
  const indexPath = path.join(sharedDir, 'index.ts');
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, `// Export shared functionality
export * from './types';
export * from './session';
`);
    console.log('Created index.ts');
  }

  console.log('Standalone setup complete.');
  
  // Run the next build command
  console.log('Starting Next.js build...');
  execSync('next build', { stdio: 'inherit' });
  
} catch (error) {
  console.error('Error during standalone setup:', error);
  process.exit(1);
} 