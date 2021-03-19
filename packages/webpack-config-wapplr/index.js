const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const WebpackAssetsManifest = require("webpack-assets-manifest");
const nodeExternals = require("webpack-node-externals");
const getPostCssPlugins = require("postcss-config-wapplr/plugins");
const moduleResolver = require("babel-plugin-module-resolver");
const terserPlugin = require("terser-webpack-plugin");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");

function getPackageJson(p = {}) {
    const {paths} = p;
    return require(path.resolve(paths.rootPath, "package.json"));
}

function getSiblingAliases(p = {}) {

    const {paths, packageName, enablePackageName} = p;
    const {rootPath} = paths;
    const parentPath = path.resolve(rootPath, "../");

    const siblingAliases = {};

    fs.readdirSync(parentPath).forEach(function(file) {
        if((fs.lstatSync(path.resolve(parentPath, file)).isDirectory() && packageName !== file) ||
            (fs.lstatSync(path.resolve(parentPath, file)).isDirectory() && packageName === file && enablePackageName)) {

            const wapplrJson = fs.existsSync(path.resolve(parentPath, file, "wapplr.json")) ? require(path.resolve(parentPath, file, "wapplr.json")) : null;
            const thereIsPackageJson = fs.existsSync(path.resolve(parentPath, file, "package.json"));
            if (thereIsPackageJson && wapplrJson){

                const srcRelative = path.relative(path.resolve(parentPath, file), wapplrJson.paths.srcPath);
                if (fs.existsSync(path.resolve(path.resolve(parentPath, file, srcRelative)))){
                    siblingAliases[wapplrJson.packageName] = wapplrJson;
                }

            }

        }
    });

    return siblingAliases;

}

function resolvePathDistToSrc(sourcePath, options) {

    const siblingAliases = getSiblingAliases({...options, enablePackageName: true});

    let foundPath = null;

    Object.keys(siblingAliases).forEach(function (packageName) {

        const wapplrJson = siblingAliases[packageName];
        const distRelativeFromParent = path.relative(wapplrJson.paths.rootPath, wapplrJson.paths.distPath);
        const search = packageName + "/" + distRelativeFromParent;

        if (sourcePath.startsWith(search)) {
            foundPath = path.resolve(path.join(wapplrJson.paths.srcPath, sourcePath.slice(search.length)))
        }

    });

    if (foundPath){
        return foundPath;
    }

    return sourcePath;

}

function moduleResolverResolvePath(mrProps = [], options = {}) {

    const [sourcePath] = mrProps;
    const {target = "node", ...rest} = options;
    const targetFolder = (target === "browser") ? "client" : "server";

    const siblingAliases = getSiblingAliases(rest);
    const sourceDistToSrc = resolvePathDistToSrc(sourcePath, rest);

    let foundPath = (sourceDistToSrc !== sourcePath) ? sourceDistToSrc : null;

    if (siblingAliases[sourcePath]) {
        foundPath = path.resolve(siblingAliases[sourcePath].paths.srcPath, targetFolder);
    }

    if (foundPath) {
        const aliasReplaces = {"_css.js": ".css"};
        Object.keys(aliasReplaces).forEach(function (search) {
            if (foundPath.match(search)) {
                if (fs.existsSync(foundPath.replace(search, aliasReplaces[search]))) {
                    foundPath = foundPath.replace(search, aliasReplaces[search])
                }
            }
        })
    }

    if (foundPath) {
        return foundPath;
    }

    return null;
}

