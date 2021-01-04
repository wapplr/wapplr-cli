const fs = require("fs");
const path = require("path");

const processCssFunction = require("postcss-config-wapplr");

const {
    getOptions
} = require("./index");

module.exports = async function processCss(p = {}) {
    const options = getOptions(p);
    const {paths} = options;
    const {srcPath, distPath, rootPath} = paths;
    await processCssFunction(async function processCss({runner}) {

        function recursiveReadDir(entriesPath, o = {}) {
            fs.readdirSync(entriesPath).forEach(function(file){
                const curPath = path.resolve(entriesPath, file);
                if(fs.lstatSync(curPath).isDirectory()) {
                    recursiveReadDir(curPath, o);
                } else if (file.match(".css")){
                    const srcRelative = path.relative(srcPath, curPath);
                    const rootRelative = path.relative(rootPath, curPath);
                    o[srcRelative] = "./"+rootRelative;
                }
            });
        }

        const entries = {};
        recursiveReadDir(srcPath, entries);

        await Promise.all(Object.keys(entries).map(async function (relativePath) {
            return new Promise(async function(resolve, reject) {
                try {
                    const from = path.resolve(srcPath, relativePath);
                    const to = path.resolve(distPath, relativePath);
                    const css = fs.readFileSync(from);
                    const result = await runner.process(css, {from: from, to: to})
                    if (!fs.existsSync(path.dirname(to))){
                        fs.mkdirSync(path.dirname(to), { recursive: true });
                    }
                    fs.writeFileSync(to, result.css)
                    return resolve();
                } catch (e) {
                    return reject(e)
                }
            })
        }))

    })
}
