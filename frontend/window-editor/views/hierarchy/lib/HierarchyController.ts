import Engine from "../../../../../engine-core/Engine";
import SelectionStore from "../../../../shared/stores/SelectionStore";
import Entity from "../../../../../engine-core/instances/Entity";
import ToRenderElement from "../template/ToRenderElement";


export default class HierarchyController {
    static hierarchy: ToRenderElement[] = []
    static #listening: { [key: string]: Function } = {}

    static updateHierarchy() {
        const data: ToRenderElement[] = [], entitiesArray = Engine.entities.array

        const callback = (node: Entity, depth: number) => {
            data.push({node, depth})
            for (let i = 0; i < node.children.length; i++)
                callback(node.children[i], depth + 1)
        }
        for (let i = 0; i < entitiesArray.length; i++) {
            if (entitiesArray[i].parent !== undefined)
                continue
            callback(entitiesArray[i], 0)
        }
        HierarchyController.hierarchy = data
        Object.values(HierarchyController.#listening).forEach(v => v())
    }

    static removeListener(internalID: string) {
        delete HierarchyController.#listening[internalID]
    }

    static registerListener(internalID: string, callback: Function) {
        HierarchyController.#listening[internalID] = callback
        callback()
    }

    static openTree() {
        const node = Engine.entities.map.get(SelectionStore.mainEntity)
        if (!node)
            return {}
        const open = {}

        let target = node
        while (target.parent != null) {
            open[target.id] = true
            target = target.parent
        }
        open[target.id] = true

        Object.values(HierarchyController.#listening).forEach(v => v({...open}))
    }
}