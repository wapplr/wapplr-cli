const {format, parseOptionsFromArgs, getOptions} = require("./utils");

module.exports = function run(fn) {

    const task = fn;
    if (task) {

        const start = new Date();
        const optionsFromArgs = parseOptionsFromArgs();
        console.log("[WAPPLR]", `[${format(start)}] Starting "${task.name}${(optionsFromArgs && JSON.stringify(optionsFromArgs) !== "{}") ? ` (${JSON.stringify(optionsFromArgs)})` : ""}"...`,);

        const options = getOptions({...optionsFromArgs, time: start, console: true})

        return task(options).then(function (resolution) {
            const end = new Date();
            const time = end.getTime() - start.getTime();
            console.log("[WAPPLR]", `[${format(end)}] Finished "${task.name}${(optionsFromArgs && JSON.stringify(optionsFromArgs) !== "{}") ? ` (${JSON.stringify(optionsFromArgs)})` : ""}" after ${time} ms`,);
            return resolution;
        });

    }

    console.log("There is no this command, please use one of create, clean, build or start command");
    return null;

}
