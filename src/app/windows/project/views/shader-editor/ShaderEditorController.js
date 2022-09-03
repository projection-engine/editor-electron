import BOARD_SIZE from "./data/BOARD_SIZE";
import compiler from "./libs/compiler";
import MaterialInstance from "../../libs/engine/production/controllers/instances/MaterialInstance";
import PreviewSystem from "../../libs/engine/editor/services/PreviewSystem";
import AssetAPI from "../../../../libs/files/AssetAPI";
import Localization from "../../../../libs/Localization";
import getNewInstance from "./utils/get-new-instance";
import TextureSample from "./templates/nodes/TextureSample";
import FilesStore from "../../stores/FilesStore";
import {v4} from "uuid";

export default class ShaderEditorController {
    static scale = 1
    static grid = 1
    static copied = new Map()

    static parseNode(node) {
        if (!node)
            return
        const nodeInstance = getNewInstance(node.instance)
        if (!nodeInstance)
            return;
        Object.keys(node).forEach(o => {
            if (o !== "inputs" && o !== "output") {
                if (o === "texture" && nodeInstance instanceof TextureSample) nodeInstance[o] = FilesStore.data.images.find(i => i.registryID === node[o].registryID)
                else {
                    const input = nodeInstance.inputs.find(i => i.key === o)
                    if (input && input.onChange) {
                        nodeInstance[o] = node[o]
                        input.onChange(node[o])
                    } else
                        nodeInstance[o] = node[o]
                }
            }
        })
        nodeInstance.x = node.x + BOARD_SIZE / 2
        nodeInstance.y = node.y + BOARD_SIZE / 2
        return nodeInstance
    }

    static copy(nodes) {
        for(let i = 0; i < nodes.length; i++)
            ShaderEditorController.copied.set(nodes[i].id, ShaderEditorController.#serializeNode(nodes[i]))
    }

    static paste(updateNodes) {
        const newNodes = []
        ShaderEditorController.copied.forEach(d => {
            const parsed= ShaderEditorController.parseNode(d)
            parsed.id = v4()
            newNodes.push(parsed)
        })
        updateNodes(newNodes)
    }

    static #serializeNode(n) {
        const docNode = document.getElementById(n.id).parentNode
        const transformation = docNode
            .getAttribute("transform")
            .replace("translate(", "")
            .replace(")", "")
            .split(" ")

        const bBox = docNode.getBoundingClientRect()
        return {
            ...n,
            x: parseFloat(transformation[0]) - BOARD_SIZE / 2,
            y: parseFloat(transformation[1]) - BOARD_SIZE / 2,
            width: bBox.width,
            height: bBox.height,
            instance: n.constructor.name,
            texture: n.texture && typeof n.texture === "object" ? {registryID: n.texture.registryID} : undefined
        }
    }

    static async compile(nodes, links, isSave) {
        const parsedNodes = nodes.map(ShaderEditorController.#serializeNode)
        const compiled = await compiler(nodes.filter(n => !n.isComment), links)
        let preview
        if (isSave) {
            let material
            await new Promise(resolve => {
                material = new MaterialInstance({
                    vertex: compiled.vertexShader,
                    fragment: compiled.shader,
                    onCompiled: () => resolve(),
                    settings: compiled.settings
                })
            })
            preview = PreviewSystem.execute(material)
        }

        return {compiled, preview, parsedNodes}
    }

    static async save(openFile, nodes, links) {

        const translate = key => Localization.PROJECT.SHADER_EDITOR[key]
        const {compiled, preview, parsedNodes} = await ShaderEditorController.compile(nodes, links, true)
        AssetAPI.updateAsset(
            openFile.registryID,
            JSON.stringify({
                nodes: parsedNodes,
                links: links,
                response: compiled,
                type: compiled.variant
            }),
            preview
        )
            .then(() => alert.pushAlert(translate("SAVED"), "success",))
            .catch(() => alert.pushAlert(translate("ERROR"), "error"))
    }
}