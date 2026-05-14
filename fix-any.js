const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedFiles = 0;

walkDir('src', function(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;

  // 1. const res: any = await ... -> const res = await ...
  newContent = newContent.replace(/const res:\s*any\s*=\s*/g, 'const res = ');
  
  // 2. makeReq(...): any -> makeReq(...)
  newContent = newContent.replace(/makeReq\((.*?)\):\s*any\s*\{/g, 'makeReq($1) {');
  
  // 3. mocked = <T extends (...args: any) => any>
  newContent = newContent.replace(/<T extends \(\.\.\.args:\s*any\)\s*=>\s*any>/g, '<T extends (...args: unknown[]) => unknown>');
  newContent = newContent.replace(/<T extends \(\.\.\.args:\s*any\[\]\)\s*=>\s*any>/g, '<T extends (...args: unknown[]) => unknown>');

  // 4. as any -> as unknown
  newContent = newContent.replace(/as\s+any/g, 'as unknown');

  // 5. : any -> : unknown (very risky globally, maybe skip or target specific ones)
  // Let's target mock variables like `const mockContracts: any[]` -> `const mockContracts: unknown[]`
  newContent = newContent.replace(/:\s*any\[\]/g, ': unknown[]');
  newContent = newContent.replace(/:\s*any\b(?!\s*\[|\s*\=>)/g, ': unknown');

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    modifiedFiles++;
    console.log('Modified:', filePath);
  }
});

console.log('Total modified files:', modifiedFiles);
