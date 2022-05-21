const path = require('path');
const { createReadStream, createWriteStream, promises: { readdir } } = require('fs');

const alt = process.argv.includes('-t');

const dirOut = path.join(__dirname, alt ? 'test-files' : 'project-dist');
const pathOut = path.join(dirOut, 'bundle.css');
const dirIn = path.join(__dirname, alt ? 'test-files' : '', 'styles');

const copyFileDataToStreamAsync = (path, ws) => {
  const rs = createReadStream(path);
  rs.pipe(ws, { end: false });
  return new Promise(resolve => rs.on('close', resolve));
};

const mergeStylesAsync = async(src, dest) => {
  const mergeFileAsync = async(file, ws) => {
    if(!file.isFile() || path.extname(file.name) !== '.css') return;
    await copyFileDataToStreamAsync(path.join(src, file.name), ws);
    ws.write('\n');
  };

  const ws = createWriteStream(dest);
  const files = await readdir(src, {withFileTypes: true});
  for(const file of files) {
    await mergeFileAsync(file, ws);
  }
};


if(require.main === module)
  mergeStylesAsync(dirIn, pathOut);
else {
  module.exports = mergeStylesAsync;
}
