# wapplr-cli

This package includes all helpers package from Wapplr: 

- babel-plugin-css-to-js-transform
- babel-preset-wapplr
- eslint-config-wapplr
- postcss-config-wapplr
- webpack-config-wapplr

## Installation

```console
npm install --save-dev wapplr-cli
```

## Usage

```console
wapplr-cli create src/my-package
```

## Functions

###create

This command creates a new Wapplr package with `my-package` name to the `path/to/src` folder:

```console
wapplr-cli create path/to/src/my-package
```

This command creates a new Wapplr package with `my-package` name to the current folder.

```console
wapplr-cli create my-package
```

# start

This command create a startable instance inside to the current directory to the `./run` folder from `./src` folder. 
Then it runs that, and the browser will open.

```console
wapplr-cli start
```
# build

This command create a startable instance inside to the current directory to the `./run` folder from `./src` folder.
And it create a distribution to the `./dist` folder

```console
wapplr-cli build
```

# clean

This command deletes all files created by wapplr-cli except `wapplr.json`.

```console
wapplr-cli clean
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
