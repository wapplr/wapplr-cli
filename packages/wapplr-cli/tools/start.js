const path = require("path");
const cp = require("child_process");

const {
    getOptions,
} = require("./utils");

async function devServer(p) {
    const options = getOptions(p);
    const {paths} = options;
    const {buildToolsPath} = paths;
    return new Promise(function (resolve, reject){
        const child = cp.fork(path.resolve(buildToolsPath, "./tools/utils/devServer.js"), options.argv);
        child.on("spawn", function (){
            resolve()
        })
        child.on("error", function (e){
            reject(e)
        })
    })
}

module.exports = async function start(p = {}) {
    const options = getOptions(p, "start");
    console.group("[WAPPLR] Start development server child process");
    await devServer(options);
    console.groupEnd();
}
