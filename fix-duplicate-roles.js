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
  let newContent = content.replace(/<tr role="row" ([^>]*?)role="([^"]*?)"/g, '<tr $1 role="$2"');
  
  // Just in case we have `<tr role="row" tabIndex={0} role="button"`
  // Let's replace literally `role="row"` followed by `role="...`
  // Actually, standard regex replaces the first role. 
  // e.g. <tr role="row" tabIndex={0} role="button" -> <tr tabIndex={0} role="button"
  
  // Also fixing the case where there might be other duplicate roles.
  // The error specifies: "Type error: JSX elements cannot have multiple attributes with the same name."
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed duplicate role in:', filePath);
  }
});
