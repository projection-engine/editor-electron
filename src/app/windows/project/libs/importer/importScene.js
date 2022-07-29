import Entity from "../engine/basic/Entity"
import COMPONENTS from "../engine/data/COMPONENTS"
import FolderComponent from "../engine/components/FolderComponent"
import {initializeEntity} from "./importMesh"
import MeshInstance from "../engine/instances/MeshInstance"
import {ENTITY_ACTIONS} from "../engine-extension/entityReducer"
import FileSystem from "../FileSystem"
import {vec4} from "gl-matrix"
import DataStoreController from "../../stores/DataStoreController";
import FileStoreController from "../../stores/FileStoreController";

export default async function importScene(reg, onlyReturn) {
    const file = await window.fileSystem.readFile(
        FileStoreController.ASSETS_PATH+ FileSystem.sep + reg.path, "json")
    console.trace(reg)

    const meshes = []
    const entities = []
    const engineCopy = {...DataStoreController.engine}

    if (file) {
        const folder = new Entity()
        folder.name = file.name
        folder.components[COMPONENTS.FOLDER] = new FolderComponent()
        for (let i in file.nodes) {
            const data = await loopNodes(file.nodes[i], folder)
            meshes.push(...data.meshes)
            entities.push(...data.children)
        }
        entities.push(folder)
        if(!onlyReturn) {
            const cursorPoint = window.renderer.cursor.components[COMPONENTS.TRANSFORM].translation
            entities.forEach(e => {
                if (e.components && e.components[COMPONENTS.TRANSFORM]) {
                    const transform = e.components[COMPONENTS.TRANSFORM]
                    vec4.add(transform.translation, transform.translation, cursorPoint)
                    console.dir(transform.translation)
                    transform.changed = true
                }
            })

            for(let i =0; i < meshes.length; i++)
                engineCopy.meshes.set(meshes[i].id, meshes[i])
            engineCopy.dispatchEntities({type: ENTITY_ACTIONS.PUSH_BLOCK, payload: entities}, engineCopy)
        }
    } else
        alert.pushAlert("Some error occurred",  "error")
    return {meshes, entities}
}

async function loopNodes(node, parent) {
    const meshes = [], children = []


    const entity = new Entity(node.id)
    entity.name = node.name
    entity.parent = parent
    parent.children.push(entity)
    entity.components[COMPONENTS.FOLDER] = new FolderComponent()
    for (let m in node.primitives) {
        const primitive = node.primitives[m]
        const reg = await window.fileSystem.readRegistryFile(primitive)
        if (reg) {
            const meshData = await window.fileSystem.readFile(window.fileSystem.path + FileSystem.sep + "assets" + FileSystem.sep + reg.path, "json")

            const instance = new MeshInstance({
                ...meshData,
                id: reg.id
            })
            meshes.push(instance)
            children.push(initializeEntity(meshData, instance.id, entity))
        }
    }
    children.push(entity)

    for (let i in node.children) {
        const data = await loopNodes(node.children[i], entity)
        meshes.push(...data.meshes)
        children.push(...data.children)
    }

    return {meshes, children}
}