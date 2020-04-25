'use strict';
const yargs = require('yargs');
const argv = yargs
    .usage('Usage: node $0 [options] <file>...')
    .demandCommand(1, 'You must specify at least one .bmp file')
    .option('d', {description: 'output directory for generated PNG images'})
    .alias('d', 'outdir')
    .default('d', 'samples/out/')
    .option('l', {description: 'a text file where to log failed images'})
    .alias('l', 'log-failed')
    .option('v', {description: 'dump some additional debugging info about the BMP structure', type: "boolean"})
    .alias('v', 'verbose')
    .default('v', false)
    .argv;

const fs = require('fs');
const path = require('path');
const KaitaiStream = require('kaitai-struct/KaitaiStream');
const Compression = require('./src/enum').Compression;
const utils = require('./src/utils');

const PNG = require('pngjs').PNG;

if (argv._.length > 0) {
    const failedImages = [];
    const handleError = (fileName, e) => {
        console.log('ERROR: ', e.message);
        console.log(e.stack);
        failedImages.push(
            `${fileName}: ${e.message}`
        );
    };

    argv._.forEach((fileName, idx) => {
        fs.readFile(fileName, (err, data) => {
            if (err) {
                handleError(fileName, err);
                return;
            }
            console.log(`${fileName}`);

            const Bmp = require('./src/Bmp');

            let bmp;
            try {
                bmp = new Bmp(new KaitaiStream(data));
            } catch (e) {
                handleError(fileName, e);
                return;
            }

            if (argv.verbose) {
                const dibHdr = utils.getOwnPropsFromStruct(bmp.dibInfo.header, true);
                console.dir(dibHdr, {depth: null});
            }

            let comprType;
            try {
                comprType = bmp.bitmap.getCompression();
            } catch (e) {
                handleError(fileName, e);
                return;
            }

            if (argv.verbose) {
                console.log('compression:', typeof comprType === 'number' ? Compression[comprType] : 'UNKNOWN');
                if (comprType !== Compression.JPEG && comprType !== Compression.PNG && bmp.dibInfo.header.usesFixedPalette) {
                    console.log(`Number of colors in palette: ${bmp.dibInfo.colorTable.colors.length}`);
                    const byteToHex = b => b.toString(16).padStart(2, '0');
                    console.log(bmp.dibInfo.colorTable.colors.map(c => '#' + [c.red, c.green, c.blue].map(byteToHex).join('')));
                }
            }

            if (argv.verbose) {
                utils.dumpBitmap(bmp);
            }

            const png = new PNG({width: bmp.dibInfo.header.imageWidth, height: bmp.dibInfo.header.imageHeight});
            png.data = Buffer.from(bmp.bitmap.data);
            const outputFileName = path.resolve(argv.d, path.basename(fileName, '.bmp') + '.png');
            png.pack().pipe(fs.createWriteStream(outputFileName));
            console.log(`output PNG: ${outputFileName}`);
        });
    });
    let alreadyExecuted = false;
    process.on('beforeExit', () => {
        if (alreadyExecuted) return;
        alreadyExecuted = true;
        console.log('-'.repeat(60));
        console.log('Failed images: ');
        console.log(failedImages.join("\n"));
        if (failedImages.length > 0 && argv.l) {
            fs.writeFile(argv.l, failedImages.join("\n") + "\n", {flag: 'a'}, () => {
                console.log(`successfully written to file ${argv.l}`);
            });
        }
    });
}
