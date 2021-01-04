# babel-plugin-css-to-js-transform-test

## Scripts

```json
{
    "scripts": {
        "babel-plugin-css-to-js-transform-test build": "node ./tools build --src-dir srcDir --out-dir outDir",
        "babel-plugin-css-to-js-transform-test babel": "node ./tools clean --out-dir outDir && babel srcDir --presets=babel-preset-for-test --out-dir outDir",
        "babel-plugin-css-to-js-transform-test babel root file": "node ./tools clean --out-dir outDir && babel root_test.js --presets=babel-preset-for-test --out-dir outDir",
        "babel-plugin-css-to-js-transform-test processCss": "node ./tools clean --out-dir outDir && node ./tools processCss --src-dir srcDir --out-dir outDir",
        "babel-plugin-css-to-js-transform-test clean": "node ./tools clean --out-dir outDir"
    }
}
```

