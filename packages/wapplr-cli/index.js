const run = require("./tools/run");
const create = require("./tools/create");
const clean = require("./tools/clean");
const build = require("./tools/build");
const start = require("./tools/start");

const moduleExports = {run, create, clean, build, start};

if (require.main === module && process.argv.length > 2) {
    delete require.cache[__filename];
    const mod = moduleExports[process.argv[2]];
    run(mod).catch(function(err){
        console.error(err.stack);
        process.exit(1);
    });
}

module.exports = moduleExports;
