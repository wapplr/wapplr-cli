module.exports = function (p = {}) {
    const {postcssImport = {}} = p;
    return [
        require('postcss-import')(postcssImport),
        require('postcss-calc')(),
        require('pleeease-filters')(),
        require('pixrem')(),
        require('postcss-flexbugs-fixes')(),
        require('postcss-preset-env')({
            stage: 3,
            autoprefixer: { flexbox: 'no-2009' },
        }),
    ]
}
