const fs = require('fs')
const path = require('path')
const util = require('util')


async function run(){
    const readFilePromise = util.promisify(fs.readFile)
    const imagePath = path.join(__dirname, 'test.png')
    const bytes = await readFilePromise(imagePath, 'binary')
    const buffer = Buffer.from(bytes, 'binary')
    const content = buffer.toString('base64')
    console.log(content);
}

run().catch(err => {
    console.error(err, err.stack)
})
