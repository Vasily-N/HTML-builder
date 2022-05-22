const path = require('path');
const { promises: fsp } = require('fs');

const createDirAsync = async(dest) => {
  const destNotExist = (await fsp.access(dest).catch(e => e.code));
  if(!destNotExist) {
    await fsp.rm(dest, { recursive: true });
  } else if(destNotExist !== 'ENOENT') {
    return false;
  }

  try {
    await fsp.mkdir(dest, { recursive: true, maxRetries: 10, retryDelay: 100 });
  } catch {
    return false;
  }

  return true;
};

const copyDirAsync = async(dirSrc, dirDest) => {
  const srcNotExist = await fsp.access(dirSrc).catch(() => true);
  if(srcNotExist) {
    process.stdout.write(`No access to ${dirSrc}, abort copyDir`);
    return;
  }

  if(!(await createDirAsync(dirDest))) {
    process.stdout.write(`Something (it can be VSCode!) is blocking access to ${dirDest}, abort copyDir`);
    return;
  }

  const files = await fsp.readdir(dirSrc, {withFileTypes: true});
  files.forEach(async(file) => {
    const src = path.join(dirSrc, file.name);
    const dest = path.join(dirDest, file.name);
    if(file.isDirectory())
      await copyDirAsync(src, dest);
    else if(file.isFile())
      await fsp.copyFile(src, dest);
  });
};

if(require.main === module) {
  const src = path.join(__dirname, 'files');
  const dest = path.join(__dirname, 'files-copy');
  copyDirAsync(src, dest);
} else {
  module.exports = { copyDirAsync, createDirAsync };
}
