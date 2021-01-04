// tools/build.js
const postcss = require("postcss");
const path = require("path");
const fs = require("fs");
const cp = require("child_process");
const util = require("util");

/**Get out and src path*/
function getPaths(p) {
    const paths = p.paths || {};
    const rootDir = paths.rootDir || path.dirname(path.resolve("package.json"));
    const outDir = (paths.outDir) ? path.resolve(rootDir, paths.outDir) : path.resolve(rootDir, "dist");
    const srcDir = (paths.srcDir) ? path.resolve(rootDir, paths.srcDir) : path.resolve(rootDir, "src");
    return {rootDir, outDir, srcDir}
}

/**An utils function for recursive delete folder*/
function deleteFolderRecursiveSync (path) {
    let files = [];
    if( fs.existsSync(path) ) {
        files = fs.readdirSync(path);
        files.forEach(function(file){
            const curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursiveSync(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}

/**Clean before build*/
async function clean(p = {}) {

    const {outDir} = getPaths(p)

    if (fs.existsSync(outDir)){
        deleteFolderRecursiveSync(outDir);
    }

}

/**Create a postcss runner*/
async function processCssFunction(processCss) {
    const plugins = [
        require("postcss-import")(),
        require("postcss-calc")(),
        require("pleeease-filters")(),
        require("pixrem")(),
        require("postcss-flexbugs-fixes")(),
        require("postcss-preset-env")({
            stage: 3,
            autoprefixer: { flexbox: "no-2009" },
        }),
    ];
    const runner = postcss(plugins)
    return await processCss({postcss, plugins, runner});
}

/**Create the processCss function what find all css files in src folder,
 * and it create generated css files to dist folder.
 * You can set up root, src and dist folders
 */

async function processCss(p = {}) {

    const {rootDir, outDir, srcDir} = getPaths(p)

    await processCssFunction(async function processCss({runner}) {

        function recursiveReadDir(entriesPath, o = {}) {
            fs.readdirSync(entriesPath).forEach(function(file){
                const curPath = path.resolve(entriesPath, file);
                if(fs.lstatSync(curPath).isDirectory()) {
                    recursiveReadDir(curPath, o);
                } else if (file.match(".css")){
                    const srcRelative = path.relative(srcDir, curPath);
                    const rootRelative = path.relative(rootDir, curPath);
                    o[srcRelative] = "./"+rootRelative;
                }
            });
        }

        const entries = {};
        recursiveReadDir(srcDir, entries);

        await Promise.all(Object.keys(entries).map(async function (relativePath) {
            return new Promise(async function(resolve, reject) {
                try {
                    const from = path.resolve(srcDir, relativePath);
                    const to = path.resolve(outDir, relativePath);
                    const css = fs.readFileSync(from);
                    const result = await runner.process(css, {from: from, to: to})
                    if (!fs.existsSync(path.dirname(to))){
                        fs.mkdirSync(path.dirname(to), { recursive: true });
                    }
                    if (!fs.existsSync(to)) {
                        fs.writeFileSync(to, result.css)
                        console.log("Css processed: " + to)
                    } else {
                        console.log("File already exists, run clean script or delete it manually before process css: " + to)
                    }
                    return resolve();
                } catch (e) {
                    return reject(e)
                }
            })
        }))

    })
}

/**
 * Build: first processCss, then babel
 **/
async function build(p = {}) {

    const {rootDir, outDir, srcDir} = getPaths(p)

    await clean(p);
    await processCss(p);
    const execText = path.resolve(rootDir, "node_modules/.bin/babel") + " " + srcDir + " --presets=babel-preset-for-test --out-dir " + outDir;
    console.log("\nRun babel: " + execText);
    const {stdout, stderr} = await util.promisify(cp.exec)(execText);

    console.group("\n[BABEL]")
    if (stdout) {console.log(stdout);}
    if (stderr) {console.error(stderr)}
    console.groupEnd();
}

/**
 * Run task
 **/
function format(time) {
    return time.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
}

function run(fn, options) {
    const task = fn;
    const start = new Date();
    console.log(`[${format(start)}] Starting "${task.name}${options ? ` (${JSON.stringify(options)})` : ""}"...`,);
    return task(options).then(function(resolution) {
        const end = new Date();
        const time = end.getTime() - start.getTime();
        console.log(`[${format(end)}] Finished "${task.name}${options ? ` (${JSON.stringify(options)})` : ""}" after ${time} ms`,);
        return resolution;
    });
}

function parseOptions() {
    const options = {
        paths: {}
    };
    if (process.argv.indexOf("--out-dir") > -1 && process.argv[process.argv.indexOf("--out-dir") + 1]){
        options.paths.outDir = process.argv[process.argv.indexOf("--out-dir") + 1];
    }

    if (process.argv.indexOf("--src-dir") > -1 && process.argv[process.argv.indexOf("--src-dir") + 1]){
        options.paths.srcDir = process.argv[process.argv.indexOf("--src-dir") + 1];
    }
    return options;
}

const moduleExports = {clean, build, processCss};

if (require.main === module && process.argv.length > 2) {
    delete require.cache[__filename];
    const mod = moduleExports[process.argv[2]];
    run(mod, parseOptions()).catch(function(err){
        console.error(err.stack);
        process.exit(1);
    });
}

module.exports = moduleExports;

