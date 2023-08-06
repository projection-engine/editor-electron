import GPU from "../../GPU"
import GPUAPI from "./GPUAPI"

import FileSystemAPI from "../utils/FileSystemAPI"
import Material from "../../instances/Material"
import {MaterialDataTypes} from "@engine-core/engine.enum";

export default class MaterialAPI {
    static #generator?: Generator<number>

    static* #getIncrementalID() {
        let counter = 0
        while (true) {
            yield counter
            counter++
        }
    }

    static registerMaterial(material) {
        if (material.bindID > -1)
            return
        if (!MaterialAPI.#generator)
            MaterialAPI.#generator = MaterialAPI.#getIncrementalID()
        material.bindID = MaterialAPI.#generator.next().value
    }

    static async updateMaterialUniforms(material: Material) {
        const data = material.uniforms
        if (!Array.isArray(data))
            return
        await MaterialAPI.mapUniforms(data, material.uniformValues)
    }

    static async mapUniforms(data: MaterialUniform[], uniformValues: MutableObject) {
        if (!Array.isArray(data))
            return
        const texturesInUse = {}
        Object.keys(uniformValues).forEach((key) => delete uniformValues[key])

        for (let i = 0; i < data.length; i++) {
            const currentUniform = data[i]
            if (currentUniform.type === MaterialDataTypes.TEXTURE) {
                const textureID = currentUniform.data
                if (texturesInUse[textureID] || !FileSystemAPI.isReady)
                    continue
                try {
                    const exists = GPU.textures.get(textureID)
                    if (exists) {
                        texturesInUse[textureID] = {texture: exists, key: currentUniform.key}
                        uniformValues[currentUniform.key] = exists
                    } else {
                        const asset = await FileSystemAPI.readAsset(textureID)
                        if (asset) {
                            const textureData = <TextureParams>(typeof asset === "string" ? JSON.parse(asset) : asset)
                            const texture = await GPUAPI.allocateTexture({
                                ...textureData,
                                img: textureData.base64
                            }, textureID)

                            if (texture) {
                                texturesInUse[textureID] = {texture, key: currentUniform.key}
                                uniformValues[currentUniform.key] = texture
                            }
                        }
                    }
                } catch (error) {
                    console.error(error)
                }
            } else
                uniformValues[currentUniform.key] = currentUniform.data
        }
    }

}
