const Compresssion = require('./enum').Compression;
const UnknownCompressionError = require('./exception').UnknownCompressionError;

class Bitmap {
    constructor(io, bmp) {
        this.io = io;
        this.bmp = bmp;
    }
    isUsingColorTable() {
        const bitsPerPx = this.bmp.dibInfo.header.bitsPerPixel;
        return (
            bitsPerPx === 1 || bitsPerPx === 4 || bitsPerPx === 8
        );
    }
    getCompression() {
        const Bmp = require('./Bmp');
        if (!this.bmp.dibInfo.header.extendsBitmapInfo) {
            return Compresssion.RGB;
        }
        const biExt = this.bmp.dibInfo.header.bitmapInfoExt;
        if (biExt.extendsOs22xBitmap) {
            const os2ComprType = Bmp.Os2Compressions[biExt.os2Compression];
            if (typeof os2ComprType !== 'string') {
                throw new UnknownCompressionError(`Unknown OS/2 bitmap compression: ${biExt.os2Compression}`);
            }
            return Compresssion[os2ComprType];
        }
        const comprType = Bmp.Compressions[biExt.compression];
        if (typeof comprType !== 'string') {
            throw new UnknownCompressionError(`Unknown bitmap compression: ${biExt.os2Compression}`);
        }
        return Compresssion[Bmp.Compressions[biExt.compression]];
    }

    getBitmap() {
        if (this.usesColorTable()) {

        }
    }
}
module.exports = Bitmap;