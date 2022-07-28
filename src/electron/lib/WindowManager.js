const ROUTES = require("../../static/ROUTES")
const HomeWindow = require("./home-window")
const {FSEvents} = require("../events/file-system/fs-essentials");
const FS = require("../events/file-system/fs-utils")

module.exports = class WindowManager {
    initialized =false
    createWindow() {
        if(!this.initialized){
            FSEvents()
            FS()
            HomeWindow()
            this.initialized = true

        }
    }
}