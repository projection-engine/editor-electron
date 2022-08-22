import ShaderInstance from "../../engine/libs/instances/ShaderInstance"
import * as shaderCode from "../templates/SELECTED.glsl"
import COMPONENTS from "../../engine/data/COMPONENTS"
import FramebufferInstance from "../../engine/libs/instances/FramebufferInstance"
import RendererController from "../../engine/RendererController";
import CameraAPI from "../../engine/libs/apis/CameraAPI";
import Gizmo from "../libs/gizmo/libs/Gizmo";
import getEntityTranslation from "../libs/gizmo/utils/get-entity-translation";
import Transformations from "../../engine/libs/passes/misc/Transformations";
import GizmoSystem from "./GizmoSystem";
import {mat4} from "gl-matrix";
import EditorRenderer from "../EditorRenderer";



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
        const TEXTURE = {
            precision: gpu.R16F,
            format: gpu.RED,
            type: gpu.FLOAT
        }
        this.frameBuffer = new FramebufferInstance(resolution.w, resolution.h).texture(TEXTURE)
    }

    drawToBuffer(selected) {
        const length = selected.length
        if (length === 0)
            return
        gpu.disable(gpu.DEPTH_TEST)
        this.shader.use()
        this.frameBuffer.startMapping()
        for (let m = 0; m < length; m++) {
            const current = RendererController.entitiesMap.get(selected[m])
            if (!current || !current.active)
                continue
            const mesh = RendererController.meshes.get(current.components[COMPONENTS.MESH]?.meshID)
            if (!mesh)
                continue
            const t = current.components[COMPONENTS.TRANSFORM]
            gpu.bindVertexArray(mesh.VAO)
            gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, mesh.indexVBO)

            mesh.vertexVBO.enable()
            this.shader.bindForUse({
                projectionMatrix: CameraAPI.projectionMatrix,
                transformMatrix: t.transformationMatrix,
                viewMatrix: CameraAPI.viewMatrix
            })

            gpu.drawElements(gpu.TRIANGLES, mesh.verticesQuantity, gpu.UNSIGNED_INT, 0)
        }
        this.frameBuffer.stopMapping()
        gpu.bindVertexArray(null)
        gpu.enable(gpu.DEPTH_TEST)
    }

    drawSilhouette(selected) {
        const length = selected.length
        if (length > 0) {
            this.shaderSilhouette.use()
            this.shaderSilhouette.bindForUse({
                silhouette: this.frameBuffer.colors[0]
            })
            this.frameBuffer.draw()
            gpu.bindVertexArray(null)
        }
    }
}