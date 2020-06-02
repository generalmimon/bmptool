_check() {
        const Bmp = require('./Bmp');
        if (this.bmp.fileHdr.lenFile !== this.bmp._io.size) {
            console.info(`Invalid value ${this.bmp.fileHdr.lenFile} of lenFile in file header, expected ${this.bmp._io.size} (total file size)`);
        }
        if (this.bmp.fileHdr.reserved1 !== 0) {
            console.info(`Found value ${this.bmp.fileHdr.reserved1} of reserved1 in file header, expected 0`);
        }
        if (this.bmp.fileHdr.reserved2 !== 0) {
            console.info(`Found value ${this.bmp.fileHdr.reserved2} of reserved2 in file header, expected 0`);
        }

        let dibHeaderName = 'bitmap header';
        if (!Bmp.HeaderType.hasOwnProperty(this.bmp.dibInfo.headerSize)) {
            console.warn(`Invalid size ${this.bmp.dibInfo.headerSize} for ${dibHeaderName}`);
        } else {
            dibHeaderName = Bmp.HeaderType[this.bmp.dibInfo.headerSize];
        }
        const hdr = this.bmp.dibInfo.header;
        const widthPosSignedLimit = (1 << (hdr.isCoreHeader ? 15 : 31)) - 1;
        if (hdr.isCoreHeader && hdr.imageWidth > widthPosSignedLimit) {
            console.warn(`Found value ${hdr.imageWidth} as imageWidth in ${dibHeaderName}, this would be negative in programs that treat it as signed int`);
        }

        if (hdr.numPlanes !== 1) {
            console.warn(`Invalid value ${hdr.numPlanes} as numPlanes in ${dibHeaderName}, expected 1`);
        }

        const allowedBpPx = [1, 4, 8, 24];
        if (hdr.extendsBitmapInfo && !hdr.extendsOs22xBitmap) {
            allowedBpPx.push(16, 32);
            allowedBpPx.sort((a, b) => a - b);
        }
        if (!allowedBpPx.includes(hdr.bitsPerPixel)) {
            console.warn(`Found value ${hdr.bitsPerPixel} of bitsPerPixel in ${dibHeaderName}, expected one of (${allowed.join(', ')})`);
        }

        if (hdr.extendsBitmapInfo) {
            const ext = hdr.bitmapInfoExt;
            const comprType = this.getCompression();
            if (comprType === Compresssion.RGB) {
                if (ext.lenImage !== 0 && ext.lenImage !== this.io.size) {
                    console.warn(`Found value ${ext.lenImage} of lenImage in ${dibHeaderName} for RGB compression, expected either 0 or ${this.io.size} (image data size)`);
                }
            } else if (comprType === Compresssion.JPEG || comprType === Compresssion.PNG) {
                console.warn(`Found compression ${Compresssion[comprType]} (${ext.compression}) in ${dibHeaderName} (embedded JPEG and PNG images are not supported in many programs)`);
                if (ext.lenImage !== this.io.size) {
                    console.warn(`Found value ${ext.lenImage} of lenImage in ${dibHeaderName} for ${Compresssion[comprType]} compression, expected ${this.io.size} (image data size)`);
                }
            }

            if (ext.xResolution !== ext.yResolution) {
                console.warn(`Found values ${ext.xResolution}, ${ext.yResolution} px/m of x/yResolution in ${dibHeaderName}, this indicates non-square pixels which is not usual`);
            }

            if (ext.numColorsUsed === 0 && this.bmp.dibInfo.colorTable.colors.length !== (1 << this.bmp.dibInfo.header.bitsPerPixel)) {
                console.warn(`Found value ${ext.numColorsUsed} of numColorsUsed in ${dibHeaderName}, expected ${this.bmp.dibInfo.colorTable.colors.length} (actual size of the color table)`);
            }
        }
    }