const path = require("path");
const fs = require("fs");

let buildHash = null;
function generateHash(isDev) {
    if ((buildHash === "buildHash" && isDev) || (buildHash && buildHash !== "buildHash" && !isDev)) {
        return buildHash;
    }
    if (isDev) {
        buildHash = "buildHash";
    } else {
        buildHash = Math.random().toString(36).substring(7);
    }
    return buildHash;
}

let time = null;
function generateTime() {
    if (time) {
        return time;
    }
    time = new Date();
    return time;
}

function addCallerToRunScript(p = {}, scriptName) {
    let runScript = p.runScript;
    if (typeof runScript == "string" && runScript && runScript !== scriptName){
        runScript = [runScript, scriptName];
    } else if (typeof runScript == "object" && runScript.indexOf(scriptName) === -1){
        runScript = [...runScript, scriptName]
    } else if (!runScript){
        runScript = scriptName
    }
    return {...p, runScript}
}


function reverseArgvFromOptions(options) {
    let argv= [];
    if (options.paths){
        if (options.paths.srcPath){
            argv.push("--src-path", options.paths.srcPath)
        }
        if (options.paths.distPath){
            argv.push("--dist-path", options.paths.distPath)
        }
        if (options.paths.buildPath){
            argv.push("--build-path", options.paths.buildPath)
        }
    }
    return argv;
}

function parseOptionsFromArgs() {
    const options = {};
    let startArgI = -1;

    process.argv.forEach(function (arg, i){
        if (arg.match("wapplr-cli")){
            startArgI = i
        }
    });

    if (startArgI > -1) {
        if (process.argv[startArgI + 1] && !process.argv[startArgI + 1].match("--")) {
            options.runScript = process.argv[startArgI + 1];
        }
        if (process.argv[startArgI + 2] && !process.argv[startArgI + 2].match("--")) {

            if (
                ((process.argv.indexOf("--root-path") === -1) && fs.existsSync(path.resolve(process.cwd(), process.argv[startArgI + 2]))) ||
                ((process.argv.indexOf("--root-path") === -1) && process.argv[startArgI + 2].split(path.sep)[0])
            ){
                if (!options.paths) {
                    options.paths = {}
                }
                options.paths.rootPath = path.relative(process.cwd(), path.resolve(process.cwd(), process.argv[startArgI + 2]));

                const paths = options.paths.rootPath.split(path.sep);
                if (paths[paths.length-1]){
                    options.packageName = paths[paths.length-1];
                }
            } else {
                options.packageName = process.argv[startArgI + 2];
            }
        }
    }

    if (process.argv.indexOf("--root-path") > -1 &&
        process.argv[process.argv.indexOf("--root-path") + 1] &&
        !process.argv[process.argv.indexOf("--root-path") + 1].match("--")
    ){
        if (!options.paths) {
            options.paths = {}
        }
        options.paths.rootPath = path.relative(process.cwd(), path.resolve(process.cwd(),  process.argv[process.argv.indexOf("--root-path") + 1]))
    }

    if (options.paths && options.paths.rootPath && !fs.existsSync(path.resolve(process.cwd(), options.paths.rootPath))){
        fs.mkdirSync(path.resolve(process.cwd(), options.paths.rootPath), { recursive: true })
    }

    if (process.argv.indexOf("--dist-path") > -1 &&
        process.argv[process.argv.indexOf("--dist-path") + 1] &&
        !process.argv[process.argv.indexOf("--dist-path") + 1].match("--")
    ){
        if (!options.paths) {
            options.paths = {}
        }
        options.paths.distPath = process.argv[process.argv.indexOf("--dist-path") + 1];
    }

    if (process.argv.indexOf("--src-path") > -1 &&
        process.argv[process.argv.indexOf("--src-path") + 1] &&
        !process.argv[process.argv.indexOf("--src-path") + 1].match("--")
    ){
        if (!options.paths) {
            options.paths = {}
        }
        options.paths.srcPath = process.argv[process.argv.indexOf("--src-path") + 1];
    }

    if (process.argv.indexOf("--build-path") > -1 &&
        process.argv[process.argv.indexOf("--build-path") + 1] &&
        !process.argv[process.argv.indexOf("--build-path") + 1].match("--")
    ){
        if (!options.paths) {
            options.paths = {}
        }
        options.paths.buildPath = process.argv[process.argv.indexOf("--build-path") + 1];
    }

    if (process.argv.indexOf("--template") > -1 &&
        process.argv[process.argv.indexOf("--template") + 1] &&
        !process.argv[process.argv.indexOf("--template") + 1].match("--")
    ){
        if (!options.paths) {
            options.paths = {}
        }
        options.paths.templatePath = process.argv[process.argv.indexOf("--template") + 1];
    }

    options.argv = (startArgI > -1) ? process.argv.slice(startArgI+1) : reverseArgvFromOptions(options);
    return options;
}

