const postcss = require("postcss");
const postcssScss = require("postcss-scss");
const getPlugins = require("./plugins");
const plugins = getPlugins();

const r = postcss(plugins);
const runner = {
    ...r,
    process: async (css, options = {}, ...attr)=>{
        return await r.process(css, {...options, syntax: postcssScss}, ...attr)
    }
};

module.exports = async function (processCss) {
    return await processCss({postcss, plugins, runner});
};
