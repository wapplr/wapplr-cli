# babel-preset-wapplr

The default Babel preset for Wapplr structure.

This package was written based on [babel-preset-react-app](https://github.com/facebook/create-react-app/tree/master/packages/babel-preset-react-app)

## Usage outside the Wapplr

If you want to use this Babel preset in a project not built with Wapplr, you can install it with the following steps.

First, [install Babel](https://babeljs.io/docs/setup/).

Then install babel-preset-wapplr.

```sh
npm install babel-preset-wapplr --save-dev
```

Then create a file named `.babelrc` with following contents in the root folder of your project:

```json
{
  "presets": ["wapplr"]
}
```

## Enable React

Make sure you have a `.flowconfig` file at the root directory. You can also use the `flow` option on `.babelrc`:

```json
{
  "presets": [["wapplr", { "react": true }]]
}
```

## Usage with Flow

Make sure you have a `.flowconfig` file at the root directory. You can also use the `flow` option on `.babelrc`:

```json
{
  "presets": [["wapplr", { "flow": true, "typescript": false }]]
}
```

## Usage with TypeScript

Make sure you have a `tsconfig.json` file at the root directory. You can also use the `typescript` option on `.babelrc`:

```json
{
  "presets": [["wapplr", { "flow": false, "typescript": true }]]
}
```

## Absolute Runtime Paths

Absolute paths are enabled by default for imports. To use relative paths instead, set the `absoluteRuntime` option in `.babelrc` to `false`:

```
{
  "presets": [["wapplr-app", { "absoluteRuntime": false }]]
}
```

## License

MIT
