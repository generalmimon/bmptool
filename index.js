'use strict';
const yargs = require('yargs');
const argv = yargs.argv;

const fs = require('fs');
const path = require('path');
const KaitaiStream = require('kaitai-struct/KaitaiStream');
const Bmp = require('./src/Bmp');
const Compression = require('./src/enum').Compression;
const utils = require('./src/utils');
const UnknownCompressionError = require('./src/exception').UnknownCompressionError;

const PNG = require('pngjs').PNG;

if (argv._.length > 0) {
    argv._.forEach(fileName => {
        fs.readFile(fileName, (err, data) => {
            if (err) {
                throw err;
            }
            console.log(`${fileName}`);

            const bmp = new Bmp(new KaitaiStream(data));

            const dibHdr = utils.getOwnPropsFromStruct(bmp.dibInfo.header, true);
            console.dir(dibHdr, {depth: null});

            let comprType;
            try {
                comprType = bmp.bitmap.getCompression();
            } catch (e) {
                if (e instanceof UnknownCompressionError) {
                    console.warn(e.message);
                } else {
                    throw e;
                }
            }

            console.log('compression:', typeof comprType === 'number' ? Compression[comprType] : 'UNKNOWN');
            if (comprType !== Compression.JPEG && comprType !== Compression.PNG && bmp.dibInfo.header.usesFixedPalette) {
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
            const outputFileName = path.resolve('tmp/', path.basename(fileName, '.bmp') + '.png');
            png.pack().pipe(fs.createWriteStream(outputFileName));
            console.log(`output PNG: ${outputFileName}`);
        });
    });
}
