import directoryStructure from "../utils/directory-structure"
import readdir from "../utils/readdir"
import rm from "../utils/rm"
import readFile from "../utils/read-file"

import {ipcMain,} from "electron"

import * as pathRequire from "path"
import * as fs from "fs"
import FileTypes from "../../shared/FileTypes";
import IPCRoutes from "../../shared/IPCRoutes";
import AbstractSingleton from "../../shared/AbstractSingleton";

export default class FileSystemListener extends AbstractSingleton {

    #watchSignals = []
    #filesToWatch = []

    constructor() {
        super();
        ipcMain.on(IPCRoutes.FS_WATCH, this.#watch)
        ipcMain.on(IPCRoutes.FS_UPDATE_WATCH, this.#updateWatch)
        ipcMain.on(IPCRoutes.FS_UNWATCH, this.#unwatch)
        ipcMain.on(IPCRoutes.FS_READ, this.#read)
        ipcMain.on(IPCRoutes.FS_WRITE, this.#write)
        ipcMain.on(IPCRoutes.FS_RM, this.#rm)
        ipcMain.on(IPCRoutes.FS_MKDIR, this.#mkdir)
        ipcMain.on(IPCRoutes.FS_STAT, this.#stat)
        ipcMain.on(IPCRoutes.FS_EXISTS, this.#exists)
        ipcMain.on(IPCRoutes.FS_READDIR, this.#readdir)
        ipcMain.on(IPCRoutes.FS_RENAME, this.#rename)
    }

    async #watch(ev, path) {
        if (this.#watchSignals.length > 0)
            await this.#unwatch()
        this.#filesToWatch = await directoryStructure(path)
        for (let i = 0; i < this.#filesToWatch.length; i++) {
            const file = this.#filesToWatch[i]
            if (!file.includes(FileTypes.UI_LAYOUT) && !file.includes(FileTypes.COMPONENT))
                continue
            this.#watchSignals.push(fs.watch(file, (event) => {
                if (event === "change")
                    ev.sender.send(IPCRoutes.FS_WATCH, file)
            }))
        }
    }

    async #updateWatch(ev, path) {
        this.#filesToWatch = await directoryStructure(path)
    }

    async #unwatch() {
        for (let i = 0; i < this.#watchSignals.length; i++) {
            const signal = this.#watchSignals[i]
            if (signal)
                signal.close()
        }
        this.#watchSignals = []
    }

    async #read(event, data) {
        const {path, options, listenID} = data
        const result = await readFile(path, options)
        event.sender.send(IPCRoutes.FS_READ + listenID, result[1])
    }

    async #write(event, {path, data, listenID}) {
        let error
        try {
            await fs.promises.writeFile(pathRequire.resolve(path), data)
        } catch (err) {
            error = err
        }
        event.sender.send(IPCRoutes.FS_WRITE + listenID, error)
    }

    async #rm(event, data) {
        const {
            path, options, listenID
        } = data
        const result = await rm(path, options)
        event.sender.send(IPCRoutes.FS_RM + listenID, result[0])
    }

    async #mkdir(event, {path, listenID}) {

        let error
        try {
            await fs.promises.mkdir(pathRequire.resolve(path))
        } catch (err) {
            error = err
        }
        event.sender.send(IPCRoutes.FS_MKDIR + listenID, error)
    }

    async #stat(event, data) {
        const {path, options, listenID} = data
        const result = await new Promise(resolve => {
            fs.stat(pathRequire.resolve(path), options, (err, res) => resolve(res ? {isDirectory: res.isDirectory(), ...res} : undefined))
        })
        event.sender.send(IPCRoutes.FS_STAT + listenID, result)
    }

    async #exists(event, data) {
        const {
            path, listenID
        } = data
        const result = fs.existsSync(pathRequire.resolve(path))
        event.sender.send(IPCRoutes.FS_EXISTS + listenID, result)
    }

    async #readdir(event, data) {
        const {
            path, options, listenID
        } = data

        const result = await readdir(path, options)
        event.sender.send(IPCRoutes.FS_READDIR + listenID, result[1])
    }

    async #rename(event, data) {
        const {oldPath, newPath, listenID} = data
        let result
        try {
            await fs.promises.rename(pathRequire.resolve(oldPath), pathRequire.resolve(newPath))
        } catch (err) {
            result = err
        }
        event.sender.send(IPCRoutes.FS_RENAME + listenID, result)
    }
}

