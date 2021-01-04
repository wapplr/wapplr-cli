const getWebpackConfig = require("webpack-config-wapplr");

const {
    getOptions,
} = require("./index");

module.exports = async function webpack(p = {}) {

    const {
        mode,
        runOrReturn = "run",
        ...rest} = p;

    const options = getOptions(rest);

    return new Promise(function (resolve, reject) {

        const {compiler, config} = getWebpackConfig({
            ...options,
            mode
        });

        if (runOrReturn === "return"){
            return resolve({compiler, config});
        } else {
            console.group("[WEBPACK]")
            compiler.run(function(err, stats) {
                console.groupEnd()
                if (err) {
                    return reject(err);
                }
                console.group("\n[WEBPACK] Compiler info")
                console.info(stats.toString(config[0].stats));
                console.groupEnd();
                if (stats.hasErrors()) {
                    return reject(new Error("Webpack compilation errors"));
                }
                return resolve();
            });
        }
    })
}
