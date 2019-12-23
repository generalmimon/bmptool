'use strict';
const yargs = require('yargs');
const argv = yargs.argv;

const fs = require('fs');
const KaitaiStream = require('kaitai-struct/KaitaiStream');
const Bmp = require('./dist/Bmp');
const Compression = require('./dist/enum').Compression;
const utils = require('./dist/utils');
const UnknownCompressionError = require('./dist/exception').UnknownCompressionError;

if (Array.isArray(argv._) && argv._[0] !== '') {
    const fileName = argv._[0];
    fs.readFile(fileName, (err, data) => {
        if (err) {
            throw err;
        }
        const bmp = new Bmp(new KaitaiStream(data));
        const coreHeader = utils.getOwnPropsFromStruct(bmp.dibInfo.header, true);
        console.dir(coreHeader, {depth: null});

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
    });
}
