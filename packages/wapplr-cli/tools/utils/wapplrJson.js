const path = require("path");
const fs = require("fs");

const {
    getOptions,
} = require("./index");

module.exports = async function wapplrJson(p = {}) {

    const options = getOptions(p);
    const {paths} = options;

    const {
        rootPath,
    } = paths;

    const newJson = {...options};

    fs.writeFileSync(path.resolve(rootPath, "wapplr.json"), JSON.stringify(newJson, null, "    "))

};
