const path = require("path");
const cp = require("child_process");
const util = require("util");
const fs = require("fs");

const clean = require("./clean");
const create = require("./create");

const {
    getOptions,
} = require("./utils");

const webpack = require("./utils/webpack");
const processCss = require("./utils/processCss");
const {createServiceWorker} = require("./utils/serviceWorker");
const wapplrJson = require("./utils/wapplrJson");

const delay = function (time) { return new Promise(res=>setTimeout(res,time)) };

module.exports = async function build(p = {}) {

    const {disableClean, disableCreate, ...rest} = p;
    const options = getOptions(rest, "build");
    const {paths} = options;
    const {rootPath, buildToolsPath, distPath, srcPath} = paths;

    if (!disableClean){
        await clean(options);
    }

    if (!disableCreate) {
        await create({...options, enableCopyRunPackages: true});
    }

    await webpack({...options, mode:"production"});
    await delay(2000);
    await createServiceWorker(options)
    await processCss(options);

    const babelPath = (fs.existsSync(path.resolve(buildToolsPath, "../.bin/babel"))) ? '"' + path.resolve(buildToolsPath, "../.bin/babel") + '"' :
        (fs.existsSync(path.resolve(buildToolsPath, "./node_modules/.bin/babel"))) ? '"' + path.resolve(buildToolsPath, "./node_modules/.bin/babel") + '"' :
            (fs.existsSync(path.resolve(rootPath, "./node_modules/.bin/babel"))) ? '"' + path.resolve(rootPath, "./node_modules/.bin/babel") + '"' : "babel"

    const babelPresetPath = (fs.existsSync(path.resolve(rootPath, "node_modules", "babel-preset-wapplr", "dist.js"))) ? '"' + path.resolve(rootPath, "node_modules", "babel-preset-wapplr", "dist.js") + '"' : "babel-preset-wapplr/dist";

    const execText = babelPath + " " + srcPath + " --presets="+babelPresetPath+" --out-dir " + distPath + " --verbose";
    console.log("\n[WCI]","Run babel: " + execText);
    const {stdout, stderr} = await util.promisify(cp.exec)(execText);

    console.group("\n[BABEL]")
    if (stdout) {
        console.log(stdout);
    }
    if (stderr) {
        console.error(stderr)
    }
    console.groupEnd();

    const packageJson = (fs.existsSync(path.resolve(rootPath, "package.json"))) ? require(path.resolve(rootPath, "package.json")) : {};
    packageJson.main = path.join(path.relative(rootPath, path.resolve(distPath)), "server").split(path.sep).join("/").replace("./", "");
    packageJson.browser = path.join(path.relative(rootPath, path.resolve(distPath)), "client").split(path.sep).join("/").replace("./", "");
    packageJson.files = [path.relative(rootPath, path.resolve(distPath)) + "/*"];
    fs.writeFileSync(path.resolve(rootPath, "package.json"), JSON.stringify(packageJson, null, "    "));

    await wapplrJson(options);

}
