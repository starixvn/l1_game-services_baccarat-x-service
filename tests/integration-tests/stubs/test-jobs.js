import { spawn } from "child_process";

export const startSetupDataProcess = (onSetupDataDone) => {
    const setupDataProcess = spawn("node", ["--es-module-specifier-resolution=node", "./tests/integration-tests/stubs/test-data-setup.js"]);

    setupDataProcess.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
    });

    setupDataProcess.stderr.on("data", (data) => {
        console.log(`stderr: ${data}`);
    });

    setupDataProcess.on("close", (code) => {
        onSetupDataDone && onSetupDataDone();
        console.log(`child process exited with code ${code}`);
    });

    return setupDataProcess;
};

export const startServiceProcess = (onServiceStarted) => {
    const serviceProcess = spawn("node", [
        "--es-module-specifier-resolution=node",
        "./tests/integration-tests/game-service-setup/game-service-app.js",
        {
            stdio: ["pipe", "pipe", "pipe", "ipc"],
        },
    ]);

    serviceProcess.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);

        if (data && data.includes("Express server started and running on")) {
            onServiceStarted && onServiceStarted();
        }
    });

    serviceProcess.stderr.on("data", (data) => {
        console.log(`stderr: ${data}`);
    });

    return serviceProcess;
};
