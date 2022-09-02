import NodeFS from "../../../../../libs/NodeFS"
import FilesAPI from "../../../../../libs/files/FilesAPI"
import FilesStore from "../../../stores/FilesStore";
import RegistryAPI from "../../../../../libs/files/RegistryAPI";
import ContentBrowserAPI from "../../../../../libs/files/ContentBrowserAPI";

const pathResolve = window.require("path")
export default async function handleDropFolder(event, target, currentDirectory, setCurrentDirectory) {
    let items = []
    if (Array.isArray(event))
        items = event
    else
        try {
            items = JSON.parse(event)
        } catch (e) {
            alert.pushAlert("Error moving file", "error")
        }

    for (let i = 0; i < items.length; i++) {
        const textData = items[i]
        if (target !== FilesAPI.sep) {
            let from = textData
            if (!from.includes(FilesAPI.sep)) {

                const reg = await RegistryAPI.readRegistryFile(from)

                if (reg) from = reg.path
                else {
                    alert.pushAlert("Could not find file.", "error")
                    return
                }

            }
            const to = target + FilesAPI.sep + from.split(FilesAPI.sep).pop()

            const toItem = items.find(f => f.id === target)
            const fromItem = items.find(f => {
                return f.id === from || (f.registryID === textData && f.registryID !== undefined)
            })
            if (from !== to && toItem && toItem.id !== from && fromItem && fromItem.parent !== to && toItem.isFolder) {
                ContentBrowserAPI.rename(pathResolve.resolve(FilesStore.ASSETS_PATH + FilesAPI.sep + from), pathResolve.resolve(FilesStore.ASSETS_PATH + to))
                    .then(() => {
                        if (from === currentDirectory.id) setCurrentDirectory({id: to})

                        FilesStore.refreshFiles().catch()
                    })
            }
        } else if (textData.includes(FilesAPI.sep)) {
            const newPath = FilesStore.ASSETS_PATH + FilesAPI.sep + textData.split(FilesAPI.sep).pop()
            if (!(await NodeFS.exists(newPath))) ContentBrowserAPI
                .rename(pathResolve.resolve(FilesStore.ASSETS_PATH + FilesAPI.sep + textData), pathResolve.resolve(newPath))
                .then(() => {
                    if (textData === currentDirectory.id) setCurrentDirectory({id: newPath.replace(FilesStore.ASSETS_PATH, "")})
                    FilesStore.refreshFiles().catch()
                })
            else alert.pushAlert(
                "Folder already exists.", "error"
            )
        }

    }
}