function getStyleLoaders (p = {}) {

    const {mode = "development", packageJson, ...rest} = p;
    const {paths, runScript} = rest;

    const {
        rootPath,
    } = paths;

    const isProd = (mode === "production");
    const isStartScript = ((runScript === "start") || (typeof runScript == "object" && runScript[0] === "start"));
    const isDev = (isStartScript || !isProd);

    const enableStyleLoaders = true;
    const reStyle = /\.(css|less|styl|scss|sass|sss)$/;

    const siblingAliases = getSiblingAliases(rest);

    const includeExclude = [path.resolve(rootPath),
        ...(isStartScript && siblingAliases && Object.keys(siblingAliases).length) ?
            Object.keys(siblingAliases).map(function (key){ return path.resolve(siblingAliases[key].paths.rootPath) })
            : []
    ];

    return (!enableStyleLoaders) ? [] : [
        {
            test: reStyle,
            rules: [
                {
                    issuer: { not: [reStyle] },
                    use: path.resolve(__dirname, "./styleLoader.js"),
                },
                {
                    exclude: [...includeExclude],
                    loader: "css-loader",
                    options: {
                        sourceMap: isDev,
                        esModule: false,
                    },
                },
                {
                    include: [...includeExclude],
                    loader: "css-loader",
                    options: {
                        esModule: false,
                        importLoaders: 1,
                        sourceMap: isDev,
                        modules: {
                            localIdentName: isDev
                                ? "[name]-[local]-[hash:base64:5]"
                                : "[hash:base64:5]",
                        },
                    },
                },
                {
                    loader: require.resolve("postcss-loader"),
                    options: {
                        postcssOptions: {
                            plugins: [
                                ...getPostCssPlugins((isStartScript) ? {
                                    postcssImport: {
                                        resolve: function (sourcePath) {
                                            return resolvePathDistToSrc(sourcePath, rest);
                                        }
                                    }
                                } : {})
                            ],

                        },
                    },
                },
            ],
            sideEffects: true,
        },
    ]

}

