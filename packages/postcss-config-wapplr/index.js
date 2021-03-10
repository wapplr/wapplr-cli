const postcss = require("postcss");
const getPlugins = require("./plugins");
const plugins = getPlugins();
const runner = postcss(plugins);

module.exports = async function (processCss) {
    return await processCss({postcss, plugins, runner});
};
