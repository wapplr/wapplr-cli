const getWebpackConfig = require("webpack-config-wapplr");
const path = require("path");

const {
    getOptions,
} = require("./index");

module.exports = async function webpack(p = {}) {

    const {
        mode,
        runOrReturn = "run",
        ...rest} = p;

    const options = getOptions(rest);
    const {
        paths
    } = options;

    const {rootPath} = paths;

    return new Promise(function (resolve, reject) {

        let {compiler, config} = getWebpackConfig({
            ...options,
            mode
        });

        try {
            let overrides;
            try {
                overrides = require(path.resolve(rootPath, "webpack-config-override.js"))({
                    compiler,
                    config,
                    options
                });
            } catch (e){}
            if (overrides) {
                config = overrides.config;
                compiler = overrides.compiler;
            }
        } catch(e) {
            console.log(e);
        }

        if (runOrReturn === "return"){
            return resolve({compiler, config});
        } else {
            console.group("[WEBPACK]");
            compiler.run(function(err, stats) {
                console.groupEnd();
                if (err) {
                    return reject(err);
                }
                console.group("\n[WEBPACK] Compiler info");
                console.info(stats.toString(config[0].stats));
                console.groupEnd();
                if (stats.hasErrors()) {
                    return reject(new Error("Webpack compilation errors"));
                }
                return resolve();
            });
        }
    })
};
