const KaitaiStructCompiler = require('kaitai-struct-compiler');
const compiler = new KaitaiStructCompiler();

const yargs = require('yargs');
const argv = yargs
    .usage('Usage: $0 [options] <file>...')
    .demandCommand(1)
    .option('d', {description: 'output directory (filenames will be auto-generated)'})
    .alias('d', 'outdir')
    .default('d', '')
    .version(`kaitai-struct-compiler ${compiler.version}, build date: ${new Date(compiler.buildDate).toUTCString()}`)
    .argv;

const fs = require('fs');
const YAML = require('yaml');

if (argv._.length > 0) {
    argv._.forEach(fileName => {
        console.log(`parsing ${fileName}...`);
        fs.readFile(fileName, { encoding: 'UTF-8' }, (err, contents) => {
            if (err) {
                throw err;
            }
            const ksy = YAML.parse(contents);
            compiler.compile('javascript', ksy, null, false).then(function(files) {
                for (let fileName in files) {
                    const output = files[fileName];
                    fileName = argv.d + '/' + fileName;
                    fs.writeFile(fileName, output, (err) => {
                        if (err) {
                            throw err;
                        }
                        console.log(`... writing ${fileName}`);
                    });
                }
            }).catch(err => {
                console.error(err);
            });
        });
    });
}
