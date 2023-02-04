import FilesStore from "../../../../shared/stores/FilesStore";
import ContentBrowserAPI from "../../../lib/fs/ContentBrowserAPI";
import FS from "../../../../shared/lib/FS/FS";

export default async function handleRename(item, newName, currentDirectory, setCurrentDirectory) {
    if (newName === item.name)
        return

    if (item.isFolder) {
        const newNamePath = (item.parent ? item.parent + FS.sep + newName : FS.sep + newName)
        await ContentBrowserAPI.rename(FS.ASSETS_PATH + item.id, FS.ASSETS_PATH + newNamePath)
        await FilesStore.refreshFiles().catch()
        if (item.id === currentDirectory.id)
            setCurrentDirectory({id: newNamePath})
        return
    }

    const nameToApply = newName + "." + item.type
    const targetPath = FS.resolvePath(FS.ASSETS_PATH + (item.parent ? item.parent + FS.sep : FS.sep) + nameToApply)

    if (FS.exists(targetPath))
        return

    await ContentBrowserAPI.rename(FS.ASSETS_PATH + item.id, targetPath)
    await FilesStore.refreshFiles().catch()
}