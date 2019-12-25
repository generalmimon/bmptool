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
    ALPHA_BITFIELDS: 6,
    HUFFMAN_1D: 7,
    RLE24: 8,

    0: 'RGB',
    1: 'RLE8',
    2: 'RLE4',
    3: 'BITFIELDS',
    4: 'JPEG',
    5: 'PNG',
    6: 'ALPHA_BITFIELDS',
    7: 'HUFFMAN_1D',
    8: 'RLE24'
});
exports.Compression = Compression;
