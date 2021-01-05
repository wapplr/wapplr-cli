"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = cssToJsTransform;

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread2"));

var _path = require("path");

var _cssModulesRequireHook = _interopRequireDefault(require("css-modules-require-hook"));

var _fs = require("fs");

function cssToJsTransform(_ref) {
  var t = _ref.types;
  var defaultDescriptor = {
    writable: true,
    enumerable: true,
    configurable: false
  };
  var pluginOptions = Object.create(Object.prototype, {
    defaultOptions: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: {
        cssModulesOptions: {
          generateScopedName: "[name]_[hash:base64:5]"
        }
      }
    }),
    cssData: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: {}
    }),
    cssText: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: {}
    }),
    cssTokens: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: {}
    }),
    cssCreated: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: {}
    }),
    initialized: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: false
    }),
    inProcessingFunction: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: false
    }),
    matchExtensions: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: /\.css$/i
    }),
    thisPluginOptions: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: null
    }),
    normalisePath: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: function normalisePath(path) {
        var a = path.split(_path.sep);
        return a.join("/");
      }
    }),
    getOutDirFromProcess: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: function getOutDirFromProcess() {
        var args = process && process.argv ? process.argv : [];
        var indexOutDir = args.indexOf("--out-dir");

        if (indexOutDir > -1) {
          return args[indexOutDir + 1] ? (0, _path.relative)(process.cwd(), args[indexOutDir + 1]) : "";
        }

        return null;
      }
    }),
    getSrcDirFromProcess: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: function getSrcDirFromProcess() {
        var args = process && process.argv ? process.argv : [];
        var indexSrcDir = args.indexOf("--src-dir");

        if (indexSrcDir > -1) {
          return args[indexSrcDir + 1];
        }

        var foundBabel = -1;
        args.forEach(function (arg, i) {
          if (arg.match("@babel") && arg.match("babel")) {
            foundBabel = i;
          }
        });

        if (foundBabel > -1 && !args[foundBabel + 1].match("--")) {
          if ((0, _path.extname)(args[foundBabel + 1]) === ".js") {
            var fileName = args[foundBabel + 1];
            return (0, _path.relative)(process.cwd(), (0, _path.dirname)(fileName)) || "./";
          } else if (args[foundBabel + 1]) {
            return (0, _path.relative)(process.cwd(), args[foundBabel + 1]) ? (0, _path.relative)(process.cwd(), args[foundBabel + 1]) : "./";
          }
        }

        return null;
      }
    }),
    getDir: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: function value() {
        var getOutDirFromProcess = pluginOptions.getOutDirFromProcess;

        if (pluginOptions.thisPluginOptions.outDir) {
          return (0, _path.relative)(process.cwd(), pluginOptions.thisPluginOptions.outDir);
        }

        return getOutDirFromProcess() || "dist";
      }
    }),
    getFirstPath: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: function value(filepath) {
        if (filepath) {
          var cwd = process.cwd();
          var relativePath = (0, _path.relative)(cwd, (0, _path.resolve)(filepath));

          if (relativePath) {
            var fullDir = (0, _path.dirname)(relativePath);
            var paths = fullDir.split(_path.sep);

            if (paths && paths[0]) {
              return paths[0];
            }
          }
        }

        return "";
      }
    }),
    getRelativeRoot: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: function getRelativeRoot(cssFile) {
        var getSrcDirFromProcess = pluginOptions.getSrcDirFromProcess,
            getFirstPath = pluginOptions.getFirstPath;
        return getSrcDirFromProcess() || getFirstPath(cssFile) || "";
      }
    }),
    defaultAlias: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: function defaultAlias(_ref2) {
        var cssFileRelativeFromRoot = _ref2.cssFileRelativeFromRoot,
            root = _ref2.root,
            outDir = _ref2.outDir,
            srcDir = _ref2.srcDir;

        //if the processed css is exists the plugin read it from out folder.
        if (cssFileRelativeFromRoot.slice(0, srcDir.length) === srcDir && (0, _fs.existsSync)((0, _path.resolve)(root, (0, _path.join)(outDir, cssFileRelativeFromRoot.slice(srcDir.length))))) {
          return (0, _path.relative)(root, (0, _path.resolve)(root, (0, _path.join)(outDir, cssFileRelativeFromRoot.slice(srcDir.length))));
        }

        return cssFileRelativeFromRoot;
      }
    }),
    requireCssFile: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: function requireCssFile(currentFile, value, root) {
        var getDir = pluginOptions.getDir,
            defaultAlias = pluginOptions.defaultAlias,
            getRelativeRoot = pluginOptions.getRelativeRoot;
        var cssFileRelativeFromRoot = (0, _path.relative)(root, (0, _path.resolve)((0, _path.dirname)(currentFile), value));
        var outDir = getDir();
        var srcDir = getRelativeRoot(cssFileRelativeFromRoot);

        if (pluginOptions.thisPluginOptions.alias) {
          cssFileRelativeFromRoot = pluginOptions.thisPluginOptions.alias({
            cssFileRelativeFromRoot: cssFileRelativeFromRoot,
            root: root,
            outDir: outDir,
            srcDir: srcDir
          });
        } else {
          cssFileRelativeFromRoot = defaultAlias({
            cssFileRelativeFromRoot: cssFileRelativeFromRoot,
            root: root,
            outDir: outDir,
            srcDir: srcDir
          });
        }

        var cssFileAbsolute = (0, _path.resolve)(root, cssFileRelativeFromRoot);
        var tokens = null;
        var css = "";

        if (pluginOptions.cssText[cssFileAbsolute] && pluginOptions.cssTokens[cssFileAbsolute]) {
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

        return {
          cssFileAbsolute: cssFileAbsolute,
          cssFileRelativeFromRoot: cssFileRelativeFromRoot,
          tokens: tokens,
          css: css
        };
      }
    }),
    matcher: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: function matcher() {
        var extensions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [".css"];
        var extensionsPattern = extensions.join("|").replace(/\./g, "\\.");
        return new RegExp("(".concat(extensionsPattern, ")$"), "i");
      }
    }),
    pushStylesCreator: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: function pushStylesCreator(toWrap) {
        return function processCss(css, cssFile) {
          var processed;

          if (typeof toWrap === "function") {
            processed = toWrap(css, cssFile);
          }

          if (typeof processed !== "string") {
            processed = css;
          }

          pluginOptions.cssText[cssFile] = processed;
          return processed;
        };
      }
    }),
    getContent: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      value: function getContent(tokens, css, moduleId) {
        return "\"use strict\";\nObject.defineProperty(exports, \"__esModule\", {\n  value: true\n});\nconst tokens = ".concat(JSON.stringify(tokens), ";\ntokens._getCss = function () {return `").concat(css.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/gm, " "), "`;};\ntokens._module = (typeof module !== \"undefined\") ? module : {id:\"").concat(moduleId, "\"};\nexports[\"default\"] = tokens;");
      }
    })
  });
  var pluginApi = Object.create(Object.prototype, {
    manipulateOptions: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      enumerable: true,
      value: function manipulateOptions(options) {
        var matcher = pluginOptions.matcher,
            pushStylesCreator = pluginOptions.pushStylesCreator;

        if (pluginOptions.initialized || pluginOptions.inProcessingFunction) {
          return options;
        }

        if (Array.isArray(options.plugins[0])) {
          pluginOptions.thisPluginOptions = options.plugins.filter(function (_ref3) {
            var _ref4 = (0, _slicedToArray2["default"])(_ref3, 1),
                plugin = _ref4[0];

            return plugin.manipulateOptions === pluginApi.manipulateOptions;
          })[0][1];
        } else {
          pluginOptions.thisPluginOptions = options.plugins.filter(function (plugin) {
            return plugin.manipulateOptions === pluginApi.manipulateOptions;
          })[0].options;
        }

        var currentConfig = (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, pluginOptions.defaultOptions), pluginOptions.thisPluginOptions);
        var cssModulesOptions = (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, pluginOptions.defaultOptions.cssModulesOptions), currentConfig.cssModulesOptions);
        pluginOptions.matchExtensions = matcher(currentConfig.extensions);
        cssModulesOptions.processCss = pushStylesCreator(cssModulesOptions.processCss);
        (0, _cssModulesRequireHook["default"])(cssModulesOptions);
        pluginOptions.initialized = true;
        return options;
      }
    }),
    post: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      enumerable: true,
      value: function post(state) {
        var getContent = pluginOptions.getContent,
            getDir = pluginOptions.getDir,
            getRelativeRoot = pluginOptions.getRelativeRoot,
            normalisePath = pluginOptions.normalisePath;
        Object.keys(pluginOptions.cssData).forEach(function (cssFile) {
          var data = pluginOptions.cssData[cssFile];

          if (data.css && data.tokens) {
            var cssFileRelativeFromRoot = (0, _path.relative)(data.root, (0, _path.resolve)((0, _path.dirname)(data.currentFile), data.newValue));
            var outDir = getDir();
            var srcDir = getRelativeRoot(cssFileRelativeFromRoot);
            var cssFileRelativeFromSrc = (0, _path.relative)(srcDir, cssFileRelativeFromRoot);
            var newCssDest = (0, _path.resolve)(data.root, outDir, cssFileRelativeFromSrc);
            var moduleId = "./" + normalisePath(cssFileRelativeFromSrc);

            if (!pluginOptions.cssCreated[newCssDest]) {
              pluginOptions.cssCreated[newCssDest] = true;

              if (!(0, _fs.existsSync)((0, _path.dirname)(newCssDest))) {
                (0, _fs.mkdirSync)((0, _path.dirname)(newCssDest), {
                  recursive: true
                });
              }

              var content = getContent(data.tokens, data.css, moduleId);
              (0, _fs.writeFileSync)(newCssDest, content);
              console.log("Created _css.js file: " + newCssDest);

              if (!(0, _fs.existsSync)(newCssDest.replace("_css.js", ".css"))) {
                var cssTo = newCssDest.replace("_css.js", ".css");
                (0, _fs.writeFileSync)(cssTo, data.css);
                console.log("Copy css file to: " + cssTo);
              }
            }
          }
        });
        pluginOptions.cssData = {};
      }
    }),
    visitor: (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultDescriptor), {}, {
      enumerable: true,
      value: {
        ImportDefaultSpecifier: function ImportDefaultSpecifier(path, p) {
          var file = p.file;
          var value = path.parentPath.node.source.value;
          var normalisePath = pluginOptions.normalisePath,
              requireCssFile = pluginOptions.requireCssFile;
          var variableDeclarator = t.variableDeclarator,
              variableDeclaration = t.variableDeclaration,
              memberExpression = t.memberExpression,
              callExpression = t.callExpression,
              stringLiteral = t.stringLiteral,
              identifier = t.identifier;

          if (typeof value == "string" && pluginOptions.matchExtensions.test(value)) {
            var currentFile = file.opts.filename;
            var root = file.opts.root;
            var requiredData = requireCssFile(currentFile, value, root);
            var cssFileRelativeFromRoot = requiredData.cssFileRelativeFromRoot;
            var cssFileAbsolute = requiredData.cssFileAbsolute;
            var tokens = requiredData.tokens;
            var css = requiredData.css;
            var newValue = (0, _path.relative)((0, _path.dirname)(currentFile), (0, _path.resolve)((0, _path.dirname)(currentFile), value)).replace(".css", "_css.js");

            if (!pluginOptions.cssData[cssFileAbsolute]) {
              pluginOptions.cssData[cssFileAbsolute] = {};
            }

            pluginOptions.cssData[cssFileAbsolute] = (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, pluginOptions.cssData[cssFileAbsolute]), {}, {
              currentFile: currentFile,
              root: root,
              value: value,
              newValue: newValue,
              cssFileRelativeFromRoot: cssFileRelativeFromRoot,
              cssFileAbsolute: cssFileAbsolute,
              tokens: tokens,
              css: css
            });
            var varDeclaration = variableDeclaration("var", [variableDeclarator(identifier(path.node.local.name), memberExpression(callExpression(identifier("require"), [stringLiteral("./" + normalisePath(newValue))]), identifier("default")))]);
            path.parentPath.replaceWith(varDeclaration);
          }
        },
        CallExpression: function CallExpression(path, _ref5) {
          var file = _ref5.file;
          var _path$node = path.node,
              calleeName = _path$node.callee.name,
              args = _path$node.arguments;
          var normalisePath = pluginOptions.normalisePath,
              requireCssFile = pluginOptions.requireCssFile;
          var isStringLiteral = t.isStringLiteral,
              isExpressionStatement = t.isExpressionStatement,
              memberExpression = t.memberExpression,
              callExpression = t.callExpression,
              stringLiteral = t.stringLiteral,
              identifier = t.identifier;

          if (calleeName !== "require" || !args.length || !isStringLiteral(args[0])) {
            return;
          }

          var _args = (0, _slicedToArray2["default"])(args, 1),
              value = _args[0].value;

          if (pluginOptions.matchExtensions.test(value)) {
            var currentFile = file.opts.filename;
            var root = file.opts.root;
            var requiredData = requireCssFile(currentFile, value, root);
            var cssFileRelativeFromRoot = requiredData.cssFileRelativeFromRoot;
            var cssFileAbsolute = requiredData.cssFileAbsolute;
            var tokens = requiredData.tokens;
            var css = requiredData.css;
            var newValue = (0, _path.relative)((0, _path.dirname)(currentFile), (0, _path.resolve)((0, _path.dirname)(currentFile), value)).replace(".css", "_css.js");

            if (!pluginOptions.cssData[cssFileAbsolute]) {
              pluginOptions.cssData[cssFileAbsolute] = {};
            }

            pluginOptions.cssData[cssFileAbsolute] = (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, pluginOptions.cssData[cssFileAbsolute]), {}, {
              currentFile: currentFile,
              root: root,
              value: value,
              cssFileRelativeFromRoot: cssFileRelativeFromRoot,
              cssFileAbsolute: cssFileAbsolute,
              tokens: tokens,
              css: css,
              newValue: newValue
            });

            if (!isExpressionStatement(path.parent)) {
              path.replaceWith(memberExpression(callExpression(identifier("require"), [stringLiteral("./" + normalisePath(newValue))]), identifier("default")));
            } else {
              path.remove();
            }
          }
        }
      }
    })
  });
  return pluginApi;
}