const path = require('path');
const { promises:  { readFile, readdir, writeFile } } = require('fs');
const { copyDirAsync, createDirAsync } = require(path.resolve(__dirname, '..', '04-copy-directory'));
const mergeStylesAsync = require(path.resolve(__dirname, '..', '05-merge-styles'));

const errMessage = msg => process.stdout.write(`Please close a program (can be VSCode's "live server") that blocks ${msg} from updating\n`);

const buildPageAsync = async (src, dest) => { //todo: custom filenames via options?
  const tryMergeComponentToHTML = (html, componentKey, componentValue) => {
    const toReplace = html.split(new RegExp(`( *?){{${componentKey}}}`, 'g'));
    if(toReplace.length < 2 ) return html;
    const componentRows = componentValue.split(/^/mg);
    return toReplace.map((v, i) => (i % 2) ? `${v}${componentRows.join(v)}` : v).join('');
  };

  const templateSrc = path.join(src, 'template.html');
  const componentsSrc = path.join(src, 'components');
  const htmlDestFile = 'index.html';
  const htmlDest = path.join(dest, htmlDestFile);

  const assetsSrc = path.join(src, 'assets');
  const assetsDestPath = path.join(dest, 'assets');

  const stylesSrc = path.join(src, 'styles');
  const stylesDestFile = 'style.css';

  //using await at the same line as func call is much slower
  const createDirPromise = createDirAsync(dest);

  const templatePromise = readFile(templateSrc);

  const filesPromise = readdir(componentsSrc, {withFileTypes: true}).catch(() => []);

  const componentsPromise = (await filesPromise).reduce((p, file) => 
    file.isFile() ? (fileParse => fileParse.ext === '.html'
      ? {...p, [fileParse.name]: readFile(path.join(componentsSrc, file.name))}
      : p)(path.parse(file.name)) : p, {});

  const createDirErr = await createDirPromise;
  if(createDirErr) {
    errMessage(dest);
    return;
  }

  const copyDirSuccessPromise = copyDirAsync(assetsSrc, assetsDestPath);
  const mergeSuccessPromise = mergeStylesAsync(stylesSrc, dest, stylesDestFile);

  const resultHTML = await Object.keys(componentsPromise).reduce(async(pPromise, c) =>
    tryMergeComponentToHTML(await pPromise, c, (await componentsPromise[c]).toString()), (await templatePromise).toString());

  try {
    await writeFile(htmlDest, resultHTML);
  } catch {
    errMessage(htmlDestFile);
  }

  if(!(await copyDirSuccessPromise)) {
    errMessage(assetsDestPath);
  }

  if(!(await mergeSuccessPromise)) {
    errMessage(stylesDestFile);
  }
};

const src = __dirname;
const dest = path.join(__dirname, 'project-dist');


buildPageAsync(src, dest);
