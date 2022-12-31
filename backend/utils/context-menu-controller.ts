import ProjectController from "../libs/ProjectController";

const {BrowserWindow, app, ipcMain, webContents, dialog, Menu, } = require("electron")
function mapMenu( e, parent) {
    return Array.isArray(e.submenu) ? e.submenu.map(s => {
        if (s.id == null)
            return s
        const newData = {...s}
        if (Array.isArray(s.submenu))
            newData.submenu = mapMenu(s, parent)
        else
            newData.click = () => ProjectController.window.webContents.send("context-menu", {id: s.id, group: parent})

        return newData
    }) : undefined
}

export default function contextMenuController() {
    this.menus = new Map()
    ipcMain.on(
        "REGISTER_CONTEXT_MENU",
        (event, data) => {
            const {template, id} = data

            if (this.menus.get(id) != null)
                return
            const mapped = template.map(e => {
                if (e.submenu)
                    return {...e, submenu: mapMenu( e, id)}
                if (e.id)
                    return {...e, click: () => ProjectController.window.webContents.send("context-menu", {id: e.id, group: id})}
                return e
            })
            const menu = Menu.buildFromTemplate(mapped)
            this.menus.set(id, menu)
        }
    )
    ipcMain.on(
        "DESTROY_CONTEXT_MENU",
        (event, id) => {
            const context = this.menus.get(id)
            if (!context)
                return
            this.menus.delete(id)
        }
    )

    ipcMain.on(
        "OPEN_CONTEXT_MENU",
        (event, contextID) => {
            const context = this.menus.get(contextID)
            if (context)
                context.popup()
        }
    )
}