const path = require('path');
const { readFile, promises:  {readdir, writeFile } } = require('fs');
const { copyDirAsync, createDirAsync } = require(path.resolve(__dirname, '..', '04-copy-directory'));
const mergeStylesAsync = require(path.resolve(__dirname, '..', '05-merge-styles'));

const dest = path.join(__dirname, 'project-dist');

const readFileData = path => 
  new Promise(resolve => 
    readFile(path, (_, data) => resolve(data.toString()))
  );

const errMessage = msg => process.stdout.write(`Please close a program (can be VSCode's "live server") that blocks ${msg} from updating\n`);

const buildPageAsync = async dest => {
  const tryMergeComponentToHTML = (html, componentKey, componentValue) => {
    const toReplace = html.split(new RegExp(`( *?){{${componentKey}}}`, 'g'));
    if(toReplace.length < 2 ) return html;
    const componentRows = componentValue.split(/^/mg);
    return toReplace.map((v, i) => (i % 2) ? `${v}${componentRows.join(v)}` : v).join('');
  };

  const htmlFileName = 'index.html';
  const stylesFileName = 'style.css';
  //using await at the same line as func call is much slower
  const createDirPromise = createDirAsync(dest);

  const templatePromise = readFileData(path.join(__dirname, 'template.html'));

  const componentsDir = path.join(__dirname, 'components');
  const filesPromise = readdir(componentsDir, {withFileTypes: true}).catch(() => []);

  const componentsPromise = (await filesPromise).reduce((p, file) => 
    file.isFile() ? (fileParse => fileParse.ext === '.html'
      ? {...p, [fileParse.name]: readFileData(path.join(componentsDir, file.name))}
      : p)(path.parse(file.name)) : p, {});

  const createDirErr = await createDirPromise;
  if(createDirErr) {
    errMessage(dest);
    return;
  }

  const assetsDestPath = path.join(dest, 'assets');
  const copyDirSuccessPromise = copyDirAsync(path.join(__dirname, 'assets'), assetsDestPath);
  const mergeSuccessPromise = mergeStylesAsync(path.join(__dirname, 'styles'), dest, stylesFileName);

  const resultHTML = await Object.keys(componentsPromise).reduce(async(pPromise, c) =>
    tryMergeComponentToHTML(await pPromise, c, await componentsPromise[c]), templatePromise);
  try {
    await writeFile(path.join(dest, htmlFileName), resultHTML);
  } catch {
    errMessage(htmlFileName);
  }

  if(!(await copyDirSuccessPromise)) {
    errMessage(assetsDestPath);
  }

  if(!(await mergeSuccessPromise)) {
    errMessage(stylesFileName);
  }
};

buildPageAsync(dest);
