# Wapplr-cli

This module can handle the development of Wapplr, and facilitates the creation and build of end-user applications. 
This monorepo includes all helpers package from Wapplr:

- [babel-plugin-css-to-js-transform](https://github.com/wapplr/wapplr-cli/tree/master/packages/babel-plugin-css-to-js-transform)
- [babel-preset-wapplr](https://github.com/wapplr/wapplr-cli/tree/master/packages/babel-preset-wapplr)
- [eslint-config-wapplr](https://github.com/wapplr/wapplr-cli/tree/master/packages/eslint-config-wapplr)
- [postcss-config-wapplr](https://github.com/wapplr/wapplr-cli/tree/master/packages/postcss-config-wapplr)
- [wapplr-cli](https://github.com/wapplr/wapplr-cli/tree/master/packages/wapplr-cli)  
- [webpack-config-wapplr](https://github.com/wapplr/wapplr-cli/tree/master/packages/webpack-config-wapplr)

These wonderful packages have inspired us, so there are many similarities with them:

- [create-react-app](https://github.com/facebook/create-react-app)
- [react-starter-kit](https://github.com/kriasoft/react-starter-kit)
- [babel-plugin-css-modules-transform](https://github.com/michalkvasnicak/babel-plugin-css-modules-transform)

## Installation

```sh
npm install -g wapplr-cli
```

## Usage

```sh
npx wapplr-cli create src/my-package
```

## Functions

### create

This command creates a new Wapplr package with `my-package` name to the `path/to/src/my-package` folder:

```sh
npx wapplr-cli create path/to/src/my-package
```

This command creates a new Wapplr package with `my-package` name to the `my-folder` folder:

```sh
npx wapplr-cli create my-package --root-path my-folder
```

This command creates a new Wapplr package with `my-package` name to the current folder.

```sh
npx wapplr-cli create my-package
```

### start

This command create a startable instance inside to the current directory to the `./run` folder from `./src` folder. 
Then it runs that, and the browser will open.

```sh
npx wapplr-cli start
```
### build

This command create a startable instance inside to the current directory to the `./run` folder from `./src` folder.
And it create a distribution to the `./dist` folder

```sh
npx wapplr-cli build
```

### clean

This command deletes all files created by wapplr-cli except `wapplr.json`.

```sh
npx wapplr-cli clean
```

# wapplr.json

All commands create the descriptive file, what contain those properties. It is needed to wapplr-cli can recognize the Wapplr packages.
```json
{
    "time": "2021-01-01T00:00:00.488Z",
    "runScript": "build",
    "packageName": "wapplr",
    "buildHash": "eekrlp",
    "paths": {
        "rootPath": "your\\path\\src\\wapplr",
        "buildToolsPath": "your\\path\\node_modules\\wapplr-cli",
        "srcPath": "your\\path\\src\\wapplr\\src",
        "buildPath": "your\\path\\src\\wapplr\\run",
        "distPath": "your\\path\\src\\wapplr\\dist",
        "templateDirectory": "your\\path\\node_modules\\wapplr-cli\\wapplr-template"
    },
    "argv": [
        "build"
    ]
}
```

## License

MIT
