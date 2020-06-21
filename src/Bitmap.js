const Compression = require('./enum').Compression;
const UnknownCompressionError = require('./exception').UnknownCompressionError;
const InvalidBitMaskError = require('./exception').InvalidBitMaskError;

const utils = require('./utils');

class Bitmap {
    constructor(_io, bmp) {
        this._io = _io;
        this.bmp = bmp;

        this._read();
    }

    getCompression() {
        const Bmp = require('./Bmp');
        if (!this.bmp.dibInfo.header.extendsBitmapInfo) {
            return Compression.RGB;
        }
        const biExt = this.bmp.dibInfo.header.bitmapInfoExt;
        if (this.bmp.dibInfo.header.extendsOs22xBitmap) {
            const os2ComprType = Bmp.Os2Compressions[biExt.os2Compression];
            if (typeof os2ComprType !== 'string') {
                throw new UnknownCompressionError(`Unknown OS/2 bitmap compression: ${biExt.os2Compression}`);
            }
            return Compression[os2ComprType];
        }

        const comprType = Bmp.Compressions[biExt.compression];
        if (typeof comprType !== 'string') {
            throw new UnknownCompressionError(`Unknown bitmap compression: ${biExt.compression}`);
        }
        return Compression[comprType];
    }

    getBitmapPixelCount() {
        return this.bmp.dibInfo.header.imageWidth * this.bmp.dibInfo.header.imageHeight;
    }

    getLenRgbBitmap() {
        const hdr = this.bmp.dibInfo.header;
        return Math.ceil(hdr.imageWidth * hdr.bitsPerPixel / 32) * 4 * hdr.imageHeight;
    }

    resolveColorMasks() {
        this._m_colorMasks = [
            this.bmp.dibInfo.colorMaskRed,
            this.bmp.dibInfo.colorMaskGreen,
            this.bmp.dibInfo.colorMaskBlue,
            this.bmp.dibInfo.colorMaskAlpha
        ].map(mask => {
            if (!mask) {
                return {
                    mask: 0,
                    bitShift: 0,
                    multiplier: 0
                }
            }
            const msb = Math.floor(Math.log2(mask));
            const unusedBitMask = (~ mask) & (msb === 31 ? 0xffffffff : (1 << (msb + 1)) - 1);
            const bitShift = Math.log2(unusedBitMask + 1);

            if (!Number.isInteger(bitShift)) {
                throw new InvalidBitMaskError(`Color bitmask ${mask.toString(2).padStart(this.bmp.dibInfo.header.bitsPerPixel, '0')} is not contiguous.`);
            }
            return {
                mask,
                bitShift,
                multiplier: 255 / (mask >>> bitShift)
            };
        });
    }

    resolveColorFromPalette(idx) {
        const color = this.bmp.dibInfo.colorTable.colors[idx];
        if (!color) {
            return [0, 0, 0, 255];
        }
        return [color.red, color.green, color.blue, 255];
    }

    /** @see {@link resolveColorMasks} has to be called before */
    resolveColorFromPixel(val) {
        const c = this._m_colorMasks.map(({mask, bitShift, multiplier}, idx) => {
            if (idx === 3 && !mask) {
                return 255;
            }
            return Math.round(((val & mask) >>> bitShift) * multiplier);
        });
        return c;
    }

    _read() {
        this.data = new Uint8ClampedArray(this.getBitmapPixelCount() * 4);
        const hdr = this.bmp.dibInfo.header;
        const comprType = this.getCompression();

        switch (comprType) {
            case Compression.RGB:
            case Compression.BITFIELDS:
            case Compression.ALPHA_BITFIELDS:
                const bitsPerPx = hdr.bitsPerPixel;
                console.log('bits/pixel:', bitsPerPx);
                console.log('current pos:', this._io.pos);
                console.log('available size:', this._io.size - this._io.pos);
                console.log('calculated size:', this.getLenRgbBitmap());

                if (!hdr.usesFixedPalette) {
                    console.log('colorMaskRed:  ', this.bmp.dibInfo.colorMaskRed.toString(2).padStart(hdr.bitsPerPixel, '0'));
                    console.log('colorMaskGreen:', this.bmp.dibInfo.colorMaskGreen.toString(2).padStart(hdr.bitsPerPixel, '0'));
                    console.log('colorMaskBlue: ', this.bmp.dibInfo.colorMaskBlue.toString(2).padStart(hdr.bitsPerPixel, '0'));
                    if (this.bmp.dibInfo.colorMaskAlpha !== 0) {
                        console.log('colorMaskAlpha:', this.bmp.dibInfo.colorMaskAlpha.toString(2).padStart(hdr.bitsPerPixel, '0'));
                    }

                    this.resolveColorMasks();
                }

                const width = hdr.imageWidth;
                for (let yRaw = hdr.imageHeight - 1, y; yRaw >= 0; yRaw--) {
                    y = hdr.bottomUp ? yRaw : hdr.imageHeight - 1 - yRaw;
                    for (let x = 0; x < width; x++) {
                        const i = (width * y + x) * 4;
                        const px =
                            bitsPerPx === 16
                                ? this._io.readU2le()
                                : bitsPerPx === 24
                                    ? [this._io.readU1(), this._io.readU1(), this._io.readU1()].reduce((acc, val, idx) => acc |= val << (idx * 8))
                                    : bitsPerPx === 32
                                        ? this._io.readU4le()
                                        : this._io.readBitsInt(bitsPerPx);
                        [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]] =
                            hdr.usesFixedPalette
                                ? this.resolveColorFromPalette(px)
                                : this.resolveColorFromPixel(px);
                    }
                    this._io.alignToByte();
                    this._io.seek(Math.ceil(this._io.pos / 4) * 4);
                }
                break;
            // case Compression.RLE4:
            case Compression.RLE8:
                const END_OF_LINE = 0;
                const END_OF_BITMAP = 1;
                const DELTA = 2;

                let x = 0;
                let y = hdr.imageHeight - 1;
                while (x < hdr.imageWidth + 1 && y >= 0) {
                    const count = this._io.readU1();
                    const code = this._io.readU1();
                    if (!count) {
                        switch (code) {
                            case END_OF_LINE: {
                                x = 0;
                                y--;
                                break;
                            }
                            case END_OF_BITMAP: {
                                return;
                            }
                            case DELTA: {
                                x += this._io.readU1();
                                y -= this._io.readU1();
                                break;
                            }
                            default: { // Absolute mode
                                for (let j = 0; j < code; j++) {
                                    const i = (hdr.imageWidth * y + x) * 4;
                                    const px = this._io.readBitsInt(8);
                                    [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]] = this.resolveColorFromPalette(px);
                                    x++; // FIXME: handle line overflow
                                }
                                this._io.seek(Math.ceil(this._io.pos / 2) * 2);
                                break;
                            }
                        }
                    } else { // Encoded mode
                        const color = this.resolveColorFromPalette(code);
                        for (let j = 0; j < count; j++) {
                            const i = (hdr.imageWidth * y + x) * 4;
                            [this.data[i], this.data[i + 1], this.data[i + 2], this.data[i + 3]] = color;
                            x++; // FIXME: handle line overflow
                        }
                    }
                }
                break;
        }
    }

}
module.exports = Bitmap;
