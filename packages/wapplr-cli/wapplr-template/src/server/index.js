import wapplrServer from "wapplr";

export default async function createServer(p = {}) {
    // noinspection UnnecessaryLocalVariableJS
    const wapp = p.wapp || wapplrServer({...p});
    /*code here myFunction(wapp)*/
    return wapp;
}

export function createMiddleware(p = {}) {
    // noinspection JSUnusedAssignment,JSUnusedLocalSymbols
    return async function middleware(req, res, next) {
        // eslint-disable-next-line no-unused-vars
        const wapp = req.wapp || p.wapp || await createServer(p);
        /*code here myFunction(req, res, next)*/
        next();
    }
}

const defaultConfig = {
    config: {
        globals: {
            DEV: (typeof DEV !== "undefined") ? DEV : undefined,
            WAPP: (typeof WAPP !== "undefined") ? WAPP : undefined,
            RUN: (typeof RUN !== "undefined") ? RUN : undefined,
            TYPE: (typeof TYPE !== "undefined") ? TYPE : undefined,
            ROOT: (typeof ROOT !== "undefined") ? ROOT : __dirname,
            NAME: (typeof NAME !== "undefined") ? NAME : undefined,
        }
    }
};

export async function run(p = defaultConfig) {

    if (p?.config?.globals && !p.config.globals.RUN){
        p.config.globals.RUN = p.config?.globals.NAME || "wapplr-template"
    }

    const {env} = process;
    env.NODE_ENV = process.env.NODE_ENV;

    const wapp = await createServer(p);
    const globals = wapp.globals;
    const {DEV} = globals;

    const app = wapp.server.app;
    app.use(createMiddleware({wapp, ...p}));
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
