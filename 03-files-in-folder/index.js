const path = require('path');
const { promises: { readdir, stat } } = require('fs');

const dir = path.join(__dirname , 'secret-folder');

const getFileSizeAsync = async filePath => (await stat(filePath)).size;

const getFileSizeFormatAsync = async filePath =>
  `${((await getFileSizeAsync(filePath))/1024).toFixed(3)}kb`;

const getFileInfoFormatAsync = async (dir, fileName) =>
  await (async(filePath, ext) =>
    `${fileName} - ${ext} - ${await getFileSizeFormatAsync(filePath)}`)(
    path.join(dir, fileName), fileName.split('.').pop());

const logDirFilesInfoAsync = (dir, files) =>
  files.forEach(async file =>
    file.isDirectory() || file.isFile() && process.stdout.write(`${await getFileInfoFormatAsync(dir, file.name)}\n`));


const getDirFilesInfoAsync = async (dir, files) => 
  await files.reduce(async (pPromise, file) =>
    file.isDirectory() ? await pPromise
      : ((filesInfo, fileInfo) => `${filesInfo ? `${filesInfo}\n` : ''}${fileInfo}`)(
        await pPromise, await getFileInfoFormatAsync(dir, file.name))
  , Promise.resolve(undefined));

const getDirInfo = async(dir, getFullInfoAtOnce = false) => {
  const files = await readdir(dir, {withFileTypes: true});
  if(getFullInfoAtOnce) {
    const result = await getDirFilesInfoAsync(dir, files);
    process.stdout.write(result);
  } else {
    logDirFilesInfoAsync(dir, files);
  }
};

getDirInfo(dir, process.argv.includes('-r'));
