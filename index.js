'use strict';
const yargs = require('yargs');
const argv = yargs
    .usage('Usage: node $0 [options] <file>...')
    .demandCommand(1, 'You must specify at least one .bmp file')
    .option('d', {description: 'output directory for generated PNG images'})
    .alias('d', 'outdir')
    .default('d', 'samples/out/')
    .option('l', {description: 'a text file where to log failed images'})
    .alias('l', 'failedlog')
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

            const dibHdr = utils.getOwnPropsFromStruct(bmp.dibInfo.header, true);
            console.dir(dibHdr, {depth: null});

            let comprType;
            try {
                comprType = bmp.bitmap.getCompression();
            } catch (e) {
                handleError(fileName, e);
                return;
                }

            console.log('compression:', typeof comprType === 'number' ? Compression[comprType] : 'UNKNOWN');
            if (comprType !== Compression.JPEG && comprType !== Compression.PNG && bmp.dibInfo.header.usesFixedPalette) {
                console.log(`Number of colors in palette: ${bmp.dibInfo.colorTable.colors.length}`);
                const byteToHex = b => b.toString(16).padStart(2, '0');
                console.log(bmp.dibInfo.colorTable.colors.map(c => '#' + [c.red, c.green, c.blue].map(byteToHex).join('')));
            }

            const chars = '.\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
            const width = bmp.dibInfo.header.imageWidth;

            for (let y = 0; y < bmp.dibInfo.header.imageHeight; y++) {
                let line = '';
                for (let x = 0; x < width; x++) {
                    const i = (width * y + x) * 4;
                    const [r, g, b] = [bmp.bitmap.data[i], bmp.bitmap.data[i + 1], bmp.bitmap.data[i + 2]];
                    const brightness = utils.getPercievedBrightnessFromRgb(r, g, b) / 255;
                    line += chars[Math.round(brightness * (chars.length - 1))];
                }
                console.log(line);
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
