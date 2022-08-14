const ROUTES = require("../../assets/ROUTES")
const HomeWindow = require("./home-window")
const {FSEvents} = require("../events/file-system/fs-essentials");
const FS = require("../events/file-system/fs-utils")
const reload = require("electron-reload");
const path = require("path");

module.exports = class WindowManager {

    initialized =false
    createWindow() {
        if(!this.initialized){
            reload(__dirname, {
                electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),
                awaitWriteFinish: true
            });
            FSEvents()
            FS()
            HomeWindow()
            this.initialized = true
        }
    }
}