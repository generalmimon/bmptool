# BMPtool
> Simple tool built on [Kaitai Struct](https://kaitai.io/) for reading BMP images

BMPtool is a Node.js CLI tool written in JavaScript. It is intended to be able to parse various BMP files, created on any device, in any program. I try to support all color depths, header types and compression methods for which I can find documentation or sample files.

When a BMP file is loaded, one can save it in another image format (e.g. PNG), with another compression method, bit depth or header type to make it more portable etc.

## Getting started

To get a local copy up and running follow these simple steps.

### Prerequisites

* Node.js (JavaScript runtime environment) + npm (package manager) - https://nodejs.org/en/download/

### Installation

1. Clone the repo
```sh
git clone https://github.com/generalmimon/bmptool.git
```

2. Install NPM packages + compile bmp.ksy spec to parsing code (see [Kaitai Struct](https://kaitai.io/) project for more info)
```sh
npm install
```

### Usage
Load BMP file `/path/to/image.bmp`:
```sh
node index.js /path/to/image.bmp
```

This will load the file into the memory, dump some info about the image to the screen and save resulting bitmap to PNG file (to `tmp/` directory).

You can also specify more BMPs and even wildcards:
```sh
node index.js /path/to/image.bmp /path/to/images/*.bmp
```

## Motivation

Most programs and libraries that claim they can work with BMP files support only limited subset of the specification. This limits the usage of the format to the very core supported by most of the programs and disallows the use of any advanced features. For example, who knows that BMP can save alpha channel? Any feature invented by file format authors is useless if programmers don't want to implement it.

With Kaitai Struct, it's easy to define a human-readable format specification that is unambiguous and ready to be compiled into parser code, so the programmers have less troubles with the internal representation of the binary format and can focus on what to do with the data obtained from the file.

## Development

If you do some changes to `resources/bmp.ksy` spec, compile it by doing:
```sh
npm run build
```

### Testing

Currently manual, take some sample .bmp from [BMP Suite](https://entropymine.com/jason/bmpsuite/bmpsuite/html/bmpsuite.html) and see if the resulting .png file in the `tmp/` folder matches image in the `Correct display` column.

## Built with
  * [Kaitai Struct](https://kaitai.io/) - BMP format spec `resources/bmp.ksy` is compiled to JS parsing code
  * [pngjs](https://www.npmjs.com/package/pngjs) - for saving parsed bitmap to PNG image
