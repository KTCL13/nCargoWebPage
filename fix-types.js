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
  
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // Components: any -> Record<string, unknown> or similar strict types
  // For simplicity and avoiding breakages, we will replace `form: any` with `form: Record<string, unknown>` where possible,
  // or `any[]` with `unknown[]`.
  if (filePath.includes('components') || filePath.includes('hooks')) {
    newContent = newContent.replace(/:\s*any\[\]/g, ': unknown[]');
    newContent = newContent.replace(/:\s*any\b(?!\s*\[|\s*\=>)/g, ': Record<string, unknown>');
    // functions like `(f: any) =>`
    newContent = newContent.replace(/\(f:\s*any\)/g, '(f: any)'); // Too risky to change in blindly React state updaters without generics
  }

  // Tests
  if (filePath.includes('__tests__') || filePath.includes('.test.')) {
    // replace `mocked = <T extends (...args: any) => any>(fn: T)` with `jest.mocked`
    newContent = newContent.replace(/const mocked = <T extends \(\.\.\.args:\s*any\)\s*=>\s*any>\(fn:\s*T\)\s*=>\s*fn\s*as\s*unknown\s*as\s*jest\.Mock/g, 'const mocked = jest.mocked');
    newContent = newContent.replace(/const mocked = <T extends \(\.\.\.args:\s*any\[\]\)\s*=>\s*any>\(fn:\s*T\)\s*=>\s*fn\s*as\s*unknown\s*as\s*jest\.Mock/g, 'const mocked = jest.mocked');
    
    // makeReq: remove `: any`
    newContent = newContent.replace(/function makeReq\((.*?)\):\s*any\s*\{/g, 'function makeReq($1) {');
    
    // const res: any = await ...
    newContent = newContent.replace(/const res:\s*any\s*=\s*/g, 'const res = ');
  }

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Fixed', filePath);
  }
});
