const {BrowserWindow, ipcMain} = require("electron")
const Window = require("./EntryPointController")
const FRAME_EVENTS = require("../../data/FRAME_EVENTS")
const path = require("path");
const ROUTES = require("../../data/ROUTES");
const {v4} = require("uuid");

const windowLifeCycle = require("../utils/window-life-cycle");
const RELATIVE_LOGO_PATH = "../../data/logo.png"
const {screen} = require('electron')

module.exports = function settingsWindow(windowID, parent, settingsData) {
    const internalID = v4() + windowID
    const primaryDisplay = screen.getPrimaryDisplay()
    const {width, height} = primaryDisplay.workAreaSize
    const window = new BrowserWindow({
        minWidth: Math.max(width / 6, 500),
        minHeight: Math.max(height / 6, 750),
        frame: false,

        parent: parent,
        webPreferences: {
            webSecurity: false,
            enableRemoteModule: true,
            nodeIntegration: true,
            contextIsolation: false,
            nativeWindowOpen: true,
            nodeIntegrationInWorker: true,
        },
        autoHideMenuBar: true,
        icon: path.resolve(__dirname, RELATIVE_LOGO_PATH),

    });


    windowLifeCycle(
        internalID,
        window,
        () => {
            window.close()
        },
        () => window.loadFile(Window.settings).catch(err => console.error(err))
    )

    ipcMain.on(ROUTES.LOAD_SETTINGS + internalID, async event => {

        event.sender.send(ROUTES.LOAD_SETTINGS + internalID, settingsData)
    })

    ipcMain.on(ROUTES.UPDATE_SETTINGS + internalID, (event, data) => {
        parent.send(ROUTES.UPDATE_SETTINGS + windowID, data)
    })
}