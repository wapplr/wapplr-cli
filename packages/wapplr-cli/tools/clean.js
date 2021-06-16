const fs = require("fs");
const path = require("path");

const {
    getOptions,
    deleteFolderRecursiveSync,
    deleteFolderIfEmptySync,
    deleteFolderRecursiveByAnotherFolderFilesSync
} = require("./utils");

const {createManifest} = require("./utils/serviceWorker");
const createWapplrJson = require("./utils/wapplrJson");

async function cleanByPaths(p = {}) {

    const {paths, options} = p;
    const {srcPath, buildPath, distPath, templatePath} = paths;

    let consoleLine = 0;

    function consoleLog(){
        consoleLine = consoleLine + 1;
        console.log(...arguments)
    }

    if (!fs.existsSync(buildPath)){
        fs.mkdirSync(buildPath, { recursive: true });
    }
    if (fs.existsSync(path.resolve(buildPath, "server.js"))){
        fs.unlinkSync(path.resolve(buildPath, "server.js"))
    }
    if (fs.existsSync(path.resolve(buildPath, "server.js.map"))){
        fs.unlinkSync(path.resolve(buildPath, "server.js.map"))
    }
    if (fs.existsSync(path.resolve(buildPath, "server.js.LICENSE.txt"))){
        fs.unlinkSync(path.resolve(buildPath, "server.js.LICENSE.txt"))
    }
    if (fs.existsSync(path.resolve(buildPath, "asset-manifest.json"))){
        const asset = require(path.resolve(buildPath, "asset-manifest.json"));
        Object.keys(asset).forEach(function (key){
            if (fs.existsSync(path.join(buildPath, "public", asset[key]))){
                consoleLog("Unlink file: " + path.join(buildPath, "public", asset[key]));
                fs.unlinkSync(path.join(buildPath, "public", asset[key]))
            }
            if (fs.existsSync(path.join(buildPath, "public", asset[key]+".map"))){
                consoleLog("Unlink file: " + path.join(buildPath, "public", asset[key]+".map"));
                fs.unlinkSync(path.join(buildPath, "public", asset[key]+".map"))
            }
            if (fs.existsSync(path.join(buildPath, "public", asset[key]+".LICENSE.txt"))){
                consoleLog("Unlink file: " + path.join(buildPath, "public", asset[key]+".LICENSE.txt"));
                fs.unlinkSync(path.join(buildPath, "public", asset[key]+".LICENSE.txt"))
            }
        });
        consoleLog("Unlink file: " + path.resolve(buildPath, "asset-manifest.json"));
        fs.unlinkSync(path.resolve(buildPath, "asset-manifest.json"))
    }

    if (fs.existsSync(path.resolve(buildPath, "server-asset-manifest.json"))){
        const asset = require(path.resolve(buildPath, "server-asset-manifest.json"));
        Object.keys(asset).forEach(function (key){
            if (fs.existsSync(path.join(buildPath,  asset[key]))){
                consoleLog("Unlink file: " + path.join(buildPath,  asset[key]));
                fs.unlinkSync(path.join(buildPath,  asset[key]))
            }
            if (fs.existsSync(path.join(buildPath,  asset[key]+".map"))){
                consoleLog("Unlink file: " + path.join(buildPath,  asset[key]+".map"));
                fs.unlinkSync(path.join(buildPath,  asset[key]+".map"))
            }
            if (fs.existsSync(path.join(buildPath,  asset[key]+".LICENSE.txt"))){
                consoleLog("Unlink file: " + path.join(buildPath,  asset[key]+".LICENSE.txt"));
                fs.unlinkSync(path.join(buildPath,  asset[key]+".LICENSE.txt"))
            }
        });
        consoleLog("Unlink file: " + path.resolve(buildPath, "server-asset-manifest.json"));
        fs.unlinkSync(path.resolve(buildPath, "server-asset-manifest.json"))
    }

    if (fs.existsSync(path.resolve(buildPath, "chunk-manifest.json"))) {
        const chunk = require(path.resolve(buildPath, "chunk-manifest.json"));
        if (chunk.client){
            chunk.client.forEach(function (fileName){
                if (fs.existsSync(path.join(buildPath, "public", fileName))){
                    consoleLog("Unlink file: " + path.join(buildPath, "public", fileName));
                    fs.unlinkSync(path.join(buildPath, "public", fileName))
                }
                if (fs.existsSync(path.join(buildPath, "public", fileName+".map"))){
                    consoleLog("Unlink file: " + path.join(buildPath, "public", fileName+".map"));
                    fs.unlinkSync(path.join(buildPath, "public", fileName+".map"))
                }
                if (fs.existsSync(path.join(buildPath, "public", fileName+".LICENSE.txt"))){
                    consoleLog("Unlink file: " + path.join(buildPath, "public", fileName+".LICENSE.txt"));
                    fs.unlinkSync(path.join(buildPath, "public", fileName+".LICENSE.txt"))
                }
            })
        }
        consoleLog("Unlink file: " + path.resolve(buildPath, "chunk-manifest.json"));
        fs.unlinkSync(path.resolve(buildPath, "chunk-manifest.json"))
    }

    if (fs.existsSync(path.resolve(buildPath, "additional-asset-manifest.json"))){
        const asset = require(path.resolve(buildPath, "additional-asset-manifest.json"));
        Object.keys(asset).forEach(function (key){
            if (fs.existsSync(path.join(buildPath, "public", asset[key]))){
                consoleLog("Unlink file: " + path.join(buildPath, "public", asset[key]));
                fs.unlinkSync(path.join(buildPath, "public", asset[key]))
            }
            if (fs.existsSync(path.join(buildPath, "public", asset[key]+".map"))){
                consoleLog("Unlink file: " + path.join(buildPath, "public", asset[key]+".map"));
                fs.unlinkSync(path.join(buildPath, "public", asset[key]+".map"))
            }
            if (fs.existsSync(path.join(buildPath, "public", asset[key]+".LICENSE.txt"))){
                consoleLog("Unlink file: " + path.join(buildPath, "public", asset[key]+".LICENSE.txt"));
                fs.unlinkSync(path.join(buildPath, "public", asset[key]+".LICENSE.txt"))
            }
        });
        consoleLog("Unlink file: " + path.resolve(buildPath, "additional-asset-manifest.json"));
        fs.unlinkSync(path.resolve(buildPath, "additional-asset-manifest.json"))
    }

    if (fs.existsSync(path.resolve(buildPath, "updates"))) {
        consoleLog("Unlink folder: " + path.resolve(buildPath, "updates"));
        deleteFolderRecursiveSync(path.resolve(buildPath, "updates"));
    }

    if (fs.existsSync(path.resolve(buildPath, "packages"))) {
        consoleLog("Unlink folder: " + path.resolve(buildPath, "packages"));
        deleteFolderRecursiveSync(path.resolve(buildPath, "packages"));
    }

    try {
        const defaultManifest = require(path.resolve(templatePath, "run/public/manifest.json"));
        defaultManifest.icons.forEach(function (iconObject) {
            const srcPaths = iconObject.src.split("/");
            if (fs.existsSync(path.resolve(buildPath, "public", ...srcPaths))) {
                try {
                    const currentImage = fs.statSync(path.resolve(buildPath, "public", ...srcPaths));
                    const templateImage = fs.statSync(path.resolve(templatePath, "run", "public", ...srcPaths));
                    if (JSON.stringify({size:currentImage.size}) ===
                        JSON.stringify({size:templateImage.size})
                    ) {
                        consoleLog("Unlink file: " + path.resolve(buildPath, "public", ...srcPaths));
                        fs.unlinkSync(path.resolve(buildPath, "public", ...srcPaths))
                    }
                } catch (e) {}
            }
        });

        if (fs.existsSync(path.resolve(buildPath, "public", "manifest.json"))) {
            try {
                const manifest = require(path.resolve(buildPath, "public", "manifest.json"));
                const generatedManifest = createManifest({...options, return: "object", tryWithMissingExistsManifest: true});
                if (JSON.stringify(generatedManifest) === JSON.stringify(manifest)){
                    consoleLog("Unlink file: " + path.resolve(buildPath, "public", "manifest.json"));
                    fs.unlinkSync(path.resolve(buildPath, "public", "manifest.json"))
                }
            } catch (e) {}
        }

    } catch (e){}

    try {
        let existsServiceWorker = "";
        try {
            existsServiceWorker = fs.readFileSync(path.resolve(buildPath, "public", "serviceWorker.js")).toString()
        } catch (e) {}
        if (existsServiceWorker){
            try {

                let existsOverRides = "";
                try {
                    // noinspection RegExpRedundantEscape
                    existsOverRides = existsServiceWorker.match(/(\/\*overridesStart \[\*\/)([\S\s]*?)(\/\*\] overridesEnd\*\/)/)[2];
                } catch (e) {}

                if (existsOverRides) {
                    existsOverRides = existsOverRides.replace(/\n/g, "").replace(/ /g, "");
                    if (existsOverRides === "/***yourcodehere**/"){
                        consoleLog("Unlink file: " + path.resolve(buildPath, "public", "serviceWorker.js"));
                        fs.unlinkSync(path.resolve(buildPath, "public", "serviceWorker.js"))
                    }
                }
            } catch (e){}
        }

    }catch (e){}

    if (fs.existsSync(path.resolve(buildPath, "package.json"))){
        fs.unlinkSync(path.resolve(buildPath, "package.json"))
    }

    deleteFolderIfEmptySync(path.resolve(buildPath, "public", "assets"));
    deleteFolderIfEmptySync(path.resolve(buildPath, "public"));
    deleteFolderIfEmptySync(buildPath);

    if (fs.existsSync(distPath)){
        deleteFolderRecursiveByAnotherFolderFilesSync(srcPath, distPath)
    }

    if (consoleLine){
        console.log("");
    }

}

module.exports = async function clean(p = {}) {

    const options = getOptions(p, "clean");
    const {paths} = options;
    const {rootPath} = paths;

    console.group("[WAPPLR] Clean start");

    const wapplrJson = (fs.existsSync(path.resolve(rootPath, "wapplr.json"))) ? require(path.resolve(rootPath, "wapplr.json")) : {};

    if (wapplrJson && wapplrJson.paths){
        await cleanByPaths({paths: wapplrJson.paths, options: wapplrJson});
        if (options.runScript === "clean"){
            await createWapplrJson({...options, paths: wapplrJson.paths});
        }
    } else {
        await cleanByPaths({paths, options});
        if (options.runScript === "clean") {
            await createWapplrJson(options);
        }
    }

    console.groupEnd();

};
