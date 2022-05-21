const path = require('path');
const { readFile, promises:  {readdir, writeFile } } = require('fs');
const { copyDirAsync, createDirAsync } = require(path.resolve(__dirname, '..', '04-copy-directory'));
const mergeStylesAsync = require(path.resolve(__dirname, '..', '05-merge-styles'));

const dest = path.join(__dirname, 'project-dist');

const readFileData = path => 
  new Promise(resolve => 
    readFile(path, (_, data) => resolve(data.toString()))
  );

const buildPageAsync = async dest => {
  const tryMergeComponentToHTML = (html, componentKey, componentValue) => {
    const toReplace = html.split(new RegExp(`( *?){{${componentKey}}}`, 'g'));
    if(toReplace.length < 2 ) return html;
    const componentRows = componentValue.split(/^/mg);
    return toReplace.map((v, i) => (i % 2) ? `${v}${componentRows.join(v)}` : v).join('');
  };

  //using await at the same line as func call is much slower
  const createDirPromise = createDirAsync(dest);

  const templatePromise = readFileData(path.join(__dirname, 'template.html'));

  const componentsDir = path.join(__dirname, 'components');
  const filesPromise = readdir(componentsDir, {withFileTypes: true});

  const componentsPromise = (await filesPromise).reduce((p, file) => 
    file.isFile() ? (fileParse => fileParse.ext === '.html'
      ? {...p, [fileParse.name]: readFileData(path.join(componentsDir, file.name))}
      : p)(path.parse(file.name)) : p, {});

  await createDirPromise;
  copyDirAsync(path.join(__dirname, 'assets'), path.join(dest, 'assets'));
  mergeStylesAsync(path.join(__dirname, 'styles'), path.join(dest, 'style.css'));

  const resultHTML = await Object.keys(componentsPromise).reduce(async(pPromise, c) =>
    tryMergeComponentToHTML(await pPromise, c, await componentsPromise[c]), templatePromise);
  await writeFile(path.join(dest, 'index.html'), resultHTML);
};

buildPageAsync(dest);
