import wapplrServer from "wapplr";
import wapplrReact from "wapplr-react";

import Head from "./components/Head";
import setContents from "../common/setContents";

import {getConfig as getCommonConfig} from "../common/config";
import favicon from "./images/icon_192x192.png";

export function getConfig(p = {}) {

    const {config = {}} = p;

    const serverConfig = config.server || {};
    const commonConfig = getCommonConfig(p).config;

    const common = {...commonConfig.common};

    const server = {
        ...serverConfig,
        icon: favicon,
    };

    return {
        config: {
            ...config,
            common: common,
            server: server,
        },
    }
}

export default async function createServer(p = {}) {

    const {config} = getConfig(p);
    const wapp = p.wapp || wapplrServer({...p, config});

    wapplrReact({wapp});

    wapp.contents.addComponent({
        head: Head
    });

    setContents({wapp});

    return wapp;
}

export async function createMiddleware(p = {}) {
    // eslint-disable-next-line no-unused-vars
    const wapp = p.wapp || await createServer(p);
    return [
        function middleware(req, res, next) {
            next()
        }
    ]
}

const defaultConfig = {
    config: {
        globals: {
            DEV: (typeof DEV !== "undefined") ? DEV : undefined,
            WAPP: (typeof WAPP !== "undefined") ? WAPP : undefined,
            RUN: (typeof RUN !== "undefined") ? RUN : undefined,
            TYPE: (typeof TYPE !== "undefined") ? TYPE : undefined,
            ROOT: (typeof ROOT !== "undefined") ? ROOT : __dirname
        }
    }
};

export async function run(p = defaultConfig) {

    const {env} = process;
    env.NODE_ENV = process.env.NODE_ENV;

    const {config} = getConfig(p);
    const wapp = await createServer({...p, config});
    const globals = wapp.globals;
    const {DEV} = globals;

    const app = wapp.server.app;
    app.use(await createMiddleware({wapp, ...p}));
    wapp.server.listen();

    if (typeof DEV !== "undefined" && DEV && module.hot){
        app.hot = module.hot;
        module.hot.accept("./index");
    }

    return wapp;
}

if (typeof RUN !== "undefined" && RUN === "wapplr-template") {
    run();
}
