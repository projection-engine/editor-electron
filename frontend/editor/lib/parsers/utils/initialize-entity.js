import COMPONENTS from "../../../../../engine-core/static/COMPONENTS.js";
import Entity from "../../../../../engine-core/instances/Entity";


export default function initializeEntity(data, meshID, parent, index = 0) {
    const entity = new Entity(data?.id, data.name ? data.name : "primitive-" + index)
    try {
        if (parent != null) {
            entity.parent = parent
            parent.children.push(entity)
        }
        entity.changed = true

        for (let i = 0; i < 16; i++)
            entity.baseTransformationMatrix[i] = data.baseTransformationMatrix[i]

        const e = entity.addComponent(COMPONENTS.MESH)
        entity.addComponent(COMPONENTS.CULLING)
        e.materialID = data.material
        e.meshID = meshID
        return entity
    } catch (err) {
        console.error(err)
    }
}