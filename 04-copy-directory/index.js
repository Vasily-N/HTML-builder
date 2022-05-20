const path = require('path');
const { promises: fsp } = require('fs');

const src = path.join(__dirname, 'files');
const dest = path.join(__dirname, 'files-copy');

const copyDir = async(src, dest) => {
  if(await fsp.stat(dest).catch(() => false )) {
    await fsp.rm(dest, {recursive: true});
  }

  await fsp.mkdir(dest);
  const files = await fsp.readdir(src, {withFileTypes: true});
  files.forEach(async(file) => {
    const fileSrc = path.join(src, file.name);
    const fileDest = path.join(dest, file.name);
    if(file.isDirectory())
      await copyDir(fileSrc, fileDest);
    else if(file.isFile())
      await fsp.copyFile(fileSrc, fileDest);
  });
};

copyDir(src, dest);
