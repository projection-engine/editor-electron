const {BrowserWindow, dialog, ipcMain} = require('electron')
const fs = require('fs')
const path = require('path')

export default function FSEvents() {
    ipcMain.on('fs-read', async (event, data) => {
        const {
            path, options, listenID
        } = data
        const result = await new Promise(resolve => {
            fs.readFile(path, options, (err, res) => resolve([err, res ? res.toString() : undefined]))
        })
        event.sender.send('fs-read-' + listenID, result)
    })

    ipcMain.on('fs-write', async (event, pkg) => {
        const {
            path, data, listenID
        } = pkg
        const result = await new Promise(resolve => {
            fs.writeFile(path, data, (err) => resolve([err]))
        })
        event.sender.send('fs-write-' + listenID, result)
    })


    ipcMain.on('fs-rm', async (event, data) => {
        const {
            path, options, listenID
        } = data
        const result = await new Promise(resolve => {
            fs.rm(path, options, (err) => resolve([err]))
        })
        event.sender.send('fs-rm-' + listenID, result)
    })

    ipcMain.on('fs-mkdir', async (event, data) => {
        const {
            path, listenID
        } = data
        const result = await new Promise(resolve => {
            fs.mkdir(path, (err) => resolve([err]))
        })
        event.sender.send('fs-mkdir-' + listenID, result)
    })

    ipcMain.on('fs-stat', async (event, data) => {
        const {
            path, options, listenID
        } = data
        const result = await new Promise(resolve => {
            fs.stat(path, options, (err, res) => resolve([err, res ? {isDirectory: res.isDirectory()} : undefined]))
        })
        event.sender.send('fs-stat-' + listenID, result)
    })

    ipcMain.on('fs-exists', async (event, data) => {
        const {
            path, listenID
        } = data
        const result = fs.existsSync(path)
        event.sender.send('fs-exists-' + listenID, result)
    })

    ipcMain.on('fs-readdir', async (event, data) => {
        const {
            path, options, listenID
        } = data

        const result = await new Promise(resolve => {
            fs.readdir(path, options, (err, res) => resolve([err, res]))
        })
        event.sender.send('fs-readdir-' + listenID, result)
    })

    ipcMain.on('fs-lstat', async (event, data) => {
        const {
            path, options, listenID
        } = data
        const result = await new Promise(resolve => {
            fs.lstat(path, options, (err, res) => resolve([err, res ? {isDirectory: res.isDirectory()} : undefined]))
        })
        event.sender.send('fs-lstat-' + listenID, result)
    })

    ipcMain.on('fs-rename', async (event, data) => {
        const {
            oldPath, newPath, listenID
        } = data
        const result = await new Promise(resolve => {
            fs.rename(oldPath, newPath, (err) => resolve([err]))
        })
        event.sender.send('fs-rename-' + listenID, result)
    })

}