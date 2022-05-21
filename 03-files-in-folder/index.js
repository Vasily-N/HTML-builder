const path = require('path');
const { promises: { readdir, stat } } = require('fs');

const dir = path.join(__dirname , 'secret-folder');

const getFileSizeAsync = async filePath => (await stat(filePath)).size;

const formatFileInfo = (fileName, ext, fileSize) => `${fileName} - ${ext} - ${(fileSize/1024).toFixed(3)}kb`;

const getFormatFileInfoAsync = async (dir, fileName) =>
  formatFileInfo(fileName, fileName.split('.').pop(), await getFileSizeAsync(path.join(dir, fileName)));

const logDirFilesInfoAsync = (dir, files) =>
  files.forEach(async file =>
    file.isDirectory() || file.isFile() && process.stdout.write(
      `${await getFormatFileInfoAsync(dir, file.name)}\n`));


const getDirFilesInfoAsync = async (dir, files) => 
  await files.reduce(async (pPromise, file) =>
    file.isDirectory() ? await pPromise
      : ((filesInfo, fileInfo) => `${filesInfo ? `${filesInfo}\n` : ''}${fileInfo}`)(
        await pPromise, await getFormatFileInfoAsync(dir, file.name))
  , Promise.resolve(undefined));

const getDirInfo = async(dir, getFullInfoAtOnce = true) => {
  const files = await readdir(dir, {withFileTypes: true});
  if(getFullInfoAtOnce) {
    const result = await getDirFilesInfoAsync(dir, files);
    process.stdout.write(result);
  } else {
    logDirFilesInfoAsync(dir, files);
  }
};

getDirInfo(dir, !process.argv.includes('-p'));
