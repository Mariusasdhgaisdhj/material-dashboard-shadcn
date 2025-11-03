#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simple bundle analyzer for Vite build output
function analyzeBundle() {
  const distDir = path.join(__dirname, 'dist');
  
  if (!fs.existsSync(distDir)) {
    console.log('❌ No dist folder found. Please run "npm run build" first.');
    return;
  }

  console.log('📊 Bundle Analysis Report');
  console.log('========================\n');

  // Analyze JS files
  const jsDir = path.join(distDir, 'js');
  if (fs.existsSync(jsDir)) {
    const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'));
    
    console.log('📦 JavaScript Chunks:');
    let totalJsSize = 0;
    
    jsFiles.forEach(file => {
      const filePath = path.join(jsDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      totalJsSize += stats.size;
      
      const sizeColor = stats.size > 500 * 1024 ? '🔴' : stats.size > 200 * 1024 ? '🟡' : '🟢';
      console.log(`  ${sizeColor} ${file}: ${sizeKB} KB`);
    });
    
    console.log(`\n📈 Total JS Size: ${(totalJsSize / 1024).toFixed(2)} KB\n`);
  }

  // Analyze CSS files
  const cssDir = path.join(distDir, 'css');
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'));
    
    console.log('🎨 CSS Files:');
    let totalCssSize = 0;
    
    cssFiles.forEach(file => {
      const filePath = path.join(cssDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      totalCssSize += stats.size;
      
      console.log(`  🟢 ${file}: ${sizeKB} KB`);
    });
    
    console.log(`\n📈 Total CSS Size: ${(totalCssSize / 1024).toFixed(2)} KB\n`);
  }

  // Check for large files
  console.log('🔍 Large Files (>500KB):');
  const largeFiles = [];
  
  function checkDirectory(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        checkDirectory(filePath, `${prefix}${file}/`);
      } else {
        const sizeKB = stats.size / 1024;
        if (sizeKB > 500) {
          largeFiles.push({ path: `${prefix}${file}`, size: sizeKB });
        }
      }
    });
  }
  
  checkDirectory(distDir);
  
  if (largeFiles.length > 0) {
    largeFiles.forEach(file => {
      console.log(`  🔴 ${file.path}: ${file.size.toFixed(2)} KB`);
    });
  } else {
    console.log('  ✅ No files larger than 500KB found!');
  }

  console.log('\n💡 Optimization Tips:');
  console.log('  • Use dynamic imports for large components');
  console.log('  • Consider code splitting for heavy libraries');
  console.log('  • Optimize images and assets');
  console.log('  • Remove unused dependencies');
}

// Run the analysis
analyzeBundle();
