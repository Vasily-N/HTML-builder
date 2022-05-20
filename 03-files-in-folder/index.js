const path = require('path');
const fs = require('fs');
const { readdir } = fs.promises;

const dir = path.join(__dirname , 'secret-folder');

const getFileSizeAsync = async filePath =>
  await new Promise(resolve => {
    fs.stat(filePath, (_, stats) => resolve(stats.size));
  });

const getFileSizeFormatAsync = async filePath =>
  `${((await getFileSizeAsync(filePath))/1024).toFixed(3)}kb`;

const getFileInfoFormatAsync = async (dir, fileName) =>
  await (async(filePath, ext) =>
    `${fileName} - ${ext} - ${await getFileSizeFormatAsync(filePath)}`)(
    path.join(dir, fileName), fileName.split('.').pop());

const logDirFilesInfoAsync = (dir, files) =>
  files.forEach(async file =>
    file.isDirectory() || process.stdout.write(`${await getFileInfoFormatAsync(dir, file.name)}\n`));

const getDirFilesInfoAsync = async (dir, files) => 
  await files.reduce(async (pAsync, file) =>
    await (async p => file.isDirectory() ? p
      : `${p ? `${p}\n` : ''}${await getFileInfoFormatAsync(dir, file.name)}`)(await pAsync)
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
