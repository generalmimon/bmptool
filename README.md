# BMP Tool
> Simple tool built on [Kaitai Struct](https://kaitai.io/) for reading BMP images

BMP Tool is a Node.js CLI tool written in JavaScript. It is intended to be able to parse various BMP files, created on any device, in any program. I try to support all color depths, header types and compression methods for which I can find documentation or sample files.

When a BMP file is loaded, one can save it in another image format (e.g. PNG), with another compression method, bit depth or header type to make it more portable etc.

## Getting started

To get a local copy up and running follow these simple steps.

### Prerequisites

* Node.js (JavaScript runtime environment) + npm (package manager): https://nodejs.org/en/download/

### Installation

1. Clone the repo
   ```bash
   git clone https://github.com/generalmimon/bmptool.git
   ```

> **Note:** If you don't want to use `git`, you can download the project [in a ZIP archive](https://github.com/generalmimon/bmptool/archive/master.zip).

2. Install NPM packages
   ```bash
   npm install
   ```

3. Build the BMP parsing code from the spec [`resources/bmp.ksy`](resources/bmp.ksy) (see [Kaitai Struct](https://kaitai.io/) project for more info)
   ```bash
   npm run build
   ```

### Usage
Load BMP file `/path/to/image.bmp`:
```bash
node index.js /path/to/image.bmp
```

This will load the file into the memory, dump some info about the image to the screen and save resulting bitmap to PNG file (by default to `samples/out/` directory).

You can also specify more BMPs and even wildcards:
```bash
node index.js /path/to/image.bmp /path/to/images/*.bmp
```

## Motivation

Many programs and libraries that claim they can work with BMP files support only limited subset of the specification. This limits the usage of the format to the very core supported by most of the programs and disallows the use of any advanced features. For example, who knows that BMP can save alpha channel? Any feature invented by file format authors is useless if programmers don't want to implement it.

With Kaitai Struct, it's easy to define a human-readable format specification that is unambiguous and ready to be compiled into parser code, so the programmers have less troubles with the internal representation of the binary format and can focus on what to do with the data obtained from the file.

The BMP format specification in [Kaitai Struct](https://kaitai.io/) language is the core of this tool, it is used to be compiled into JavaScript parsing library to get structured data. The operating JavaScript code is just a small wrapper around the generated code from the `resources/bmp.ksy` specification, it's simple to compile it into another language and implement some similar wrapping code. See [Kaitai Struct](https://kaitai.io/) project for more info.

## Development

### Pulling the latest version of 'formats' submodule

To fetch the `master` branch of the [kaitai_struct_formats](https://github.com/kaitai-io/kaitai_struct_formats/) repo into the folder `formats/`, run:

```bash
git pull --recurse-submodule
git submodule update --remote formats
```

Whenever the `formats/image/bmp.ksy` spec is updated, it's necessary to recompile the parser code  in `src/Bmp.js`:

```bash
npm run build
```

### Testing

The directory samples/ is designated for test samples. There are 4 subdirectories inside:

  * [in/](./samples/in) - input BMP samples
  * [out/](./samples/out) - output PNG files (generated by BMP Tool based on input BMP files from in/)
  * [exp/](./samples/exp) - PNG samples that represent the correct (*exp*ected) interpretation of the corresponding BMP input files in the in/ directory
  * [diff/](./samples/diff) - output directory for generated diffs between the samples from out/ and exp/ (they show how much differ the real output files from BMP Tool from the expected ones)

### Getting the BMP Suite samples for testing

BMP Tool uses the excellent [BMP Suite](https://entropymine.com/jason/bmpsuite/bmpsuite/html/bmpsuite.html) for testing.

There are two ways how you can get the samples from BMP Suite.

  1. [Building samples from source](#1-building-samples-from-source) (using `make` and `gcc`, recommended)
  2. [Downloading samples in a ZIP archive](#2-downloading-samples-in-a-zip-archive)

If the `bmpsuite/` folder in the project root already contains the BMP samples (i.e. the subdirs `b/`, `g/` and `q/` are full of `.bmp` files), skip to section [Testing on samples from BMP Suite](#testing-on-samples-from-bmp-suite).

#### 1. Building samples from source

> **Prerequisites:**
>   * GNU Make (`make`)
>   * `cc`-compatible C compiler (`gcc` is recommended)
>
> First check if you don't have them already installed (run `make --version` + `gcc --version` and see if it works fine).
>
> If you don't have both tools installed, you can install them by following these steps:
>   * for Linux - [this command](https://askubuntu.com/a/272020) installs both GNU `make` and `gcc` compiler
>   * for Windows:
>     1. Install [MinGW Installation Manager](https://osdn.net/projects/mingw/#:~:text=mingw-get-setup.exe) (the installer is called `mingw-get-setup.exe`) and launch it.
>     2. In *Basic Setup*, mark `mingw32-base-bin` *(includes `gcc`)* and `msys-base-bin` *(includes `make`)* for installation (right-click > *Mark for Installation*) and select *Installation > Apply Changes* in the top menu bar.
>     3. Press `⊞ Win` + `R` simultaneously to open the *Run* dialog.
>     4. Type `SystemPropertiesAdvanced.exe` and click *OK*.
>     5. Click *Environment Variables...* at the bottom of the dialog.
>     6. In *User variables*, search for a variable called `Path` *(the letter case isn't important, it can be called e.g. `PATH` or `pATh` as well)*, select it and click the *Edit...* button.
>
>        > **Note:** If there is no `Path` variable, follow these steps instead.
>        >   1. Click the *New...* button.
>        >   2. Fill in *Variable name:* `Path`, *Variable value:* `C:\MinGW\bin;C:\MinGW\msys\1.0\bin`
>        >   3. Click *OK*.
>        >   4. Skip to step x. (10.)
>
>     7. Click *New* and type `C:\MinGW\bin`
>     8. Click *New* again and type `C:\MinGW\msys\1.0\bin`
>     9. Click *OK*.
>     10. Click *OK* again to confirm the *Environment Variables* dialog.
>     11. The commands `make` and `gcc` should now be available in every new command line session. Run `make --version` and `gcc --version` there to verify the installation.

The samples from BMP Suite can be compiled using the following commands (make sure the current working directory is the project root):

```bash
git clone --branch 2.7 --depth 1 https://github.com/jsummers/bmpsuite.git
cd bmpsuite/ || exit 1
export CC=gcc # (1.)
make clean && make check
cd ../ || exit 1
```

>   1. You can choose any `cc`-compatible C compiler installed on your system, e.g. `cc`, `gcc`, `clang`, etc.

#### 2. Downloading samples in a ZIP archive

Go to [https://entropymine.com/jason/bmpsuite/releases/](https://entropymine.com/jason/bmpsuite/releases/#:~:text=bmpsuite-2.7.zip) and download the `bmpsuite-2.7.zip` file. Then copy all files and directories from the archive directly to `bmpsuite/` folder in the project root directory.

### Testing on samples from BMP Suite

When you have the `bmpsuite/` folder initialized and filled with .bmp samples (see [Getting the BMP Suite samples for testing](#getting-the-bmp-suite-samples-for-testing)), it's necessary to prepare them for BMP Tool usage (i.e. moving them to samples/in/bmpsuite and samples/exp/bmpsuite folders):

```bash
./bin/prepare-bmpsuite
```

Then run BMP Tool with the sample input bitmaps and set the output directory to samples/out. The program takes just the file basename while generating output files, so it's necessary to process each folder (g/, q/ and b/) independently:

```bash
node index.js samples/in/bmpsuite/g/*.bmp -d samples/out/bmpsuite/g/
node index.js samples/in/bmpsuite/q/*.bmp -d samples/out/bmpsuite/q/
node index.js samples/in/bmpsuite/b/*.bmp -d samples/out/bmpsuite/b/
```

If you want to log the parse exceptions along with the .bmp filenames, add `-l log/failed.log` to the end.

Diffs between the real output files (from out/) and "ideal" ones (from exp/) are generated as follows:

```bash
./bin/test
```

## Built with
  * [Kaitai Struct](https://kaitai.io/) - BMP format spec `resources/bmp.ksy` is compiled to JS parsing code
  * [pngjs](https://www.npmjs.com/package/pngjs) - for saving parsed bitmap to PNG image
  * [BMP Suite](https://entropymine.com/jason/bmpsuite/bmpsuite/html/bmpsuite.html) - sample files for testing
  * [pixelmatch](https://www.npmjs.com/package/pixelmatch) - for generating diffs between test samples and images that are expected to match the interpretation of the samples
