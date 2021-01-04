import {resolve, dirname, join, extname, relative, sep} from "path";
import cssModuleRequireHook from "css-modules-require-hook";

import {writeFileSync, existsSync, mkdirSync} from "fs";

export default function cssToJsTransform({ types: t }) {

    const defaultDescriptor = {
        writable: true,
        enumerable: true,
        configurable: false,
    }

    const pluginOptions = Object.create(Object.prototype, {
        defaultOptions: {
            ...defaultDescriptor,
            value: {
                cssModulesOptions: {
                    generateScopedName: "[name]_[hash:base64:5]"
                }
            }
        },
        cssData: {
            ...defaultDescriptor,
            value: {}
        },
        cssText: {
            ...defaultDescriptor,
            value: {}
        },
        cssTokens: {
            ...defaultDescriptor,
            value: {}
        },
        cssCreated: {
            ...defaultDescriptor,
            value: {}
        },
        initialized: {
            ...defaultDescriptor,
            value: false
        },
        inProcessingFunction: {
            ...defaultDescriptor,
            value: false
        },
        matchExtensions: {
            ...defaultDescriptor,
            value: /\.css$/i
        },
        thisPluginOptions: {
            ...defaultDescriptor,
            value: null
        },
        normalisePath: {
            ...defaultDescriptor,
            value: function normalisePath(path) {
                const a = path.split(sep);
                return a.join("/");
            }
        },
        getOutDirFromProcess: {
            ...defaultDescriptor,
            value: function getOutDirFromProcess() {
                const args = (process && process.argv) ? process.argv : [];
                const indexOutDir = args.indexOf("--out-dir");
                if (indexOutDir > -1){
                    return (args[indexOutDir + 1]) ? relative(process.cwd(), args[indexOutDir + 1]) : "";
                }
                return null;
            }
        },
        getSrcDirFromProcess: {
            ...defaultDescriptor,
            value: function getSrcDirFromProcess() {
                const args = (process && process.argv) ? process.argv : [];
                const indexSrcDir = args.indexOf("--src-dir");
                if (indexSrcDir > -1){
                    return args[indexSrcDir + 1]
                }
                let foundBabel = -1;
                args.forEach(function (arg, i){
                    if (arg.match("@babel") && arg.match("babel")){
                        foundBabel = i;
                    }
                })
                if (foundBabel > -1 && !args[foundBabel + 1].match("--")){
                    if (extname(args[foundBabel + 1]) === ".js"){
                        const fileName = args[foundBabel + 1];
                        return relative(process.cwd(), dirname(fileName)) || "./"
                    } else if (args[foundBabel + 1]){
                        return (relative(process.cwd(), args[foundBabel + 1])) ? relative(process.cwd(), args[foundBabel + 1]) : "./";
                    }
                }
                return null;
            }
        },
        getDir: {
            ...defaultDescriptor,
            value: function () {
                const {getOutDirFromProcess} = pluginOptions;
                if (pluginOptions.thisPluginOptions.outDir){
                    return relative(process.cwd(), pluginOptions.thisPluginOptions.outDir)
                }
                return getOutDirFromProcess() || "dist";
            }
        },
        getFirstPath: {
            ...defaultDescriptor,
            value: function (filepath){
                if (filepath) {
                    const cwd = process.cwd();
                    const relativePath = relative(cwd, resolve(filepath));
                    if (relativePath) {
                        const fullDir = dirname(relativePath);
                        const paths = fullDir.split(sep);
                        if (paths && paths[0]) {
                            return paths[0];
                        }
                    }
                }
                return "";
            },
        },
        getRelativeRoot: {
            ...defaultDescriptor,
            value: function getRelativeRoot(cssFile) {
                const {getSrcDirFromProcess, getFirstPath} = pluginOptions;
                return getSrcDirFromProcess() || getFirstPath(cssFile) || "";
            }
        },
        defaultAlias: {
            ...defaultDescriptor,
            value: function defaultAlias({cssFileRelativeFromRoot, root, outDir, srcDir}) {
                //if the processed css is exists the plugin read it from out folder.
                if (cssFileRelativeFromRoot.slice(0,srcDir.length) === srcDir && existsSync(resolve(root, join(outDir, cssFileRelativeFromRoot.slice(srcDir.length))))){
                    return relative(root, resolve(root, join(outDir, cssFileRelativeFromRoot.slice(srcDir.length))))
                }
                return cssFileRelativeFromRoot;
            }
        },
        requireCssFile: {
            ...defaultDescriptor,
            value: function requireCssFile(currentFile, value, root) {

                const {getDir, defaultAlias, getRelativeRoot} = pluginOptions;

                let cssFileRelativeFromRoot = relative(root, resolve(dirname(currentFile), value))
                const outDir = getDir();
                const srcDir = getRelativeRoot(cssFileRelativeFromRoot);

                if (pluginOptions.thisPluginOptions.alias){
                    cssFileRelativeFromRoot = pluginOptions.thisPluginOptions.alias({cssFileRelativeFromRoot, root, outDir, srcDir})
                } else {
                    cssFileRelativeFromRoot = defaultAlias({cssFileRelativeFromRoot, root, outDir, srcDir})
                }

                const cssFileAbsolute = resolve(root, cssFileRelativeFromRoot);
                let tokens = null;
                let css = "";

                if (pluginOptions.cssText[cssFileAbsolute] && pluginOptions.cssTokens[cssFileAbsolute]){
                    tokens = pluginOptions.cssTokens[cssFileAbsolute];
                    css = pluginOptions.cssText[cssFileAbsolute];
                }

                if (!tokens || !css) {
                    try {
                        tokens = require(cssFileAbsolute);
                        css = pluginOptions.cssText[cssFileAbsolute];
                        pluginOptions.cssTokens[cssFileAbsolute] = tokens;
                    } catch (e) {}
                }

                return {cssFileAbsolute, cssFileRelativeFromRoot, tokens, css};

            }
        },
        matcher: {
            ...defaultDescriptor,
            value: function matcher(extensions = [".css"]) {
                const extensionsPattern = extensions.join("|").replace(/\./g, "\\.");
                return new RegExp(`(${extensionsPattern})$`, "i");
            }
        },
        pushStylesCreator: {
            ...defaultDescriptor,
            value: function pushStylesCreator(toWrap) {
                return function processCss(css, cssFile) {

                    let processed;

                    if (typeof toWrap === "function") {
                        processed = toWrap(css, cssFile);
                    }

                    if (typeof processed !== "string") {
                        processed = css;
                    }

                    pluginOptions.cssText[cssFile] = processed;

                    return processed;
                }
            }
        },
        getContent: {
            ...defaultDescriptor,
            value: function getContent(tokens, css, moduleId) {
                return `"use strict";
Object.defineProperty(exports, "__esModule", {
  value: true
});
const tokens = ${JSON.stringify(tokens)};
tokens._getCss = function () {return \`${css.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/gm, " ")}\`;};
tokens._module = (typeof module !== "undefined") ? module : {id:"${moduleId}"};
exports["default"] = tokens;`
            }
        },
    })

    const pluginApi = Object.create(Object.prototype, {
        manipulateOptions: {
            ...defaultDescriptor,
            enumerable: true,
            value: function manipulateOptions(options) {

                const {matcher, pushStylesCreator} = pluginOptions

                if (pluginOptions.initialized || pluginOptions.inProcessingFunction) {
                    return options;
                }

                if (Array.isArray(options.plugins[0])) {
                    pluginOptions.thisPluginOptions = options.plugins.filter(
                        ([plugin]) => plugin.manipulateOptions === pluginApi.manipulateOptions
                    )[0][1];
                } else {
                    pluginOptions.thisPluginOptions = options.plugins.filter(
                        (plugin) => plugin.manipulateOptions === pluginApi.manipulateOptions
                    )[0].options;
                }

                const currentConfig = { ...pluginOptions.defaultOptions, ...pluginOptions.thisPluginOptions };
                const cssModulesOptions = {...pluginOptions.defaultOptions.cssModulesOptions, ...currentConfig.cssModulesOptions};
                pluginOptions.matchExtensions = matcher(currentConfig.extensions);
                cssModulesOptions.processCss = pushStylesCreator(cssModulesOptions.processCss);

                cssModuleRequireHook(cssModulesOptions);

                pluginOptions.initialized = true;

                return options;

            },
        },
        post: {
            ...defaultDescriptor,
            enumerable: true,
            value: function post(state) {

                const {getContent, getDir, getRelativeRoot, normalisePath} = pluginOptions;

                Object.keys(pluginOptions.cssData).forEach(function (cssFile) {

                    const data = pluginOptions.cssData[cssFile];

                    if (data.css && data.tokens){

                        let cssFileRelativeFromRoot = relative(data.root, resolve(dirname(data.currentFile), data.newValue))
                        const outDir = getDir();
                        const srcDir = getRelativeRoot(cssFileRelativeFromRoot);
                        const cssFileRelativeFromSrc = relative(srcDir, cssFileRelativeFromRoot);
                        const newCssDest = resolve(data.root, outDir, cssFileRelativeFromSrc);
                        const moduleId = "./"+normalisePath(cssFileRelativeFromSrc);

                        if (!pluginOptions.cssCreated[newCssDest]) {

                            pluginOptions.cssCreated[newCssDest] = true;

                            if (!existsSync(dirname(newCssDest))) {
                                mkdirSync(dirname(newCssDest), {recursive: true});
                            }
                            const content = getContent(data.tokens, data.css, moduleId)
                            writeFileSync(newCssDest, content);

                            console.log("Created _css.js file: " + newCssDest)

                            if (!existsSync(newCssDest.replace("_css.js", ".css"))) {
                                const cssTo = newCssDest.replace("_css.js", ".css");
                                writeFileSync(cssTo, data.css);
                                console.log("Copy css file to: " + cssTo)
                            }

                        }

                    }

                })

                pluginOptions.cssData = {};

            },
        },
        visitor: {
            ...defaultDescriptor,
            enumerable: true,
            value: {
                ImportDefaultSpecifier: function(path, p) {

                    const { file } = p;
                    const value = path.parentPath.node.source.value;
                    const {normalisePath, requireCssFile} = pluginOptions
                    const {variableDeclarator, variableDeclaration, memberExpression, callExpression, stringLiteral, identifier} = t;

                    if (typeof value == "string" && pluginOptions.matchExtensions.test(value)) {

                        const currentFile = file.opts.filename;
                        const root = file.opts.root;
                        const requiredData = requireCssFile(currentFile, value, root);

                        const cssFileRelativeFromRoot = requiredData.cssFileRelativeFromRoot;
                        const cssFileAbsolute = requiredData.cssFileAbsolute;
                        const tokens = requiredData.tokens;
                        const css = requiredData.css;

                        const newValue = relative(dirname(currentFile), resolve(dirname(currentFile), value)).replace(".css", "_css.js")

                        if (!pluginOptions.cssData[cssFileAbsolute]){
                            pluginOptions.cssData[cssFileAbsolute] = {};
                        }

                        pluginOptions.cssData[cssFileAbsolute] = {
                            ...pluginOptions.cssData[cssFileAbsolute],
                            currentFile,
                            root,
                            value,
                            newValue,
                            cssFileRelativeFromRoot,
                            cssFileAbsolute,
                            tokens,
                            css,
                        }

                        const varDeclaration = variableDeclaration(
                            "var",
                            [
                                variableDeclarator(
                                    identifier(path.node.local.name),
                                    memberExpression(
                                        callExpression(
                                            identifier("require"),
                                            [stringLiteral("./"+normalisePath(newValue))]
                                        ),
                                        identifier("default")
                                    )
                                ),
                            ]
                        );

                        path.parentPath.replaceWith(varDeclaration);

                    }

                },
                CallExpression(path, { file }) {

                    const { callee: { name: calleeName }, arguments: args } = path.node;
                    const {normalisePath, requireCssFile} = pluginOptions
                    const {isStringLiteral, isExpressionStatement, memberExpression, callExpression, stringLiteral, identifier} = t;

                    if (calleeName !== "require" || !args.length || !isStringLiteral(args[0])) {
                        return;
                    }

                    let [{ value }] = args;

                    if (pluginOptions.matchExtensions.test(value)) {

                        const currentFile = file.opts.filename;
                        const root = file.opts.root;
                        const requiredData = requireCssFile(currentFile, value, root);

                        const cssFileRelativeFromRoot = requiredData.cssFileRelativeFromRoot;
                        const cssFileAbsolute = requiredData.cssFileAbsolute;
                        const tokens = requiredData.tokens;
                        const css = requiredData.css;

                        const newValue = relative(dirname(currentFile), resolve(dirname(currentFile), value)).replace(".css", "_css.js")

                        if (!pluginOptions.cssData[cssFileAbsolute]){
                            pluginOptions.cssData[cssFileAbsolute] = {};
                        }

                        pluginOptions.cssData[cssFileAbsolute] = {
                            ...pluginOptions.cssData[cssFileAbsolute],
                            currentFile,
                            root,
                            value,
                            cssFileRelativeFromRoot,
                            cssFileAbsolute,
                            tokens,
                            css,
                            newValue,
                        }

                        if (!isExpressionStatement(path.parent)) {

                            path.replaceWith(memberExpression(
                                callExpression(
                                    identifier("require"),
                                    [stringLiteral("./"+normalisePath(newValue))]
                                ),
                                identifier("default")
                            ));

                        } else {
                            path.remove();
                        }

                    }
                }
            }
        }
    })

    return pluginApi;

}
