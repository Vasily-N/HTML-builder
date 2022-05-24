const path = require('path');
const { checkAccessToDir } = require(path.resolve(__dirname, '..', '04-copy-directory'));
const { createReadStream, createWriteStream, promises: { readdir } } = require('fs');

const copyFileDataToStreamAsync = (path, ws) => {
  const rs = createReadStream(path);
  rs.pipe(ws, { end: false });
  return new Promise(resolve => rs.on('close', resolve));
};

const mergeStylesAsync = async(src, dest, fileOut) => {
  const mergeFileAsync = async(file, ws) => {
    if(!file.isFile() || path.extname(file.name) !== '.css') return;
    await copyFileDataToStreamAsync(path.join(src, file.name), ws);
    ws.write('\n');
  };

  const errSrc = await checkAccessToDir(src);
  if(errSrc) {
    process.stdout.write(`${errSrc}, abort mergeStyles`);
    return false;
  }

  const errDest = await checkAccessToDir(dest);
  if(errDest) {
    process.stdout.write(`${errDest}, abort mergeStyles`);
    return false;
  }

  const pathOut = path.join(dest, fileOut);

  try {
    const ws = createWriteStream(pathOut);
    const files = await readdir(src, {withFileTypes: true});
    for(const file of files) {
      await mergeFileAsync(file, ws);
    }
  } catch (e) {
    process.stdout.write(`${e}`);
  }
  return true;
};


if(require.main === module) {
  const alt = process.argv.includes('-t');
  const dirOut = path.join(__dirname, alt ? 'test-files' : 'project-dist');
  const dirIn = path.join(__dirname, alt ? 'test-files' : '', 'styles');
  mergeStylesAsync(dirIn, dirOut, 'bundle.css');
} else {
  module.exports = mergeStylesAsync;
}
