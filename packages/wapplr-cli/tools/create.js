const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const util = require("util");

const {
    getOptions,
    copyFolderRecursiveSync
} = require("./utils");

const {createManifest} = require("./utils/serviceWorker");
const createWapplrJson = require("./utils/wapplrJson");
const clean = require("./clean");

module.exports = async function create(p = {}) {

    const {enableCopyRunPackages, ...rest} = p;
    const options = getOptions(rest, "create");
    const {paths, packageName} = options;
    const {rootPath, templateDirectory, srcPath, buildPath} = paths;

    if (options.runScript === "create"){
        await clean(rest)
    }

    let itsANewPackage = 0

    //create package.json
    if (!fs.existsSync(path.resolve(rootPath, "package.json"))){
        const templateJson = require(path.resolve(templateDirectory, "package.json"))
        let newPackageJson = {
            ...templateJson,
            name: packageName,
            description: packageName.slice(0,1).toUpperCase()+packageName.slice(1)
        }
        newPackageJson = JSON.parse(JSON.stringify(newPackageJson).replace(/wapplr-template/g, packageName))
        fs.writeFileSync(path.resolve(rootPath, "package.json"), JSON.stringify(newPackageJson, null, "    "))
        itsANewPackage = itsANewPackage + 1;
    }

    //copy src directory and files
    if (!fs.existsSync(srcPath)){
        copyFolderRecursiveSync(path.resolve(templateDirectory, "src"), rootPath, path.basename(srcPath));
        itsANewPackage = itsANewPackage + 1;

        const serverJsPath = (fs.existsSync(path.resolve(srcPath, "server.js"))) ? path.resolve(srcPath, "server.js") : fs.existsSync(path.resolve(srcPath, "server", "index.js")) ? path.resolve(srcPath, "server", "index.js") : null;
        if (serverJsPath) {
            const serverJsContent = fs.readFileSync(serverJsPath, "utf8");
            fs.writeFileSync(serverJsPath, serverJsContent.replace(/wapplr-template/g, packageName))
        }

        const clientJsPath = (fs.existsSync(path.resolve(srcPath, "client.js"))) ? path.resolve(srcPath, "client.js") : fs.existsSync(path.resolve(srcPath, "client", "index.js")) ? path.resolve(srcPath, "client", "index.js") : null;
        if (clientJsPath) {
            const clientJsContent = fs.readFileSync(clientJsPath, "utf8");
            fs.writeFileSync(clientJsPath, clientJsContent.replace(/wapplr-template/g, packageName))
        }

    }

    //copy run directory and files
    if (!fs.existsSync(buildPath)) {
        copyFolderRecursiveSync(path.resolve(templateDirectory, "run"), rootPath, path.basename(buildPath), function filter(source){
            return !!(source.match("manifest.json") || source.match("package.json"));
        });
    }

    // create a package.json file for runnable package
    if (!fs.existsSync(path.resolve(buildPath, "package.json"))) {

        const defaultRunPackageJson = require(path.resolve(templateDirectory, "run/package.json"));

        let rootPackageJson;
        try {
            rootPackageJson = require(path.resolve(rootPath, "package.json"))
        } catch (e) {
            rootPackageJson = {...defaultRunPackageJson}
        }

        const newPackageJsonForRun = {...defaultRunPackageJson};

        if (rootPackageJson) {
            newPackageJsonForRun.name = rootPackageJson.name || newPackageJsonForRun.name;
            newPackageJsonForRun.description = rootPackageJson.description || newPackageJsonForRun.description;
            newPackageJsonForRun.license = rootPackageJson.license || newPackageJsonForRun.license;
            newPackageJsonForRun.dependencies = {...newPackageJsonForRun.dependencies, ...(rootPackageJson.dependencies) ? rootPackageJson.dependencies : {}}
            newPackageJsonForRun.engines = {...newPackageJsonForRun.engines, ...(rootPackageJson.engines) ? rootPackageJson.engines : {}}
            newPackageJsonForRun.browserslist = [...(newPackageJsonForRun.browserslist) ? newPackageJsonForRun.browserslist : []]
            if (rootPackageJson.browserslist && rootPackageJson.browserslist.length) {
                rootPackageJson.browserslist.forEach(function (value) {
                    if (newPackageJsonForRun.browserslist.indexOf(value) === -1) {
                        newPackageJsonForRun.browserslist.push(value)
                    }
                })
            }
            newPackageJsonForRun.version = rootPackageJson.version || newPackageJsonForRun.version;
            if (!fs.existsSync(buildPath)){
                fs.mkdirSync(buildPath, { recursive: true })
            }
            fs.writeFileSync(path.resolve(buildPath, "package.json"), JSON.stringify(newPackageJsonForRun, null, "    "))
        }
    }

    //create manifest
    await createManifest(options);

    //run build if this is a new package
    let nextRun = "";
    if (itsANewPackage === 2){

        let catchN = 0;
        try {

            console.log("[WAPPLR]","Try run", "yarn --cwd ./" + path.relative(process.cwd(), rootPath) + " install")

            const {stdout, stderr} = await util.promisify(cp.exec)("yarn --cwd ./" + path.relative(process.cwd(), rootPath) + " install");
            console.group("\n[YARN]")
            if (stdout) {
                console.log(stdout);
            }
            if (stderr) {
                console.error(stderr)
            }
            console.groupEnd()

        } catch (e){
            console.log("[WAPPLR]","Can't run yarn install", e)
            catchN = catchN + 1;
            try {
                console.log("[WAPPLR]","Try run", "npm --prefix ./" + path.relative(process.cwd(), rootPath) + " install")

                const {stdout, stderr} = await util.promisify(cp.exec)("[WAPPLR]","Try run", "npm --prefix ./" + path.relative(process.cwd(), rootPath) + " install");
                console.group("\n[NPM]")
                if (stdout) {
                    console.log(stdout);
                }
                if (stderr) {
                    console.error(stderr)
                }
                console.groupEnd();

            } catch (e){
                console.log("[WAPPLR]","Can't run npm install", e)
                catchN = catchN + 1;
            }
        }
        if (catchN < 2) {
            console.log("[WAPPLR]","Packages installed")
            if (options.runScript === "create") {
                try {
                    const build = require("./build");
                    await build({...options, disableClean: true, disableCreate: true});
                    nextRun = "build";
                } catch (e) {
                    console.log(e)
                }
            }
        }
    }

    //create packages inside run folder, and copy to there another packages from this monorepo (if it is a monorepo)
    if (enableCopyRunPackages || (nextRun === "build")) {
        const parentPath = path.resolve(rootPath, "../");
        if (fs.existsSync(path.resolve(buildPath, "package.json"))) {
            let runPackageJson = null;
            try {
                runPackageJson = require(path.resolve(buildPath, "package.json"))
            } catch (e) {
            }
            if (runPackageJson && runPackageJson.dependencies && typeof runPackageJson.dependencies == "object") {
                const packageNames = Object.keys(runPackageJson.dependencies);
                const shouldCopyPackages = {};
                if (packageNames.length) {
                    packageNames.forEach(function (depPackageName) {
                        if (fs.existsSync(path.resolve(parentPath, depPackageName)) && packageName !== depPackageName) {
                            const wapplrJson = fs.existsSync(path.resolve(parentPath, depPackageName, "wapplr.json")) ? require(path.resolve(parentPath, depPackageName, "wapplr.json")) : null;
                            const thereIsPackageJson = fs.existsSync(path.resolve(parentPath, depPackageName, "package.json"));
                            if (thereIsPackageJson &&
                                wapplrJson &&
                                wapplrJson.buildHash &&
                                wapplrJson.runScript &&
                                wapplrJson.runScript.toString().match("build")) {
                                shouldCopyPackages[depPackageName] = {
                                    modulePath: path.resolve(parentPath, depPackageName),
                                    wapplrJson: wapplrJson
                                }
                            } else {
                                if (!thereIsPackageJson){
                                    console.warn("Missing package.json", "This dependency package needs to create a package.json, you can run 'create' script: ", depPackageName, "\n", "path:", path.resolve(parentPath, depPackageName, "package.json"))
                                } else if (!wapplrJson){
                                    console.warn("Missing wapplr.json", "This dependency package needs to build: ", depPackageName, "\n", "path:", path.resolve(parentPath, depPackageName, "wapplr.json"))
                                } else {
                                    console.warn("Wapplr.json runScript is:", wapplrJson.runScript, "This dependency package needs to build: ", depPackageName, "\n", "path:", path.resolve(parentPath, depPackageName, "wapplr.json"))
                                }
                            }
                        }
                    })
                }
                const shouldCopyPackagesNames = Object.keys(shouldCopyPackages);
                if (shouldCopyPackagesNames.length) {
                    if (!fs.existsSync(path.resolve(buildPath))){
                        fs.mkdirSync(path.resolve(buildPath), { recursive: true })
                    }
                    const runPackagesPath = path.resolve(buildPath, "packages");
                    if (!fs.existsSync(runPackagesPath)) {
                        fs.mkdirSync(runPackagesPath, { recursive: true });
                    }
                    shouldCopyPackagesNames.forEach(function (packageName) {

                        const moduleData = shouldCopyPackages[packageName];
                        const {
                            modulePath,
                            wapplrJson
                        } = moduleData;

                        if (!fs.existsSync(path.resolve(runPackagesPath, packageName))) {

                            fs.mkdirSync(path.resolve(runPackagesPath, packageName), { recursive: true });
                            const distRelative = path.relative(modulePath, path.resolve(wapplrJson.paths.distPath));
                            fs.mkdirSync(path.resolve(runPackagesPath, packageName, distRelative), { recursive: true });

                            copyFolderRecursiveSync(path.resolve(modulePath, distRelative), path.resolve(runPackagesPath, packageName));

                            if (fs.existsSync(path.resolve(modulePath, "package.json"))) {
                                const json = require(path.resolve(modulePath, "package.json"));
                                const {devDependencies, ...rest} = json;
                                const newJson = {...rest};
                                fs.writeFileSync(path.resolve(runPackagesPath, packageName, "package.json"), JSON.stringify(newJson, null, "  "))
                            }

                        }
                    })
                }
            }
        }
    }

    //create wapplr.json if it was just a create script
    if (!nextRun && options.runScript === "create") {
        await createWapplrJson(options);
    }

}
