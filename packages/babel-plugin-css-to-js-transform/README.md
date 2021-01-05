# Babel-plugin-css-to-js-transform

This Babel plugin finds all `require` and all `import` function for css files, 
and replace them with a new file with this name `[filename]_css.js`.
It is keeps the the `require` and the `import`. 
In the file only replaces the file name with the new file name.

Then the transform generate a new file `[filename]_css.js` from `[filename].css`. 
It inserts class names as `default export` by [css-modules](https://github.com/css-modules/css-modules)
with [css-modules-require-hook](https://github.com/css-modules/css-modules-require-hook) package,
and insert a getter `_getCss` function to the default object like 
some style loaders eg: [isomorphic-style-loader](https://github.com/kriasoft/isomorphic-style-loader)

This plugin is based on the fantastic 
[babel-plugin-css-modules-transform](https://github.com/michalkvasnicak/babel-plugin-css-modules-transform).

## Why?

There are two reasons what the plugin was written: 

1. The exists plugins don't support async plugins for [postcss](https://github.com/postcss/postcss)
2. Doesn't want insert class names to the file because it causes many duplicates and increases the bundle size.

These are especially interesting if you want to create a reusable high order component or module,
and you want to add a css. When you create an end user type software use webpack and style-loaders.

## Warning

This plugin is experimental, pull requests are welcome.

## Example

```css
/* srcDir/test_require.css */

.someClass {
    color: red;
    display: flex;
}
```

```js
// srcDir/component.js
const styles = require("./test_import.css");
```

```js
// outDir/test_require_css.js
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

const tokens = {
    "someClass":"test_require_31cRH"
}; 

tokens._getCss = function () {
    return `/* imported from test_require.css */ .test_require_31cRH { color: red; display: flex; } `;
};

exports["default"] = tokens;
```

```js
// outDir/component.js
var styles = require("dir/test_require_css.js")["default"];
```

## Installation

```sh
npm install --save-dev babel-plugin-css-to-js-transform
```

**Include plugin in `.babelrc`**

```json
{
    "plugins": ["css-to-js-transform"]
}
```

**With custom options**

```js
module.exports = function (api, opts, env) {
    return {
        "plugins": [
            [
                require("babel-plugin-css-to-js-transform").default,
                {
                    cssModulesOptions: {
                        generateScopedName: "[name]_[hash:base64:5]",
                        //more options here: [css-modules-require-hook](https://github.com/css-modules/css-modules-require-hook)
                    },
                    alias: function alias({filePathOrModuleName, root, outDir, srcDir}) {
                        let relativeFromRoot = relative(root, filePathOrModuleName);
                        //if the processed css is exists the plugin read it from out folder.
                        if (relativeFromRoot.slice(0,3) === srcDir && existsSync(resolve(root, outDir + relativeFromRoot.slice(3)))){
                            relativeFromRoot = outDir + relativeFromRoot.slice(3)
                        }
                        return resolve(root, relativeFromRoot);
                    },
                    outDir: "dist"
                }
            ]
        ]
    }
}
```

## Using a processor

When using this plugin with a processor, run it before this plugin running.
This example show you how create a build function with postcss.

You can try it in [test package](test/README.md) from command line: babel-plugin-test build

```js
// tools/build.js
const postcss = require("postcss");
const path = require("path");
const fs = require("fs");

/*...*/

/**Create a postcss runner*/
async function processCssFunction(processCss) {
    const plugins = [
        require("postcss-import")(),
        require("postcss-calc")(),
        require("pleeease-filters")(),
        require("pixrem")(),
        require("postcss-flexbugs-fixes")(),
        require("postcss-preset-env")({
            stage: 3,
            autoprefixer: { flexbox: "no-2009" },
        }),
    ];
    const runner = postcss(plugins)
    return await processCss({postcss, plugins, runner});
}

/**Create the processCss function what find all css files in src folder,
 * and it create generated css files to dist folder.
 * You can set up root, src and dist folders
 */

async function processCss(p = {}) {

    const {rootPath, distPath, srcPath} = getPaths(p)

    await processCssFunction(async function processCss({runner}) {

        function recursiveReadDir(entriesPath, o = {}) {
            fs.readdirSync(entriesPath).forEach(function(file){
                const curPath = path.resolve(entriesPath, file);
                if(fs.lstatSync(curPath).isDirectory()) {
                    recursiveReadDir(curPath, o);
                } else if (file.match(".css")){
                    const srcRelative = path.relative(srcPath, curPath);
                    const rootRelative = path.relative(rootPath, curPath);
                    o[srcRelative] = "./"+rootRelative;
                }
            });
        }

        const entries = {};
        recursiveReadDir(srcPath, entries);

        await Promise.all(Object.keys(entries).map(async function (relativePath) {
            return new Promise(async function(resolve, reject) {
                try {
                    const from = path.resolve(srcPath, relativePath);
                    const to = path.resolve(distPath, relativePath);
                    const css = fs.readFileSync(from);
                    const result = await runner.process(css, {from: from, to: to})
                    if (!fs.existsSync(path.dirname(to))){
                        fs.mkdirSync(path.dirname(to), { recursive: true });
                    }
                    if (!fs.existsSync(to)) {
                        fs.writeFileSync(to, result.css, function () {
                            return true;
                        })
                        console.log("Css processed: " + to)
                    } else {
                        console.log("File aready exists, run clean script or delete it manually before process css: " + to)
                    }
                    return resolve();
                } catch (e) {
                    return reject(e)
                }
            })
        }))

    })
}

/*...*/

/**
 * Build: first processCss, then babel
 **/
async function build(p = {}) {

    const {rootPath, distPath, srcPath} = getPaths(p)

    await clean(p);
    await processCss(p);
    const exec = require("child_process").exec;
    const execText = path.resolve(rootPath, "node_modules/.bin/babel") + " " + srcPath + " --presets=babel-preset-for-test --out-dir " + distPath;
    console.log("Run babel: " + execText);
    await exec(execText).stderr.pipe(process.stderr);
}

/*...*/

```

## License

MIT
