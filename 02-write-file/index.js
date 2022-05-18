const path = require('path');
const fs = require('fs');
const readline = require('readline');

const writeStream = fs.createWriteStream(path.join(__dirname , 'text.txt'));

const question = () => { process.stdout.write('A line: '); };

const onLine = (line) => {
  if(line === 'exit') process.exit();
  writeStream.write(`${line}\n`);
  question();
};

const rl = readline.createInterface(process.stdin);
rl.on('line', onLine);
question();

const onExit = () => {
  rl.close();
  writeStream.end();
  process.stdout.write('exit from 02-write-file');
};

process.on('exit', onExit);
['SIGINT', 'SIGTERM', 'SIGKILL', 'SIGQUIT'].forEach( v => process.on(v, () => {
  process.stdout.write('\n');
  process.exit();
}) );
