const Compresssion = require('./enum').Compression;
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
            const unusedBitMask = ((~ mask) & (((1 << msb) - 1) << 1 | 1)) >>> 0; // cannot use (1 << (msb + 1)) - 1 because valid msb = 31 would cause overflow in JS
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
        console.log(this._m_colorMasks);
    }

    resolveColorFromPalette(idx) {
        const color = this.bmp.dibInfo.colorTable.colors[idx];
        return [color.red, color.blue, color.green, 255];
    }

    /** @see {@link this.resolveColorMasksBitShift} has to be called before */
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
            case Compresssion.RGB:
            case Compresssion.BITFIELDS:
            case Compresssion.ALPHA_BITFIELDS:
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
                console.log('end pos:', this._io.pos);
                break;
        }
    }

}
module.exports = Bitmap;