function serverConfig(p = {}) {

    const {mode = "development", ...rest} = p;

    const {paths, packageName, buildHash = "buildHash", runScript} = rest;

    const {
        rootPath,
        srcPath,
        buildPath,
        buildToolsPath,
    } = paths;

    const isProd = (mode === "production");
    const isStartScript = ((runScript === "start") || (typeof runScript == "object" && runScript[0] === "start"));
    const isDev = (isStartScript || !isProd);

    const reScript = /\.(js|mjs|jsx|ts|tsx)$/;

    const siblingAliases = getSiblingAliases(rest);
    const packageJson = getPackageJson(rest);

    const babelPresetPath = (fs.existsSync(path.resolve(rootPath, "node_modules", "babel-preset-wapplr", "index.js"))) ? path.resolve(rootPath, "node_modules", "babel-preset-wapplr", "index.js") : "babel-preset-wapplr";

    return {
        context: rootPath,
        mode: isDev ? "development" : "production",
        resolve: {
            modules: [
                path.resolve(buildToolsPath, "../../src"),
                path.resolve(buildToolsPath, "../"),
                path.resolve(rootPath, "node_modules"),
            ],
            symlinks: true
        },
        bail: !isDev,
        cache: isDev,
        stats: {
            cached: false,
            cachedAssets: false,
            chunks: false,
            chunkModules: false,
            colors: true,
            hash: false,
            modules: false,
            reasons: isDev,
            timings: true,
            version: false,
        },
        devtool: isDev ? "inline-cheap-module-source-map" : "source-map",

        name: "server",
        target: "node",
        entry: {
            server: ["./" + path.relative(rootPath, path.resolve(srcPath, "./server"))],
        },
        output: {
            publicPath: "/assets/",
            pathinfo: false,
            devtoolModuleFilenameTemplate: function(info) { return path.resolve(info.absoluteResourcePath).replace(/\\/g, "/") },
            path: buildPath,
            filename: "[name].js",
            libraryTarget: "commonjs2",
            ...(isStartScript) ? {
                hotUpdateMainFilename: "updates/[fullhash].hot-update.json",
                hotUpdateChunkFilename: "updates/[id].[fullhash].hot-update.js"
            } : {}
        },
        module: {
            strictExportPresence: true,
            rules: [
                {
                    test: /\.m?js/,
                    resolve: {
                        fullySpecified: false
                    }
                },
                { test: /\.(json|json5)$/i, loader: "json5-loader", type: "javascript/auto", options: {esModule: false} },
                {
                    test: reScript,
                    include: [srcPath, ...Object.keys(siblingAliases).map(function (key){ return siblingAliases[key].paths.srcPath })],
                    loader: "babel-loader",
                    options: {
                        cacheDirectory: isDev,
                        babelrc: false,
                        configFile: false,
                        presets: [
                            [babelPresetPath,
                                {
                                    mode: isDev ? "development" : "production",
                                    react: true,
                                    ...(packageJson.engines && packageJson.engines.node) ? {
                                        targets: {
                                            node: packageJson.engines.node.match(/(\d+\.?)+/)[0],
                                        }
                                    } : {},
                                }
                            ],
                        ],
                        ...(isStartScript) ? {
                            plugins: [
                                [moduleResolver,
                                    {
                                        resolvePath: function(...mrProps) {
                                            return moduleResolverResolvePath(mrProps, {...rest, target:"node"})
                                        },
                                        loglevel: "verbose"
                                    }
                                ]
                            ]
                        } : {}
                    },
                },
                ...getStyleLoaders(p),
                {
                    test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                    use: [
                        {
                            loader: "file-loader",
                            options: {
                                publicPath: "/assets/",
                                outputPath: "/public/assets",
                                name: "[name].[ext]"
                            }
                        },
                    ]
                },
                {
                    test: /\.(bmp|gif|jpg|jpeg|png)(\?v=\d+\.\d+\.\d+)?$/,
                    use: [
                        {
                            loader: "file-loader",
                            options: {
                                publicPath: "/assets/",
                                outputPath: "/public/assets",
                                name: "[name].webp"
                            }
                        },
                    ]
                }
            ],
        },
        externals: [
            "./chunk-manifest.json",
            "./asset-manifest.json",
            nodeExternals({
                    modulesFromFile: true,
                    additionalModuleDirs: [
                        path.resolve(buildToolsPath, "../"),
                        path.resolve(buildToolsPath, "../../src"),
                        path.resolve(rootPath, "node_modules")
                    ],
                }
            ),
        ],
        plugins: [
            new ImageMinimizerPlugin({
                test: /\.(bmp|gif|jpg|jpeg|png)$/i,
                deleteOriginalAssets: true,
                filename: "[path][name].webp",
                loader: false,
                minimizerOptions: {
                    plugins: ["imagemin-webp"],
                },
            }),
            new webpack.DefinePlugin({
                "process.env.NODE_ENV": isDev ? JSON.stringify("development") : JSON.stringify("production"),
                "BROWSER": JSON.stringify(false),
                "DEV": JSON.stringify(isDev),
                "RUN": (isStartScript) ? JSON.stringify("") : JSON.stringify(packageName),
                "WAPP": JSON.stringify(buildHash),
                "TYPE": JSON.stringify(isStartScript ? "start" : "build"),
                "NAME": JSON.stringify(packageName),
            }),
            new WebpackAssetsManifest({
                output: `${buildPath}/server-asset-manifest.json`,
                publicPath: true,
                writeToDisk: true,
                customize: function({ key, value }){
                    if (key.toLowerCase().endsWith(".map")) {return false;}
                    return { key, value };
                },
            }),
            new webpack.BannerPlugin({
                banner: "require('source-map-support').install();",
                raw: true,
                entryOnly: false,
            }),
            ...(isStartScript) ? [new webpack.HotModuleReplacementPlugin()] : []
        ],
        optimization: {
            minimizer: [
                new terserPlugin({
                    terserOptions: {
                        format: {
                            comments: false,
                        },
                    },
                    extractComments: false,
                }),
            ],
        },
        node: {
            global: false,
            __filename: false,
            __dirname: false,
        },

    };

}