function getPaths(p = {}) {

    const optionsPaths = p.paths || {};

    const rootPath = (optionsPaths.rootPath) ? path.isAbsolute(optionsPaths.rootPath) ?  optionsPaths.rootPath : path.resolve(process.cwd(), optionsPaths.rootPath) : path.dirname(path.resolve("package.json"));
    const buildToolsPath = path.resolve(__dirname, "../../");

    const defaultSrcPath = path.resolve(rootPath, "src");
    const defaultBuildPath = path.resolve(rootPath, "run");
    const defaultDistPath = path.resolve(rootPath, "dist");
    const defaultTemplatePath = path.resolve(buildToolsPath, "wapplr-template");

    const srcPath = (optionsPaths.srcPath) ? (path.isAbsolute(optionsPaths.srcPath)) ? optionsPaths.srcPath : path.resolve(rootPath, optionsPaths.srcPath) : defaultSrcPath;
    const buildPath = (optionsPaths.buildPath) ? (path.isAbsolute(optionsPaths.buildPath)) ? optionsPaths.buildPath : path.resolve(rootPath, optionsPaths.buildPath): defaultBuildPath;
    const distPath = (optionsPaths.distPath) ? (path.isAbsolute(optionsPaths.distPath)) ? optionsPaths.distPath : path.resolve(rootPath, optionsPaths.distPath): defaultDistPath;
    const templatePath = (optionsPaths.templatePath) ? (path.isAbsolute(optionsPaths.templatePath)) ? optionsPaths.templatePath : path.resolve(buildToolsPath, optionsPaths.templatePath): defaultTemplatePath;

    return {
        rootPath,
        buildToolsPath,
        srcPath,
        buildPath,
        distPath,
        templatePath
    }
}

function getOptions(props = {}, callerName) {

    const {console, ...rest} = props;
    const p = (callerName) ? addCallerToRunScript(rest, callerName) : rest;
    const paths = getPaths(p);
    const {rootPath} = paths;

    const runScript = p.runScript ? p.runScript : "create";

    const argv = p.argv;

    const packageJson = (fs.existsSync(path.resolve(rootPath, "package.json"))) ? require(path.resolve(rootPath, "package.json")) : {};
    let packageName = packageJson.name || p.packageName;
    if (!packageName && rootPath) {
        try {
            packageName = rootPath.split(path.sep)[rootPath.split(path.sep).length - 1];
        } catch (e) {
            throw e;
        }
    }

    const isDev = !((runScript === "build") || (typeof runScript == "object" && runScript.indexOf("build") > -1));

    const buildHash = (runScript === "create" || runScript === "clean") ? null : generateHash(isDev);

    const time = (p.time) ? p.time : generateTime();

    const options = {
        time,
        runScript,
        packageName,
        buildHash,
        paths,
        argv,
    };

    if (console) {
        consoleOptions(options);
    }

    return options;
}

function consoleOptions(p = {}) {

    console.group("\n[WAPPLR]");
    console.log(p);
    console.groupEnd();

}

function format(time) {
    return time.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, "$1");
}


function copyFileSync( source, target ) {

    let targetFile = target;

    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync() {

    const source = arguments[0];
    const target = arguments[1];

    let filter = function () {return false;};
    let basename = path.basename( source );
    if (arguments.length === 3){
        if (typeof arguments[2] == "function") {
            filter = arguments[2];
        }
        if (typeof arguments[2] == "string"){
            basename = arguments[2];
        }
    }
    if (arguments.length === 4){
        if (typeof arguments[2] == "string") {
            basename = arguments[2];
        }
        if (typeof arguments[3] == "function"){
            filter = arguments[3];
        }
    }

    let files = [];
    const targetFolder = path.join( target, basename );
    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder, { recursive: true });
    }
    if ( fs.lstatSync( source ).isDirectory() ) {
        const bre = filter(source);
        if (!bre) {
            files = fs.readdirSync(source);
            files.forEach(function (file) {
                const curSource = path.join(source, file);
                const bre = filter(curSource);
                if (!bre){
                    if (fs.lstatSync(curSource).isDirectory()) {
                        copyFolderRecursiveSync(curSource, targetFolder, filter);
                    } else {
                        copyFileSync(curSource, targetFolder);
                    }
                }
            });
        }
    }
}

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

function deleteFolderRecursiveByAnotherFolderFilesSync (schema, path) {
    let files = [];
    if( fs.existsSync(schema) ) {
        files = fs.readdirSync(schema);
        files.forEach(function(file){
            const curSchema = schema + "/" + file;
            const curPath = path + "/" + file;
            if (fs.existsSync(curPath)){
                if(fs.lstatSync(curSchema).isDirectory()) {
                    deleteFolderRecursiveByAnotherFolderFilesSync(curSchema, curPath);
                } else {
                    if (fs.existsSync(curPath)) {
                        console.log("Unlink file: " + curPath);
                        fs.unlinkSync(curPath);
                    }
                    if (curPath && curPath.slice(-4) === ".css"){
                        const findCssJs = curPath.slice(0,-4) + "_css.js";
                        if (fs.existsSync(findCssJs)) {
                            console.log("Unlink file: " + findCssJs);
                            fs.unlinkSync(findCssJs);
                        }
                    }
                }
            }
        });

        const pathFiles = fs.readdirSync(path);
        if (pathFiles && pathFiles.length){} else {
            console.log("Unlink folder: " + path);
            fs.rmdirSync(path);
        }
    }
}

function deleteFolderIfEmptySync(path) {
    if (fs.existsSync(path)) {
        const pathFiles = fs.readdirSync(path);
        if (pathFiles && pathFiles.length) {
        } else {
            fs.rmdirSync(path);
        }
    }
}

const moduleExports = {
    parseOptionsFromArgs,
    getPaths,
    getOptions,
    consoleOptions,
    format,
    copyFileSync,
    copyFolderRecursiveSync,
    deleteFolderRecursiveSync,
    deleteFolderRecursiveByAnotherFolderFilesSync,
    deleteFolderIfEmptySync,
};

module.exports = moduleExports;
