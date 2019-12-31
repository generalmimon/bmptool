const getOwnPropsFromStruct = (struct, deep = false) => {
    const obj = {};
    const structProto = Object.getPrototypeOf(struct);
    const keys = Object.getOwnPropertyNames(struct)
        .concat(
            Object.getOwnPropertyNames(structProto)
                .filter(val => {
                    const desc = Object.getOwnPropertyDescriptor(structProto, val);
                    return desc.enumerable || !desc.writable; // seq field or instance (read-only)
                })
        );

    for (let key of keys) {
        if (key.charAt(0) === '_') {
            if(key.substring(0, 3) === '_m_') {
                key = key.substring(3);
            } else {
                continue;
            }
        }
        if (typeof struct[key] === 'object') {
            if (deep) {
                obj[key] = getOwnPropsFromStruct(struct[key], deep);
            }
        } else {
            obj[key] = struct[key];
        }
    }
    return obj;
};

const getPercievedBrightnessFromRgb = (r, g, b) => {
    return 0.299 * r + 0.587 * g + 0.114 * b;
};

const getPixelColorFromBitmap = (x, y, bitmap) => {
    const i = (bitmap.bmp.dibInfo.header.imageWidth * y + x) * 4;
    return [bitmap.data[i], bitmap.data[i + 1], bitmap.data[i + 2], bitmap.data[i + 3]];
};

const dumpBitmap = (bmp) => {
    const chars = ' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';

    const height = bmp.dibInfo.header.imageHeight;
    const width = bmp.dibInfo.header.imageWidth;

    for (let y = 0; y < height; y++) {
        let line = '';
        for (let x = 0; x < width; x++) {
            const [r, g, b, a] = getPixelColorFromBitmap(x, y, bmp.bitmap);
            const brightness = (getPercievedBrightnessFromRgb(r, g, b) * (a / 255)) / 255;
            line += chars[Math.round(brightness * (chars.length - 1))];
        }
        console.log(line);
    }
};

exports.getOwnPropsFromStruct = getOwnPropsFromStruct;
exports.getPercievedBrightnessFromRgb = getPercievedBrightnessFromRgb;
exports.getPixelColorFromBitmap = getPixelColorFromBitmap;
exports.dumpBitmap = dumpBitmap;
