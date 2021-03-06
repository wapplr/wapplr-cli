# Wapplr-cli

This module can handle the development of Wapplr, and facilitates the creation and build of end-user applications.
These wonderful packages have inspired us, so there are many similarities with them:

- [creates-react-app](https://github.com/facebook/creates-react-app)
- [react-starter-kit](https://github.com/kriasoft/react-starter-kit)
- [babel-plugin-css-modules-transform](https://github.com/michalkvasnicak/babel-plugin-css-modules-transform)

## Installation

```sh
npm install -g wapplr-cli
```

## Usage

```sh
npx wapplr-cli creates src/my-package
```

## Functions

### creates

This command creates a new Wapplr package with `my-package` name to the `path/to/src/my-package` folder:

```sh
npx wapplr-cli creates path/to/src/my-package
```

This command creates a new Wapplr package with `my-package` name to the `my-folder` folder:

```sh
npx wapplr-cli creates my-package --root-path my-folder
```

This command creates a new Wapplr package with `my-package` name to the current folder.

```sh
npx wapplr-cli creates my-package
```

### start

This command creates a startable instance inside to the current directory to the `./run` folder from `./src` folder.
Then it runs that, and the browser will open.

```sh
npx wapplr-cli start
```
### build

This command creates a startable instance inside to the current directory to the `./run` folder from `./src` folder.
And it creates a distribution to the `./dist` folder

```sh
npx wapplr-cli build
```

### clean

This command deletes all files createsd by wapplr-cli except `wapplr.json`.

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
