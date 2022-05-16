const fs = require('fs');

/* Simple helper function to get the nth index of 'search' in 'text' */
function nthIndexFromEnd(text, search, n) {
    let index = 0
    n--;

    for (let i = text.length; i > 0; i--) {
        if (text[i] == search) {
            if (n > 0) {
                n--;
            } else {
                index = i;
                break;
            }
        }
    }

    return index;
}

/*
    Get Last N lines from a specific file. If the file will not
    contain more than N lines, then this function will return 
    the whole file.

    Function arguments:
    - filepath - path to the file.
    - n - number of lines to read from end.
    - bufferSize - the size of buffer that we going to allocate.

    Returns last n lines (string).
*/
function getLastNLinesSync(filepath, n, bufferSize=1024) {
    const fd = fs.openSync(filepath, 'r'); // read file

    // get file stats
    const stats = fs.statSync(filepath);
    
    // \n symbol
    const NEW_LINE_CHAR = '\n';

    // size of file in bytes
    const size = stats.size;

    // here we will store the last N lines
    let resultingString = '';

    // variable to track how much lines we store
    let newLinesMet = 0;

    // we use 'i' as an offset multiplier
    let i = 0; 

    // read until we got N lines in resultingString
    // or until we get to the start of the file
    while (newLinesMet < n && size-bufferSize*i > 0){
        // we get closer to the start by i*bufferSize
        i++;
        
        // calculate position and quantity bytes to read in current iteration 
        let position = size - bufferSize * i;
        let bytesInIteration = bufferSize;

        // correcting the offset
        if (position < 0) {
            bytesInIteration += position;
            position = 0;
        }

        // allocate 'bufferSize' bytes
        const buf = Buffer.alloc(bufferSize); 

        // read the bytes in sync
        const bytesRead = fs.readSync(fd, buf, 0, bytesInIteration, position);

        // convert data that we read to UTF-8
        const data = buf.toString('utf-8');

        // chunk of string that we read
        const readText = data.slice(0, bytesRead);
        
        // check if this chunk contains new line symbol
        if (readText.includes(NEW_LINE_CHAR)) {
            // count new line symbols
            const lines = (readText.match(/\n/g) || '').length;

            // if the chunk contains more lines than we need
            if (newLinesMet+lines > n-1) {
                const remaining = n - newLinesMet;
                newLinesMet += lines;

                resultingString = readText.substring(
                    nthIndexFromEnd(readText, NEW_LINE_CHAR, remaining),
                    readText.length,
                ) + resultingString;
            } else { // add the string and count lines if we will need more new lines
                newLinesMet += lines;
                resultingString = readText + resultingString;
            }
        } else { // add the string if no new lines found
            resultingString = readText + resultingString;
        }
        
    }

    fs.closeSync(fd);

    // finally return the found string (last n lines)
    return resultingString.trim();
}

/* This function tests getLastNLinesSync function */
async function test() {
    const nLimit = 20; // number of lines we are going to test (1, 2, 3, ..., 20)
    const bytesLimit = 1024 // number of bytes we are going to test to allocate (1, 2, 3, ..., 8192)
    const combinations = nLimit * bytesLimit // number of tests
    let ok = 0; // number of successful tests

    // read file using fs.readFileSync (ONLY FOR GENERATING EXPECTED DATA)
    const filepath = './data-18.txt'; // 583 bytes
    const content = fs.readFileSync(filepath, { encoding: 'utf-8'});
    const splitted = content.split('\n');
    
    // generate expected data
    const expected = {}; 

    for (let i = 1; i <= nLimit; i++) {
        expected[i] = splitted.slice(-i).join('\n');
    }

    // number of lines
    for (let n = 1; n <= nLimit; n++) {
        // bytes to allocate
        for (let bytes = 1; bytes <= bytesLimit; bytes++) {
            const result = await getLastNLinesSync(filepath, n, bytes);
            ok += result === expected[n];
            
            // progress output
            if (ok % 5000 === 4999)
            console.log(`Tests: ${ok} successful of ${combinations}`)
        }
    }

    console.log(`\nTests: ${ok} successful of ${combinations}`)
}

/* Function that demonstates the functionality of this module */
async function main () {
    const filepath = './data-18.txt';
    const n = 5;
    const bytes = 64;

    await test();

    const result = getLastNLinesSync(filepath, n, bytes);
    console.log(`\n${n} last line(s) from ${filepath} (or full file if number of total lines is less than ${n}):`);
    console.log(result)
}

main();