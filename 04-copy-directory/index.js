const path = require('path');
const { promises: fsp } = require('fs');

const checkAccessToDir = async dir => 
  (await fsp.access(dir).catch(() => true)) ? `No access to ${dir}` : false;

const createDirAsync = async dir => {
  const destNotExist = (await fsp.access(dir).catch(e => e.code));
  let err = false;
  if(!destNotExist) {
    await fsp.rm(dir, { recursive: true });
  } else if(destNotExist !== 'ENOENT') {
    err = true;
  }

  try {
    await fsp.mkdir(dir, { recursive: true, maxRetries: 10, retryDelay: 100 });
  } catch {
    err = true;
  }
  return err ? `Something (it can be VSCode, please close to be sure!) is blocking access to ${dir}` : false;
};

const copyDirAsync = async(dirSrc, dirDest) => {
  const errSrc = await checkAccessToDir(dirSrc);
  if(errSrc) {
    process.stdout.write(`${errSrc}, abort copyDir`);
    return;
  }

  const errDest = await createDirAsync(dirDest);
  if(errDest) {
    process.stdout.write(`${errDest}, abort copyDir`);
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
  module.exports = { copyDirAsync, createDirAsync, checkAccessToDir };
}
