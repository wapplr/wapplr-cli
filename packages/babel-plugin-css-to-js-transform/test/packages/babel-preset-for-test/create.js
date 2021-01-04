module.exports = function (api, opts, env) {

    const presetEvOptions = {
        useBuiltIns: "entry",
        corejs: 3,
    };

    return {
        presets: [
            [
                require("@babel/preset-env").default,
                presetEvOptions,
            ],
        ].filter(Boolean),
        plugins: [
            [require("../../../dist/index").default, {
                /*custom options*/
            }]
        ].filter(Boolean),
    };
};
