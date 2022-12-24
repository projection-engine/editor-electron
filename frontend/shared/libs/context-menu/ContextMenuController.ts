import ContextMenuOption from "./templates/ContextMenuOptions";
import findOptions from "./utils/find-options";
import buildOptions from "./utils/build-options";
import MappedOption from "./templates/MappedOption";
import ContextMenuTarget from "./templates/ContextMenuTarget";
import MutableObject from "../../../../engine-core/MutableObject";

const {ipcRenderer} = window.require("electron")

export default class ContextMenuController {
    static data:{targets: {[key:string]:ContextMenuTarget}, focused?:string} = {targets: {}, focused: undefined}
    static #initialized = false

    static mount(metadata:MutableObject, options:ContextMenuOption[], target:string, triggers?:string[], onFocus?:Function) {
        if (!ContextMenuController.#initialized) {
            ipcRenderer.on("context-menu", (ev, {id, group}) => {
                const groupData = ContextMenuController.data.targets[group]
                if (!groupData)
                    return
                groupData.options.forEach(o => findOptions(o, id, group))
            })
            ContextMenuController.#initialized = true
        }

        const template = buildOptions(options, target)
        ipcRenderer.send("REGISTER_CONTEXT_MENU", {
            id: target,
            template
        })

        ContextMenuController.data.targets[target] = {
            id: target,
            options,
            triggers: triggers||[],
            onFocus,
            metadata,
            template
        }
    }

    static destroy(target:string) {
        ipcRenderer.send("DESTROY_CONTEXT_MENU", target)
        const old = ContextMenuController.data.targets[target]
        if (!old)
            return
        delete ContextMenuController.data.targets[target]
    }
}