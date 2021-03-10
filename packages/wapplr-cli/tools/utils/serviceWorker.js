const fs = require("fs");
const path = require("path");

const {
    getOptions,
    copyFileSync
} = require("./index");

function createManifest(p = {}) {

    const options = getOptions(p);
    const {paths, packageName} = options;
    const {rootPath, templatePath, buildPath} = paths;

    const defaultManifest = require(path.resolve(templatePath, "run/public/manifest.json"));

    if (p.return !== "object") {
        if (!fs.existsSync(path.resolve(buildPath))) {
            fs.mkdirSync(path.resolve(buildPath), { recursive: true });
        }
        if (!fs.existsSync(path.resolve(buildPath, "public"))) {
            fs.mkdirSync(path.resolve(buildPath, "public"), { recursive: true });
        }
    }

    let existsManifest = {};
    try {
        if (!p.tryWithMissingExistsManifest) {
            existsManifest = require(path.resolve(buildPath, "public", "manifest.json"))
        }
    } catch (e) {}

    let runPackageJson = null;
    let name = "";

    try {
        runPackageJson = require(path.resolve(buildPath, "package.json"));
        name = runPackageJson.name.replace(/-/g, " ").replace(/_/g, " ");
        name = name.charAt(0).toUpperCase() + name.slice(1);
    } catch (e) {}

    try {
        if (!runPackageJson) {
            runPackageJson = require(path.resolve(rootPath, "package.json"));
            name = runPackageJson.name.replace(/-/g, " ").replace(/_/g, " ");
            name = name.charAt(0).toUpperCase() + name.slice(1);
        }
    } catch (e){}

    if (!runPackageJson){
        runPackageJson = {};
    }

    if (!name){
        try {
            name = existsManifest.name || packageName;
            name = name.replace(/-/g, " ").replace(/_/g, " ");
            name = name.charAt(0).toUpperCase() + name.slice(1);
        } catch (e){}
    }

    Object.keys(defaultManifest).forEach(function (key) {

        if (typeof existsManifest[key] == "undefined") {
            if (key === "description") {
                existsManifest[key] = runPackageJson[key] || defaultManifest[key];
            } else if (key === "name" || key === "short_name") {
                existsManifest[key] = name;
            } else {
                existsManifest[key] = defaultManifest[key];
            }
        }

        if (key === "icons" && p.return !== "object") {
            if (existsManifest[key].length && typeof existsManifest[key] == "object"){
                existsManifest[key].forEach(function (iconObject, i) {
                    try {
                        const srcPaths = iconObject.src.split("/");
                        const folderRelativeFromPublic = srcPaths.slice(0,-1);
                        if (!fs.existsSync(path.resolve(buildPath, "public", ...folderRelativeFromPublic))){
                            fs.mkdirSync(path.resolve(buildPath, "public", ...folderRelativeFromPublic), { recursive: true });
                        }

                        if (!fs.existsSync(path.resolve(buildPath, "public", ...srcPaths)) &&
                            fs.existsSync(path.resolve(templatePath, "run", "public", ...srcPaths))
                        ){
                            copyFileSync(
                                path.resolve(templatePath, "run", "public", ...srcPaths),
                                path.resolve(buildPath, "public", ...srcPaths)
                            )
                        }
                    } catch (e) {}
                })
            }
        }


    });

    if (p.return === "object") {
        return existsManifest;
    }

    fs.writeFileSync(path.resolve(buildPath, "public", "manifest.json"), JSON.stringify(existsManifest, null, "    "))

}

function createServiceWorker(p = {}) {

    const options = getOptions(p);
    const {paths} = options;
    const {templatePath, buildPath} = paths;

    if (p.return !== "string"){
        if (!fs.existsSync(path.resolve(buildPath))) {
            fs.mkdirSync(path.resolve(buildPath), { recursive: true });
        }
        if (!fs.existsSync(path.resolve(buildPath, "public"))) {
            fs.mkdirSync(path.resolve(buildPath, "public"), { recursive: true });
        }
    }

    let templateServiceWorker = "";
    try {
        templateServiceWorker = fs.readFileSync(path.resolve(templatePath, "run", "public", "serviceWorker.js")).toString()
    } catch (e) {}

    let existsServiceWorker = "";
    try {
        existsServiceWorker = fs.readFileSync(path.resolve(buildPath, "public", "serviceWorker.js")).toString()
    } catch (e) {}

    if (!existsServiceWorker) {
        existsServiceWorker = templateServiceWorker
    }

    let existsOverRides = "";
    try {
        // noinspection RegExpRedundantEscape
        existsOverRides = existsServiceWorker.match(/(\/\*overridesStart \[\*\/)([\S\s]*?)(\/\*\] overridesEnd\*\/)/)[0];
    } catch (e) {}

    try {
        if (templateServiceWorker) {
            // noinspection RegExpRedundantEscape
            const content = templateServiceWorker.match(/(\/\*contentStart \[\*\/)([\S\s]*?)(\/\*\] contentEnd\*\/)/)[0];
            if (content) {
                // noinspection RegExpRedundantEscape
                existsServiceWorker = existsServiceWorker.replace(/(\/\*contentStart \[\*\/)([\S\s]*?)(\/\*\] contentEnd\*\/)/, "" + content + "");
            }
        }
    } catch (e){}

    if (existsOverRides){
        // noinspection RegExpRedundantEscape
        existsServiceWorker = existsServiceWorker.replace(/(\/\*overridesStart \[\*\/)([\S\s]*?)(\/\*\] overridesEnd\*\/)/, ""+existsOverRides+"");
    }

    let bundleFiles = [];
    try {
        bundleFiles = require(path.resolve(buildPath, "chunk-manifest.json")).client
    } catch (e){}

    let hash = Date.now();
    try {
        hash = bundleFiles[bundleFiles.length - 1].split("/").slice(-1)[0].split(".").slice(1, -1)[0];
        if (!hash) {
            hash = bundleFiles[bundleFiles.length - 1].split("/").slice(-1)[0].split(".")[0];
        }
    } catch (e){}
    // noinspection RegExpRedundantEscape
    existsServiceWorker = existsServiceWorker.replace(/(\/\*cacheName \[\*\/)(.*?)(\/\*\]\*\/)/,
        '$1const cacheName = "'+hash+'"$3');

    // noinspection RegExpRedundantEscape
    existsServiceWorker = existsServiceWorker.replace(/(\/\*bundleFiles \[\*\/)(.*?)(\/\*\]\*\/)/,
        "$1const bundleFiles = ["+bundleFiles.map(function(f){return `"${f}"`}).join(",")+"]$3");

    if (p.return === "string"){
        return existsServiceWorker;
    }

    fs.writeFileSync(path.resolve(buildPath, "public", "serviceWorker.js"), existsServiceWorker)

}

function createManifestAndServiceWorker(p = {}) {

    //create manifest.json
    createManifest(p);

    //create serviceWorker.js
    createServiceWorker(p);

}

module.exports = {
    default: createManifestAndServiceWorker,
    createServiceWorker,
    createManifest
};
