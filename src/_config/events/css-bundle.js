const fs = require('node:fs');
const path = require('node:path');
const { bundle } = require('lightningcss');

const srcEntry = path.resolve('src/assets/css/style.css');
const outDir = '_site/assets/css';
const outFile = path.join(outDir, 'style.css');

async function cssBundle() {
  let { code } = bundle({
    filename: srcEntry,
    minify: true
  });

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, code);
}

module.exports = { cssBundle };
