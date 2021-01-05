# Webpack-config-wapplr

This package includes [Webpack](https://github.com/webpack/webpack) configuration used by Wapplr.

## Module resolver

"Sibling packages" mean that the package name can be found in the parent directory. There is a `package.json` and a `wapplr.json` file.
Eg: `import myPackage from 'my-package'`. If there is `../mypackage` folder and there are package files they will work with alias. 

- It the import use a file from dist folder `import mySubPackage from 'mypackage/dist/myfile` the path will replace to `mypackage/src/myfile`.
  The "dist" and "src" folders read from `mypackage\wapplr.json` file `{"paths": {srcPath: "...", distPath: "...""}}` that is configurable.

- In the next step redirect the sibling packages to `../packageName/src/client` or `../packageName/src/server`, it depends on bundle target.

- At the end it will change `_css.js` to `.css` if the css file is exists. TODO: It should be outsource babel-plugin-css-to-js-transform...

## Style loading

Css files import with `css-loader` and the `styleLoader` add `_getCss` function and `module` object to exports object. 

- If the css is from a Sibling package folder or from the Package folder it will load with `styleLoader`.
- The other css will load with just `css-loader`.

```js
/*styleLoader.js*/

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
```