function clientConfig(p = {}) {

    const {mode = "development", ...rest} = p;
    const {paths, packageName, buildHash = "buildHash", runScript} = rest;

    const {
        rootPath,
        srcPath,
        buildPath,
        buildToolsPath,
    } = paths;

    const isProd = (mode === "production");
    const isStartScript = ((runScript === "start") || (typeof runScript == "object" && runScript[0] === "start"));
    const isDev = (isStartScript || !isProd);

    const reScript = /\.(js|mjs|jsx|ts|tsx)$/;

    const chunkhashText = (isStartScript) ? "fullhash" : "chunkhash";

    const siblingAliases = getSiblingAliases(rest);
    const packageJson = getPackageJson(rest);

    const babelPresetPath = (fs.existsSync(path.resolve(rootPath, "node_modules", "babel-preset-wapplr", "index.js"))) ? path.resolve(rootPath, "node_modules", "babel-preset-wapplr", "index.js") : "babel-preset-wapplr";

    return {
        context: rootPath,
        mode: (isDev) ? "development" : "production",
        output: {
            path: path.resolve(buildPath, "public/assets"),
            publicPath: "/assets/",
            pathinfo: false,
            filename: isDev ? "[name].js" : "[name].[" + chunkhashText + ":8].js",
            chunkFilename: isDev ? "[name].chunk.js" : "[name].[" + chunkhashText + ":8].chunk.js",
            devtoolModuleFilenameTemplate: function(info) { return path.resolve(info.absoluteResourcePath).replace(/\\/g, "/") },
            ...(isStartScript) ? {
                hotUpdateMainFilename: "updates/[fullhash].hot-update.json",
                hotUpdateChunkFilename: "updates/[id].[fullhash].hot-update.js"
            } : {}
        },
        resolve: {
            modules: [
                path.resolve(buildToolsPath, "../../src"),
                path.resolve(buildToolsPath, "../"),
                path.resolve(rootPath, "node_modules"),
            ],
            symlinks: true,
        },
        module: {
            strictExportPresence: true,
            rules: [
                {
                    test: /\.m?js/,
                    resolve: {
                        fullySpecified: false
                    }
                },
                { test: /\.(json|json5)$/i, loader: "json5-loader", type: "javascript/auto", options: {esModule: false} },
                {
                    test: reScript,
                    include: [srcPath, ...Object.keys(siblingAliases).map(function (key){ return siblingAliases[key].paths.srcPath })],
                    loader: "babel-loader",
                    options: {
                        cacheDirectory: isDev,
                        babelrc: false,
                        configFile: false,
                        presets: [
                            [babelPresetPath,
                                {
                                    mode: isDev ? "development" : "production",
                                    react: true,
                                    ...(packageJson.browserslist) ? {
                                        targets: {
                                            browsers: packageJson.browserslist,
                                        }
                                    } : {},
                                }
                            ],
                        ],
                        ...(isStartScript) ? {
                            plugins: [
                                [moduleResolver,
                                    {
                                        resolvePath: function(...mrProps) {
                                            return moduleResolverResolvePath(mrProps, {...rest, target:"browser"})
                                        },
                                        loglevel: "verbose"
                                    }
                                ]
                            ]
                        } : {}
                    },
                },
                ...getStyleLoaders(p),
                {
                    test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                    use: [
                        {
                            loader: "file-loader",
                            options: {
                                name: "[name].[ext]"
                            }
                        },
                    ]
                },
                {
                    test: /\.(bmp|gif|jpg|jpeg|png)(\?v=\d+\.\d+\.\d+)?$/,
                    use: [
                        {
                            loader: "file-loader",
                            options: {
                                name: "[name].webp"
                            }
                        },
                    ]
                }
            ],
        },
        bail: !isDev,
        cache: isDev,
        stats: {
            cached: false,
            cachedAssets: false,
            chunks: false,
            chunkModules: false,
            colors: true,
            hash: false,
            modules: false,
            reasons: isDev,
            timings: true,
            version: false
        },
        devtool: isDev ? "inline-cheap-module-source-map" : "source-map",
        name: "client",
        target: "web",
        entry: {
            client: (isStartScript) ? {
                import: ["webpack-config-wapplr/webpackHotDevClient", "./" + path.relative(rootPath, path.resolve(srcPath, "./client"))],
            } : {
                import: ["./" + path.relative(rootPath, path.resolve(srcPath, "./client"))],
            },
        },
        plugins: [
            new ImageMinimizerPlugin({
                test: /\.(bmp|gif|jpg|jpeg|png)$/i,
                deleteOriginalAssets: true,
                filename: "[path][name].webp",
                loader: false,
                minimizerOptions: {
                    plugins: ["imagemin-webp"],
                },
            }),
            new webpack.DefinePlugin({
                "process.env.NODE_ENV": isDev ? JSON.stringify("development") : JSON.stringify("production"),
                "BROWSER": JSON.stringify(true),
                "DEV": JSON.stringify(isDev),
                "RUN": JSON.stringify(packageName),
                "WAPP": JSON.stringify(buildHash),
                "TYPE": JSON.stringify(isStartScript ? "start" : "build"),
                "NAME": JSON.stringify(packageName),
            }),
            new WebpackAssetsManifest({
                output: `${buildPath}/asset-manifest.json`,
                publicPath: true,
                writeToDisk: true,
                customize: function({ key, value }){
                    if (key.toLowerCase().endsWith(".map")) {return false;}
                    return { key, value };
                },
                done: function(manifest, stats) {
                    const chunkFileName = `${buildPath}/chunk-manifest.json`;
                    try {
                        const fileFilter = function (file) {
                            const assetMetaInformation = stats.compilation.getAsset(file).info || {};
                            return !(assetMetaInformation.hotModuleReplacement || file.endsWith("hot-update.js") || file.endsWith(".map"));
                        };
                        const addPath = function(file){ return manifest.getPublicPath(file) };
                        const chunkFiles = stats.compilation.chunkGroups.reduce(function(acc, c) {
                            acc[c.name] = [
                                ...(acc[c.name] || []),
                                ...c.chunks.reduce(
                                    function(files, cc) {
                                        const ccFiles = [...cc.files];
                                        return [
                                            ...files,
                                            ...ccFiles.filter(fileFilter).map(addPath),
                                        ]
                                    },
                                    [],
                                ),
                            ];
                            return acc;
                        }, Object.create(null));
                        fs.writeFileSync(chunkFileName, JSON.stringify(chunkFiles, null, 2));
                    } catch (err) {
                        console.error("[WAPPLR]",`ERROR: Cannot write ${chunkFileName}: `, err);
                        if (!isDev) {
                            process.exit(1);
                        }
                    }
                },
            }),
            ...(isStartScript) ? [new webpack.HotModuleReplacementPlugin()] : []
        ],
        optimization: {
            minimizer: [
                new terserPlugin({
                    terserOptions: {
                        format: {
                            comments: false,
                        },
                    },
                    extractComments: false,
                }),
            ],
            splitChunks: {
                cacheGroups: {
                    vendors: {
                        chunks: "initial",
                        test: function (module) {

                            const buildToolsParentPackagesPath = path.resolve(buildToolsPath, "../");
                            const parentPath = path.resolve(rootPath, "../");

                            return !!(
                                (module.resource && module.resource.includes(`${path.sep}node_modules${path.sep}`)) ||
                                (module.resource && module.resource.includes(`${path.sep}packages${path.sep}`)) ||
                                (module.resource && module.resource.includes(`${buildToolsParentPackagesPath}`)) ||
                                ((module.resource && module.resource.includes(`${parentPath}`)) && !(module.resource && module.resource.includes(`${rootPath}`)))
                            )

                        },
                        name: "vendors",
                    },
                },
            },
        },
        node: false,
    };

}

module.exports = function (p = {}) {

    const config = [
        serverConfig(p),
        clientConfig(p)
    ];

    return {
        config,
        compiler: webpack(config)
    }
};
