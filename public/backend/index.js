import fileSystem from "shared-resources/backend/file-system"

const {app, BrowserWindow} = require('electron');
const isDev = require('electron-is-dev');
const os = require("os");
const path = require("path");
const buildProjectWindow = require("./libs/build-project-window");


app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer');


async function createEnvironment() {
    fileSystem()
    let pathToProject
    if (isDev)
        pathToProject = os.homedir() + path.sep + "SAMPLE" + path.sep + ".projection"
    else
        pathToProject = process.env.PROJECT_TO_OPEN
    if (!pathToProject)
        app.quit()

    const result = await buildProjectWindow(pathToProject, isDev)
    if (!result)
        app.quit()
}

app.on('ready', () => createEnvironment());
app.on('window-all-closed', async () => {

    if (process.platform !== 'darwin')
        app.quit();
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0)
        createEnvironment().catch()
});
