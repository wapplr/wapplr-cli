import wapplrClient from "wapplr";

export default function createClient(p) {
    // noinspection UnnecessaryLocalVariableJS
    const wapp = p.wapp || wapplrClient({...p});
    /*code here myFunction(wapp)*/
    return wapp;
}

export function createMiddleware(p = {}) {
    // noinspection JSUnusedAssignment,JSUnusedLocalSymbols
    return function middleware(req, res, next) {
        // eslint-disable-next-line no-unused-vars
        const wapp = req.wapp || p.wapp || createClient(p);
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
            ROOT: (typeof ROOT !== "undefined") ? ROOT : "/"
        }
    }
}

export function run(p = defaultConfig) {
    const wapp = createClient(p);
    const globals = wapp.globals;
    const {DEV} = globals;

    const app = wapp.client.app;
    app.use(createMiddleware({wapp, ...p}));
    wapp.client.listen();

    if (typeof DEV !== "undefined" && DEV && module.hot){
        app.hot = module.hot;
        module.hot.accept();
    }

    return wapp;
}

if (typeof RUN !== "undefined" && RUN === "my-package") {
    run();
}
