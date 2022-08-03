import ShaderInstance from "../../engine/libs/instances/ShaderInstance"
import * as shaderCode from "../shaders/SELECTED.glsl"
import COMPONENTS from "../../engine/data/COMPONENTS"
import FramebufferInstance from "../../engine/libs/instances/FramebufferInstance"

export default class SelectedSystem {

    constructor(resolution) {
        this.shaderSilhouette = new ShaderInstance(
            shaderCode.vertexSilhouette,
            shaderCode.fragmentSilhouette
        )
        this.shader = new ShaderInstance(
            shaderCode.vertex,
            shaderCode.fragment
        )

        this.frameBuffer = new FramebufferInstance(resolution.w, resolution.h)
            .texture({
                precision: window.gpu.R16F,
                format: window.gpu.RED,
                type: window.gpu.FLOAT
            })
    }


    execute(selected, meshesMap, camera, entitiesMap) {
        const length = selected.length
        if (length > 0) {
            this.shader.use()
            this.frameBuffer.startMapping()
            for (let m = 0; m < length; m++) {
                const current = entitiesMap.get(selected[m])
                if (!current || !current.active)
                    continue
                const mesh = meshesMap.get(current.components[COMPONENTS.MESH]?.meshID)
                if (!mesh)
                    continue
                const t = current.components[COMPONENTS.TRANSFORM]
                this.drawMesh(
                    mesh,
                    camera.viewMatrix,
                    camera.projectionMatrix,
                    t.transformationMatrix
                )
            }
            this.frameBuffer.stopMapping()


            this.shaderSilhouette.use()
            this.shaderSilhouette.bindForUse({
                silhouette: this.frameBuffer.colors[0]
            })
            this.frameBuffer.draw()

            window.gpu.bindVertexArray(null)
        }
    }

    drawMesh(
        mesh,
        viewMatrix,
        projectionMatrix,
        transformMatrix
    ) {
        mesh.use()
        this.shader.bindForUse({
            projectionMatrix,
            transformMatrix,
            viewMatrix
        })

        window.gpu.drawElements(window.gpu.TRIANGLES, mesh.verticesQuantity, window.gpu.UNSIGNED_INT, 0)
        mesh.finish()
    }
}