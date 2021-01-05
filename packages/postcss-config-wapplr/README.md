# Postcss-config-wapplr

The default [PostCss](https://github.com/postcss/postcss) config for Wapplr structure.

## Usage outside the Wapplr

If you want to use this config in a project not built with Wapplr, you can install it with the following steps.

First install, 

```sh
npm install postcss-config-wapplr --save-dev
```

```js

const fs = require("fs");
const path = require("path");
const processCssFunction = require("postcss-config-wapplr");

async function processCss(p = {}) {
    await processCssFunction(async function processCss({postcss, plugins, runner}) {

        const from = path.resolve(fromPath);
        const to = path.resolve(toPath);
        const css = fs.readFileSync(from);
        
        //Read more at PostCss Js Api - https://github.com/postcss/postcss#js-api
        const result = await runner.process(css, {from: from, to: to})
        
        if (!fs.existsSync(path.dirname(to))){
            fs.mkdirSync(path.dirname(to), { recursive: true });
        }
        fs.writeFileSync(to, result.css)
        
    })
}
```

## License

MIT
