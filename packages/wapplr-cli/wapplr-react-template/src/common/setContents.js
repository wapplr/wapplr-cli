import App from "./components/App";

export default function setContents(p = {}) {

    const {wapp} = p;

    function getTitle({wapp, req, res, title}) {
        const config = wapp.getTargetObject().config;
        const {siteName = "Wapplr"} = config;
        const {statusCode, statusMessage, errorMessage} = res.wappResponse;
        if (statusCode === 404) {
            title = statusMessage || "Not found";
        }
        if (statusCode === 500) {
            title = errorMessage || statusMessage || "Internal Server Error";
        }
        return title + " | " + siteName;
    }

    wapp.contents.add({
        home: {
            render: App,
            description: "Home",
            renderType: "react",
            title: function (p) {
                return getTitle({...p, title: "Home"})
            }
        }
    });

    wapp.router.replace([
        {path: "/", contentName: "home"},
    ])

}
