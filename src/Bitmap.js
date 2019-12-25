const Compresssion = require('./enum').Compression;
const UnknownCompressionError = require('./exception').UnknownCompressionError;
const InvalidBitCountError = require('./exception').InvalidBitCountError;

class Bitmap {
    constructor(io, bmp) {
        this.io = io;
        this.bmp = bmp;

        this._read();
    }
    getCompression() {
        const Bmp = require('./Bmp');
        if (!this.bmp.dibInfo.header.extendsBitmapInfo) {
            return Compresssion.RGB;
        }
        const biExt = this.bmp.dibInfo.header.bitmapInfoExt;
        if (this.bmp.dibInfo.header.extendsOs22xBitmap) {
            const os2ComprType = Bmp.Os2Compressions[biExt.os2Compression];
            if (typeof os2ComprType !== 'string') {
                throw new UnknownCompressionError(`Unknown OS/2 bitmap compression: ${biExt.os2Compression}`);
            }
            return Compresssion[os2ComprType];
        }

        const comprType = Bmp.Compressions[biExt.compression];
        if (typeof comprType !== 'string') {
            throw new UnknownCompressionError(`Unknown bitmap compression: ${biExt.compression}`);
        }
        return Compresssion[comprType];
    }

    getBitmapPixelCount() {
        return this.bmp.dibInfo.header.imageWidth * this.bmp.dibInfo.header.imageHeight;
    }

    getRgbRealSize() {
        const hdr = this.bmp.dibInfo.header;
        return this.alignToLongBoundary(Math.ceil(hdr.imageWidth * hdr.bitsPerPixel / 8)) * hdr.imageHeight;
    }

    _read() {
        this.data = new Uint8ClampedArray(this.getBitmapPixelCount() * 4);
        const hdr = this.bmp.dibInfo.header;
        const comprType = this.getCompression();
        switch (comprType) {
            case Compresssion.RGB:
                const bitsPerPx = hdr.bitsPerPixel;
                const chars = '.\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
                if (hdr.usesFixedPalette) {
                    console.log('bits/pixel:', bitsPerPx);
                    console.log('current pos:', this.io.pos);
                    console.log('available size:', this.io.size);
                    console.log('calculated size:', this.getRgbRealSize());

                    const colors = this.bmp.dibInfo.colorTable.colors;
                    const width = hdr.imageWidth;
                    const lines = [];
                    for (let yRaw = hdr.imageHeight - 1, y; yRaw >= 0; yRaw--) {
                        y = hdr.bottomUp ? yRaw : hdr.imageHeight - 1 - yRaw;
                        let line = '';
                        for (let x = 0; x < width; x++) {
                            const i = (width * y + x) * 4;
                            const idx = this.io.readBitsInt(bitsPerPx);
                            line += idx < chars.length ? chars[colors.length > 1 ? Math.floor((idx / (colors.length - 1)) * (chars.length - 1)) : 0] : ' ';
                            const color = colors[idx];
                            [this.data[i], this.data[i + 1], this.data[i + 2]] = [color.red, color.blue, color.green];
                        }
                        lines[y] = line;
                        this.io.alignToByte();
                        this.io.seek(this.alignToLongBoundary(this.io.pos));
                    }
                    lines.forEach(row => console.log(row));
                    console.log('end pos:', this.io.pos);
                } else {
                    console.warn('not supported');
                }
                break;
        }
    }

    // align to a multiple of four bytes
    alignToLongBoundary(pos) {
        return Math.ceil(pos / 4) * 4;
    }
}
module.exports = Bitmap;
