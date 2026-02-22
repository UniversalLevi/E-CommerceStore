const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', '.next');
try {
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('Cleaned .next folder');
} catch (e) {
  if (e.code !== 'ENOENT') console.warn(e.message);
}
