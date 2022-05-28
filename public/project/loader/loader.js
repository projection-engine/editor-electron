import COMPONENTS from "../../../src/project/engine/templates/COMPONENTS";
import FILE_TYPES from "../glTF/FILE_TYPES";
import loadScripts from "./loadScripts";
import loadMeshes from "./loadMeshes";
import loadMaterials from "./loadMaterials";
import {readFile} from "../../events/FSEvents";
import loadData from "./loadData";
import cleanUpRegistry from "./cleanUp";
import CHANNELS from "./CHANNELS";

const {ipcMain} = require('electron')
export default async function loader(projectPath, projectID, listenID, sender) {
    await cleanUpRegistry(projectPath)
    const {settings, meta, entities} = await loadData(projectPath)
    sender.send(CHANNELS.META_DATA + '-' + listenID, {
        meta,
        settings,
        entities
    })

    let meshes = [...new Set(entities.filter(e => e.data.components[COMPONENTS.MESH]).map(e => e.data.components[COMPONENTS.MESH].meshID))],
        materials = [...new Set(entities.map(e => e.data.components[COMPONENTS.MATERIAL]?.materialID).filter(e => e !== undefined))],
        scripts = entities.map(e => {
            const comp = e.data.components[COMPONENTS.SCRIPT]
            if (comp) {
                if (comp.registryID) return comp.registryID
                return comp.scripts
            } else return e.data.blueprintID
        }).filter(e => e !== undefined),
        toLoadScripts = [...new Set(scripts.flat())],
        scriptsToLoad = (await loadScripts(toLoadScripts, entities.length, true, projectPath)).filter(e => e !== undefined),

        levelBlueprint = (await readFile(projectPath + '\\levelBlueprint' + FILE_TYPES.SCRIPT))[1]
    if (levelBlueprint) {
        levelBlueprint = JSON.parse(levelBlueprint)
        scriptsToLoad.push({
            script: {
                id: projectID,
                executors: levelBlueprint.response,
                name: levelBlueprint.name
            }
        })
    }

    sender.send(CHANNELS.SCRIPTS + '-' + listenID, scriptsToLoad)
    loadMeshes(meshes, projectPath, (data) => sender.send(CHANNELS.MESH + '-' + listenID, data)).catch()
    loadMaterials(materials, projectPath, (data) => sender.send(CHANNELS.MATERIAL + '-' + listenID, data)).catch()

}