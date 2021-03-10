export function getConfig(p = {}) {

    const {config = {}} = p;

    const commonConfig = config.common || {};
    const globalsConfig = config.globals || {};

    const common = {
        ...commonConfig,
        siteName: "Wapplr",
        description: "It is a React template for wapplr structure",
    };

    return {
        config: {
            ...config,
            common: common
        },
    }
}
