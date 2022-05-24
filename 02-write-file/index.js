const path = require('path');
const fs = require('fs');
const readline = require('readline');

process.stdout.write('Git Bash for Windows 2.35.1-2.35.4 has a bug: Ctrl+C doesn\'t work. Either update or use another terminal\n');

const fileIn = path.join(__dirname , 'text.txt');

const writeStream = fs.createWriteStream(fileIn);

const question = () => { process.stdout.write('A line: '); };

const onLine = line => {
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
