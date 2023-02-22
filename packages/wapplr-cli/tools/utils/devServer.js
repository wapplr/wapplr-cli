const express = require("express");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const browserSync = require("browser-sync");

const path = require("path");

const {format, getOptions, parseOptionsFromArgs} = require("./index");
const webpack = require("./webpack");

const clean = require("../clean");
const create = require("../create");
const {createServiceWorker} = require("./serviceWorker");
const wapplrJson = require("./wapplrJson");
const fs = require("fs");

let server;

async function devServer(p = {}) {

    const {config, compiler, ...rest} = p;
    const options = getOptions(rest);
    const {paths} = options;
    const {buildPath, srcPath} = paths;
    const isDev = true;

    if (server) {
        return server;
    }

    const watchOptions = {};

    function createCompilationPromise(name, compiler, config) {

        return new Promise(function(resolve, reject) {

            let timeStart = new Date();

            compiler.hooks.compile.tap(name, function() {
                timeStart = new Date();
                console.info("[WEBPACK]", `[${format(timeStart)}] Compiling "${name}"...`);
            });

            compiler.hooks.done.tap(name, function(stats) {
                console.groupEnd();
                console.group("\n[WEBPACK] Compiler info");
                console.group(name+":");
                console.info(stats.toString(config.stats));
                const timeEnd = new Date();
                const time = timeEnd.getTime() - timeStart.getTime();
                if (stats.hasErrors()) {
                    console.info(`[${format(timeEnd)}] Failed to compile "${name}" after ${time} ms`,);
                    console.groupEnd();
                    reject(new Error("Compilation failed!"));
                } else {
                    console.info(`[${format(timeEnd,)}] Finished "${name}" compilation after ${time} ms`,);
                    console.groupEnd();
                    resolve(stats);
                }
            });

        });
    }

    const clientConfig = config.find(config => config.name === "client");
    const serverConfig = config.find(config => config.name === "server");

    const multiCompiler = compiler;
    const clientCompiler = multiCompiler.compilers.find((compiler) => compiler.name === "client");
    const serverCompiler = multiCompiler.compilers.find((compiler) => compiler.name === "server");

    const otherClientConfigs = config.filter((config => (config.name !== "client" && config.name !== "server" && multiCompiler.compilers.find((compiler) => compiler.name === config.name ))));

    const serverPromise = createCompilationPromise("server", serverCompiler, serverConfig);
    const clientPromise = createCompilationPromise("client", clientCompiler, clientConfig);
    const otherClientPromise = (otherClientConfigs.length) ? Promise.all([...otherClientConfigs.map((config, i)=> createCompilationPromise(config.name, multiCompiler.compilers.find((compiler) => compiler.name === config.name), config))]) : new Promise((resolve) => resolve() )

    let wapp;
    let app;
    let appPromise;
    let appPromiseResolve;
    let appPromiseIsResolved = true;

    server = express();

    server.use(express.static(path.resolve(buildPath, "public")));

    server.use(webpackDevMiddleware(clientCompiler, {
        publicPath: clientConfig.output.publicPath,
        logLevel: "silent",
        watchOptions,
    }));

    server.use(webpackHotMiddleware(clientCompiler, { log: false }));

    if (otherClientConfigs.length){
        otherClientConfigs.forEach((config) => {

            const compiler = multiCompiler.compilers.find((compiler) => compiler.name === config.name);

            server.use(webpackDevMiddleware(compiler, {
                publicPath: config.output.publicPath,
                logLevel: "silent",
                watchOptions,
            }));

            server.use(webpackHotMiddleware(compiler, { log: false }));

        })
    }

    serverCompiler.hooks.compile.tap("server", function() {
        if (!appPromiseIsResolved) {
            return;
        }
        appPromiseIsResolved = false;
        appPromise = new Promise(resolve => (appPromiseResolve = resolve));
    });

    server.use(function(req, res) {
        appPromise
            .then(function () {
                return app(req, res);
            })
            .catch(function (error) {
                return console.error("[WAPPLR]",error)
            });
    });

    function checkForUpdate(fromUpdate) {
        const hmrPrefix = "[\x1b[35mHMR\x1b[0m] ";
        if (!app.hot) {
            throw new Error(`${hmrPrefix}Hot Module Replacement is disabled.`);
        }
        if (app.hot.status() !== "idle") {
            return Promise.resolve();
        }
        return app.hot
            .check(true)
            .then(function(updatedModules) {
                if (!updatedModules) {
                    if (fromUpdate) {
                        console.info(`Update applied.`);
                    }
                    console.groupEnd();
                    return;
                }
                console.groupEnd();
                console.group("\n" + hmrPrefix);
                if (updatedModules.length === 0) {
                    console.info(`Nothing hot updated.`);
                } else {
                    console.info(`Updated modules:`);
                    updatedModules.forEach(moduleId =>
                        console.info(` - ${moduleId}`),
                    );
                    checkForUpdate(true);
                }
            })
            .catch(async function(error) {
                if (["abort", "fail"].includes(app.hot.status())) {
                    console.warn(`Cannot apply update.`);
                    if (wapp) {
                        wapp.server.close(async function () {
                            delete require.cache[require.resolve(path.relative(__dirname, path.resolve(buildPath, "./server")))];
                            wapp = await require(path.relative(__dirname, path.resolve(buildPath, "./server"))).run();
                            app = wapp.server.app;
                            console.warn(`App has been reloaded.`);
                        });
                    }
                } else {
                    console.warn(`Update failed: ${error.stack || error.message}`);
                }
                console.groupEnd();
            });
    }

    serverCompiler.watch(watchOptions, (error, stats) => {
        if (app && !error && !stats.hasErrors()) {
            checkForUpdate().then(function() {
                appPromiseIsResolved = true;
                appPromiseResolve();
                createServiceWorker(options)
            });
        }
    });

    console.group("\n[WEBPACK]");

    await clientPromise;
    await serverPromise;
    await otherClientPromise;

    console.groupEnd();

    const timeStart = new Date();
    console.group("\n[WAPPLR]",`[${format(timeStart)}] Launching server...`);

    wapp = await require(path.relative(__dirname, path.resolve(buildPath, "./server"))).run();
    app = wapp.server.app;
    appPromiseIsResolved = true;
    appPromiseResolve();

    const port = process.env.PORT ? Number(process.env.PORT) : undefined;
    const bs = browserSync.create();

    let credentials = null;
    const credentialsFolder = "secure/";
    const dirname = path.resolve(buildPath);
    if (fs.existsSync(path.resolve(dirname, credentialsFolder, "localhost.key"))  && fs.existsSync(path.resolve(dirname, credentialsFolder, "localhost.crt")) ){
        credentials = {
            key: path.resolve(dirname, credentialsFolder, "localhost.key"),
            cert: path.resolve(dirname, credentialsFolder, "localhost.crt"),
        }
    }

    createServiceWorker(options);

    await new Promise(function(resolve, reject) {
        return bs.init({
                server: path.relative(buildPath, path.resolve(srcPath, "./server")),
                middleware: [server],
                open: !process.argv.includes("--silent"),
                ...(isDev ? {} : {notify: false, ui: false}),
                ...(port ? {port} : null),
                ...(credentials) ? {
                    https: {
                        key: credentials.key,
                        cert: credentials.cert
                    }
                } : {}
            },
            (error, bs) => (error ? reject(error) : resolve(bs)),
        )
    });

    const timeEnd = new Date();
    const time = timeEnd.getTime() - timeStart.getTime();
    console.info("\n[WAPPLR]",`[${format(timeEnd)}] Server launched after ${time} ms\n`);
    console.groupEnd();

    return server;

}

async function start(p = {}) {

    const options = getOptions(p);
    if (!arguments.length) {
        console.log("[WAPPLR] Development server from child process")
    }

    await clean(options);
    await create(options);

    const {compiler, config} = await webpack({...options, mode:"development", runOrReturn:"return"});
    await devServer({...options, compiler, config});

    await wapplrJson(options);

}

async function run() {
    const optionsFromArgs = parseOptionsFromArgs();
    const options = getOptions({...optionsFromArgs});
    await start(options)
}

run();

module.exports = start;
