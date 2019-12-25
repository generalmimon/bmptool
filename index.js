'use strict';
const yargs = require('yargs');
const argv = yargs.argv;

const fs = require('fs');
const KaitaiStream = require('kaitai-struct/KaitaiStream');
const Bmp = require('./dist/Bmp');
const Compression = require('./dist/enum').Compression;
const utils = require('./dist/utils');
const UnknownCompressionError = require('./dist/exception').UnknownCompressionError;

if (argv._.length > 0) {
    argv._.forEach(fileName => {
    fs.readFile(fileName, (err, data) => {
        if (err) {
            throw err;
        }
            console.log(`${fileName}`);

        const bmp = new Bmp(new KaitaiStream(data));
        const fileHeader = utils.getOwnPropsFromStruct(bmp.fileHdr);
        console.dir(fileHeader, {depth: null});
        const dibHeader = utils.getOwnPropsFromStruct(bmp.dibInfo.header, true);
        console.dir(dibHeader, {depth: null});

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
        if (bmp.dibInfo.header.usesFixedPalette) {
            const byteToHex = b => b.toString(16).padStart(2, '0');
            console.log(bmp.dibInfo.colorTable.colors.map(c => '#' + [c.red, c.green, c.blue].map(byteToHex).join('')));
        }
    });
}
