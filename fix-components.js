const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src', function(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
  
  // Only target non-test files
  if (filePath.includes('__tests__') || filePath.includes('.test.')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // Components: any -> Record<string, unknown> or similar strict types
  newContent = newContent.replace(/:\s*any\[\]/g, ': unknown[]');
  newContent = newContent.replace(/:\s*any\b(?!\s*\[|\s*\=>)/g, ': Record<string, unknown>');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed', filePath);
  }
});
