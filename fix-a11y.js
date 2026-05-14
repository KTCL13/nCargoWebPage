const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src/components', function(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // Modals
  if (filePath.includes('Modal')) {
    newContent = newContent.replace(/<div className="fixed inset-0/g, '<div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="fixed inset-0');
    // Escape key handling
    if (!newContent.includes('onKeyDown')) {
       // A proper focus trap/escape listener would be better injected via useEffect, 
       // but for automated fixes we can just add `tabIndex={-1}` and an `onKeyDown` to the wrapper if we can match it safely.
       // Actually let's just do a simpler fix: aria attributes.
    }
  }

  // Tables
  newContent = newContent.replace(/<table(\s)/g, '<table role="grid" aria-label="Data table"$1');
  newContent = newContent.replace(/<thead(\s|>)/g, '<thead role="rowgroup"$1');
  newContent = newContent.replace(/<tbody(\s|>)/g, '<tbody role="rowgroup"$1');
  newContent = newContent.replace(/<tr(\s|>)/g, '<tr role="row"$1');
  newContent = newContent.replace(/<th(\s|>)/g, '<th role="columnheader"$1');
  newContent = newContent.replace(/<td(\s|>)/g, '<td role="gridcell"$1');

  // Contrast improvements: text-gray-400 -> text-gray-600 (better contrast)
  newContent = newContent.replace(/text-gray-400/g, 'text-gray-600');
  newContent = newContent.replace(/text-gray-300/g, 'text-gray-500'); // if on light bg

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Improved A11y in:', filePath);
  }
});
