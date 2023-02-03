import FilesStore from "../../../../shared/stores/FilesStore";
import componentConstructor from "../../../utils/component-constructor";
import COMPONENTS from "../../../../../engine-core/static/COMPONENTS";
import Loader from "../../../lib/parsers/Loader";
import EngineStore from "../../../../shared/stores/EngineStore";
import AlertController from "../../../../shared/components/alert/AlertController";
import LOCALIZATION_EN from "../../../../shared/static/LOCALIZATION_EN";

export default async function handleComponentDrop(entity, data) {
    try {
        const id = JSON.parse(data)[0]
        let type = "SCRIPT"
        let itemFound = FilesStore.data.components.find(s => s.registryID === id)

        if (!itemFound) {
            itemFound = FilesStore.data.meshes.find(s => s.registryID === id)
            type = "MESH"
        }
        if (!itemFound) {
            itemFound = FilesStore.data.textures.find(s => s.registryID === id)
            type = "IMAGE"
        }
        if (!itemFound) {
            itemFound = FilesStore.data.materials.find(s => s.registryID === id)
            type = "MATERIAL"
        }

        if (!itemFound)
            throw new Error("File not found")

        switch (type) {
            case "SCRIPT":
                await componentConstructor(entity, id, true)

                break
            case "MESH":
                if (!entity.meshComponent) {
                    entity.addComponent(COMPONENTS.MESH)
                    entity.addComponent(COMPONENTS.CULLING)
                }

                await Loader.load(id, true)
                entity.meshComponent.meshID = id
                break
            case "MATERIAL": {
                entity.meshComponent.materialID = id
                break
            }
            case "IMAGE": {
                const res = await EngineStore.loadTextureFromImageID(id)
                if (res)
                    (entity.addComponent(COMPONENTS.SPRITE)).imageID = res

                break
            }
            default:
                break
        }
    } catch (err) {
        console.error(err)
        AlertController.error(LOCALIZATION_EN.FILE_NOT_FOUND)
    }

}