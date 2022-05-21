const path = require('path');
const { promises: fsp } = require('fs');

const src = path.join(__dirname, 'files');
const dest = path.join(__dirname, 'files-copy');

const createDirAsync = async(dest) => {
  if(await fsp.stat(dest).catch(() => false )) {
    await fsp.rm(dest, { recursive: true });
  }
  await fsp.mkdir(dest, { recursive: true, maxRetries: 10, retryDelay: 100 });
};

const copyDirAsync = async(src, dest) => {
  await createDirAsync(dest);
  const files = await fsp.readdir(src, {withFileTypes: true});
  files.forEach(async(file) => {
    const fileSrc = path.join(src, file.name);
    const fileDest = path.join(dest, file.name);
    if(file.isDirectory())
      await copyDirAsync(fileSrc, fileDest);
    else if(file.isFile())
      await fsp.copyFile(fileSrc, fileDest);
  });
};

if(require.main === module)
  copyDirAsync(src, dest);
else {
  module.exports = { copyDirAsync, createDirAsync };
}
