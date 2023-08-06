import GPU from "../GPU"
import StaticFBO from "../lib/StaticFBO"
import StaticShaders from "../lib/StaticShaders"
import ResourceEntityMapper from "../resource-libs/ResourceEntityMapper"
import MATERIAL_RENDERING_TYPES from "../static/MATERIAL_RENDERING_TYPES"
import MetricsController from "../lib/utils/MetricsController"
import METRICS_FLAGS from "../static/METRICS_FLAGS"
import AbstractSystem from "../AbstractSystem";
import EngineState from "../EngineState";
import {Components} from "@engine-core/engine.enum";
import EntityManager from "@engine-core/EntityManager";
import MeshComponent from "@engine-core/components/MeshComponent";
import TransformationComponent from "@engine-core/components/TransformationComponent";
import LightComponent from "@engine-core/components/LightComponent";


export default class DShadowsSystem extends AbstractSystem {
    shouldExecute(): boolean {
        return EngineState.directionalLightsChanged || EngineState.directionalLightsToUpdate.length > 0;
    }

    execute() {
        const context = GPU.context
        context.cullFace(context.FRONT)
        let currentColumn = 0, currentRow = 0
        StaticFBO.shadows.startMapping()
        context.enable(context.SCISSOR_TEST)
        const size = EngineState.directionalLightsAtlasRatio ** 2
        const resPr = EngineState.directionalLightsResolutionPerTexture
        for (let face = 0; face < size; face++) {
            if (face < EngineState.directionalLightsToUpdate.length) {
                const currentLight = EngineState.directionalLightsToUpdate[face]

                context.viewport(
                    currentColumn * resPr,
                    currentRow * resPr,
                    resPr,
                    resPr
                )
                context.scissor(
                    currentColumn * resPr,
                    currentRow * resPr,
                    resPr,
                    resPr
                )

                currentLight.atlasFace = [currentColumn, 0]
                this.#loopMeshes(currentLight)
            }
            if (currentColumn > EngineState.directionalLightsAtlasRatio) {
                currentColumn = 0
                currentRow += 1
            } else
                currentColumn += 1
        }
        context.disable(context.SCISSOR_TEST)
        StaticFBO.shadows.stopMapping()
        context.cullFace(context.BACK)
        EngineState.directionalLightsChanged = false
        EngineState.directionalLightsToUpdate.length = 0
        MetricsController.currentState = METRICS_FLAGS.DIRECTIONAL_SHADOWS
    }

    #loopMeshes(light: LightComponent) {
        const context = GPU.context
        const toRender = ResourceEntityMapper.withComponent(Components.MESH).array
        const size = toRender.length
        for (let m = 0; m < size; m++) {
            const current = toRender[m]
            const components = EntityManager.getAllComponentsMap(current)
            const meshComponent = components.get(Components.MESH) as MeshComponent
            const mesh = !meshComponent.meshID ? undefined : GPU.meshes.get(meshComponent.meshID)
            const material = !meshComponent.materialID ? undefined : GPU.materials.get(meshComponent.materialID)
            if (!mesh || !meshComponent.castsShadows || !EntityManager.isEntityEnabled(current) || material && material.renderingMode === MATERIAL_RENDERING_TYPES.SKY)
                continue
            const transformation = components.get(Components.TRANSFORMATION) as TransformationComponent
            StaticShaders.directShadows.bind()
            const U = StaticShaders.directShadowsUniforms

            context.uniformMatrix4fv(U.viewMatrix, false, light.__lightView)
            context.uniformMatrix4fv(U.transformMatrix, false, transformation.matrix)
            context.uniformMatrix4fv(U.projectionMatrix, false, light.__lightProjection)

            mesh.draw()
        }
    }

}
