const create = require('./create');

module.exports = function (api, opts = {}) {
    return create(api, {...opts, mode:"production", useESModules: false, absoluteRuntime: false})
};
