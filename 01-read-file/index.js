const fs = require('fs');
const path = require('path');

const fileIn = path.join(__dirname , 'text.txt');

const readStream = fs.createReadStream(fileIn);
readStream.on('data', chunk => process.stdout.write(chunk));
