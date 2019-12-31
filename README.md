# BMP Tool
> Simple tool built on [Kaitai Struct](https://kaitai.io/) for reading BMP images

BMP Tool is a Node.js CLI tool written in JavaScript. It is intended to be able to parse various BMP files, created on any device, in any program. I try to support all color depths, header types and compression methods for which I can find documentation or sample files.

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

The directory samples/ is designated for test samples. There are 4 subdirectories inside: in/, out/, exp/ and diff/. Input BMP samples should be put to the in/ folder, output PNG files to the out/ folder. The folder exp/ is intended for PNG samples that represent the correct interpretation of the corresponding BMP input files in the in/ directory. The diff/ directory is an output directory for generated diffs between the samples from out/ and exp/, they show how much differ the real output files from BMP Tool from the expected ones.

I made a simple shell script that downloads samples from [BMP Suite](https://entropymine.com/jason/bmpsuite/bmpsuite/html/bmpsuite.html) and fills the in/ and exp/ folders. Invocation is simple (make sure the current working directory is the repository root):

```sh
./bin/get-bmpsuite
```

Then you need to run the BMP Tool with the sample input bitmaps and set the output directory to samples/out. The program takes just the basename while generating output files, so it's necessary to process each folder (g/, q/, b/) independently:

```sh
node index.js samples/in/bmpsuite-2.5/g/*.bmp -d samples/out/bmpsuite-2.5/g/
node index.js samples/in/bmpsuite-2.5/q/*.bmp -d samples/out/bmpsuite-2.5/q/
node index.js samples/in/bmpsuite-2.5/b/*.bmp -d samples/out/bmpsuite-2.5/b/
```

Diffs between the real output files (from out/) and "ideal" ones (from exp/) are generated as follows:

```sh
./bin/test
```

## Built with
  * [Kaitai Struct](https://kaitai.io/) - BMP format spec `resources/bmp.ksy` is compiled to JS parsing code
  * [pngjs](https://www.npmjs.com/package/pngjs) - for saving parsed bitmap to PNG image
  * [BMP Suite](https://entropymine.com/jason/bmpsuite/bmpsuite/html/bmpsuite.html) - sample files for testing
  * [pixelmatch](https://www.npmjs.com/package/pixelmatch) - for generating diffs between test samples and images that are expected to match the interpretation of the samples
