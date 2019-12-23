/**
 * @enum {Compression}
 */
const Compression = Object.freeze({
    RGB: 0,
    RLE8: 1,
    RLE4: 2,
    BITFIELDS: 3,
    JPEG: 4,
    PNG: 5,
    HUFFMAN_1D: 6,
    RLE24: 7,

    0: 'RGB',
    1: 'RLE8',
    2: 'RLE4',
    3: 'BITFIELDS',
    4: 'JPEG',
    5: 'PNG',
    6: 'HUFFMAN_1D',
    7: 'RLE24',
});
exports.Compression = Compression;