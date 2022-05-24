const path = require('path');
const { createReadStream, createWriteStream, promises: fsp } = require('fs');
const { readFile, readdir, writeFile } = fsp;

const errMessage = msg => process.stdout.write(`Please close a program (can be VSCode's "live server") that blocks ${msg} from updating\n`);

//copypaste code instead of usage of files because other people in cross-check test with empty files and they doesn't work

const checkAccessToDir = async dir =>
  (await fsp.access(dir).catch(() => true)) ? `No access to ${dir}` : false;

const createDirAsync = async dir => {
  const destNotExist = (await fsp.access(dir).catch(e => e.code));
  let err = false;
  if(!destNotExist) {
    try {
      await fsp.rm(dir, { recursive: true });
    } catch {
      err = true;
    }
  } else if(destNotExist !== 'ENOENT') {
    err = true;
  }

  if(!err) {
    try {
      await fsp.mkdir(dir, { recursive: true, maxRetries: 10, retryDelay: 100 });
    } catch {
      err = true;
    }
  }
  return err ? `Something (it can be VSCode, please close to be sure!) is blocking access to ${dir}` : false;
};

const copyDirAsync = async(dirSrc, dirDest) => {
  const errSrc = await checkAccessToDir(dirSrc);
  if(errSrc) {
    process.stdout.write(`${errSrc}, abort copyDir`);
    return false;
  }

  const errDest = await createDirAsync(dirDest);
  if(errDest) {
    process.stdout.write(`${errDest}, abort copyDir`);
    return false;
  }

  const files = await fsp.readdir(dirSrc, {withFileTypes: true});
  files.forEach(async(file) => {
    const src = path.join(dirSrc, file.name);
    const dest = path.join(dirDest, file.name);
    if(file.isDirectory()) {
      const success = await copyDirAsync(src, dest);
      if(!success) return false;
    }
    else if(file.isFile())
      await fsp.copyFile(src, dest);
  });

  return true;
};

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

const buildHtmlAsync = async(templateSrc, componentsSrc, dest, htmlDestFile) => {
  const tryMergeComponentToHTML = (html, componentKey, componentValue) => {
    const toReplace = html.split(new RegExp(`( *?){{${componentKey}}}`, 'g'));
    if(toReplace.length < 2 ) return html;
    const componentRows = componentValue.split(/^/mg);
    return toReplace.map((v, i) => (i % 2) ? `${v}${componentRows.join(v)}` : v).join('');
  };

  const htmlDest = path.join(dest, htmlDestFile);
  const filesPromise = readdir(componentsSrc, {withFileTypes: true}).catch(() => []);

  const templatePromise = readFile(templateSrc);

  const componentsPromise = (await filesPromise).reduce((p, file) => 
    file.isFile() ? (fileParse => fileParse.ext === '.html'
      ? {...p, [fileParse.name]: readFile(path.join(componentsSrc, file.name))}
      : p)(path.parse(file.name)) : p, {});

  const resultHTML = await Object.keys(componentsPromise).reduce(async(pPromise, c) =>
    tryMergeComponentToHTML(await pPromise, c, (await componentsPromise[c]).toString()), (await templatePromise).toString());

  try {
    await writeFile(htmlDest, resultHTML);
  } catch {
    return false;
  }

  return true;
};

const buildPageAsync = async (src, dest) => {
  const templateSrc = path.join(src, 'template.html');
  const componentsSrc = path.join(src, 'components');
  const htmlDestFile = 'index.html';

  const assetsSrc = path.join(src, 'assets');
  const assetsDestPath = path.join(dest, 'assets');

  const stylesSrc = path.join(src, 'styles');
  const stylesDestFile = 'style.css';

  if(await createDirAsync(dest)) {
    errMessage(dest);
    return;
  }

  const copyDirSuccessPromise = copyDirAsync(assetsSrc, assetsDestPath);
  const mergeSuccessPromise = mergeStylesAsync(stylesSrc, dest, stylesDestFile);
  const buildHtmlSuccessPromies = buildHtmlAsync(templateSrc, componentsSrc, dest, htmlDestFile);

  if(!(await copyDirSuccessPromise)) errMessage(assetsDestPath);
  if(!(await mergeSuccessPromise)) errMessage(stylesDestFile);
  if(!(await buildHtmlSuccessPromies)) errMessage(htmlDestFile);
};

const src = __dirname;
const dest = path.join(__dirname, 'project-dist');

buildPageAsync(src, dest);
