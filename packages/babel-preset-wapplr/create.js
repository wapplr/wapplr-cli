const path = require("path");

const validateBoolOption = (name, value, defaultValue) => {
    if (typeof value === "undefined") {
        value = defaultValue;
    }

    if (typeof value !== "boolean") {
        throw new Error(`Preset wapplr: "${name}" option must be a boolean.`);
    }

    return value;
};

module.exports = function (api, opts, env) {
    if (!opts) {
        opts = {};
    }

    const {mode = "development", targets} = opts;
    const isProd = (mode === "production");
    const isDev = !(isProd);

    const useCssModules = opts.cssModules;

    const useESModules = validateBoolOption(
        "useESModules",
        opts.useESModules,
        isDev || isProd
    );

    const isFlowEnabled = validateBoolOption("flow", opts.flow, true);
    const isTypeScriptEnabled = validateBoolOption(
        "typescript",
        opts.typescript,
        true
    );
    const isReactEnabled = validateBoolOption("flow", opts.react, false);

    const areHelpersEnabled = validateBoolOption("helpers", opts.helpers, true);
    const useAbsoluteRuntime = validateBoolOption(
        "absoluteRuntime",
        opts.absoluteRuntime,
        true
    );

    let absoluteRuntimePath = undefined;
    if (useAbsoluteRuntime) {
        absoluteRuntimePath = path.dirname(
            require.resolve("@babel/runtime/package.json")
        );
    }

    if (!isDev && !isProd) {
        throw new Error(
            "Using `babel-preset-wapplr` requires that you specify `NODE_ENV` or " +
            "`BABEL_ENV` environment variables. Valid values are 'development', " +
            "'test', and 'production'. Instead, received: " + JSON.stringify(env) + "."
        );
    }

    const presetEvOptions = {
        useBuiltIns: "entry",
        corejs: 3,
        exclude: ["transform-typeof-symbol"],
        ...(targets) ? {
            targets: {
                ...targets,
            }
        } : {},
    };

    return {
        presets: [
            (isProd || isDev) && [
                require("@babel/preset-env").default,
                presetEvOptions,
            ],
            (isReactEnabled) && [
                require("@babel/preset-react").default,
                {
                    development: (isDev),
                    ...(opts.runtime !== "automatic" ? { useBuiltIns: true } : {}),
                    runtime: opts.runtime || "classic",
                },
            ],
            isTypeScriptEnabled && [require("@babel/preset-typescript").default],
        ].filter(Boolean),
        plugins: [
            isFlowEnabled && [
                require("@babel/plugin-transform-flow-strip-types").default,
                false,
            ],
            require("babel-plugin-macros"),
            isTypeScriptEnabled && [
                require("@babel/plugin-proposal-decorators").default,
                false,
            ],
            [
                require("@babel/plugin-proposal-class-properties").default,
                {
                    loose: true,
                },
            ],
            require("@babel/plugin-syntax-dynamic-import"),
            require("@babel/plugin-proposal-numeric-separator").default,
            [
                require("@babel/plugin-transform-runtime").default,
                {
                    corejs: false,
                    helpers: areHelpersEnabled,
                    version: require("@babel/runtime/package.json").version,
                    regenerator: true,
                    useESModules: useESModules,
                    absoluteRuntime: absoluteRuntimePath,
                },
            ],
            (isProd && isReactEnabled ) && [
                require("babel-plugin-transform-react-remove-prop-types").default,
                {
                    removeImport: true,
                },
            ],
            require("@babel/plugin-proposal-optional-chaining").default,
            require("@babel/plugin-proposal-nullish-coalescing-operator").default,
            (useCssModules) && [require("babel-plugin-css-to-js-transform").default, {}]
        ].filter(Boolean),
        overrides: [
            isFlowEnabled && {
                exclude: /\.tsx?$/,
                plugins: [require("@babel/plugin-transform-flow-strip-types").default],
            },
            isTypeScriptEnabled && {
                test: /\.tsx?$/,
                plugins: [
                    [
                        require("@babel/plugin-proposal-decorators").default,
                        { legacy: true },
                    ],
                ],
            },
        ].filter(Boolean),
    };
};
