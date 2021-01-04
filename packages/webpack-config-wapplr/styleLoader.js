const loaderUtils = require("loader-utils");

function styleLoader() {

    function loader() {}

    loader.pitch = function pitch(request) {

        if (this.cacheable) {
            this.cacheable()
        }

        return `
    var css = require(${loaderUtils.stringifyRequest(this, `!!${request}`)});
    exports = module.exports = css.locals || {};
    exports._getCss = function() { return "" + css; };
    exports._module = module;
  `
    };

    return loader;

}

module.exports = styleLoader();
