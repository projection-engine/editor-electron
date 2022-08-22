import Translation from "../libs/gizmo/Translation"
import Rotation from "../libs/gizmo/Rotation"
import Scale from "../libs/gizmo/Scale"
import TRANSFORMATION_TYPE from "../../../data/misc/TRANSFORMATION_TYPE"
import ShaderInstance from "../../engine/libs/instances/ShaderInstance"
import * as gizmoShaderCode from "../templates/GIZMO.glsl"
import getPickerId from "../../engine/utils/get-picker-id"
import * as shaderCode from "../../engine/data/shaders/PICK.glsl"
import LoopAPI from "../../engine/libs/apis/LoopAPI";
import MeshInstance from "../../engine/libs/instances/MeshInstance";
import PLANE from "../data/PLANE.json";
import Transformations from "../../engine/libs/passes/misc/Transformations";
import getEntityTranslation from "../libs/gizmo/utils/get-entity-translation";
import {mat4} from "gl-matrix";
import EditorRenderer from "../EditorRenderer";
import Gizmo from "../libs/gizmo/libs/Gizmo";
import COMPONENTS from "../../engine/data/COMPONENTS";
import TransformComponent from "../../engine/templates/components/TransformComponent";
import Transformation from "../../engine/services/Transformation";

const EMPTY_COMPONENT = new TransformComponent()
const PICK_ID_SS_GIZMO = [0, 0, 0]
let depthSystem
export default class GizmoSystem {
    static mainEntity
    static transformationMatrix
    static translation
    static targetRotation

    static targetGizmo
    static toBufferShader
    static gizmoShader
    static planeMesh
    static selectedEntities = []

    constructor() {
        EMPTY_COMPONENT.scaling = [.2, .2, .2]
        Transformation.transform(EMPTY_COMPONENT.translation, EMPTY_COMPONENT.rotationQuat, EMPTY_COMPONENT.scaling, EMPTY_COMPONENT.transformationMatrix)

        GizmoSystem.toBufferShader = new ShaderInstance(shaderCode.sameSizeVertex, shaderCode.fragment)
        GizmoSystem.gizmoShader = new ShaderInstance(gizmoShaderCode.vertex, gizmoShaderCode.fragment)
        GizmoSystem.planeMesh = new MeshInstance({
            vertices: PLANE.vertices,
            indices: PLANE.indices,
            uvs: PLANE.uvs
        })


        this.translationGizmo = new Translation()
        this.scaleGizmo = new Scale()
        this.rotationGizmo = new Rotation()

    }

    static drawToDepthSampler(
        mesh,
        view,
        projection,
        transforms,
        camPos,
        translation,
        cameraIsOrthographic
    ) {
        depthSystem.frameBuffer.startMapping()
        GizmoSystem.toBufferShader.use()
        mesh.use()
        gpu.disable(gpu.CULL_FACE)
        for (let i = 0; i < transforms.length; i++) {
            GizmoSystem.toBufferShader.bindForUse({
                viewMatrix: view,
                transformMatrix: transforms[i],
                projectionMatrix: projection,
                uID: [...getPickerId(i + 1), 1.],
                camPos,
                translation,
                cameraIsOrthographic
            })
            gpu.drawElements(gpu.TRIANGLES, mesh.verticesQuantity, gpu.UNSIGNED_INT, 0)
        }
        gpu.enable(gpu.CULL_FACE)
        mesh.finish()
        gpu.bindVertexArray(null)
        depthSystem.frameBuffer.stopMapping()
        return depthSystem.frameBuffer
    }

    #findMainEntity() {
        const main = GizmoSystem.selectedEntities[0]
        if (!GizmoSystem.transformationMatrix || Transformations.hasUpdatedItem || GizmoSystem.mainEntity !== main) {
            GizmoSystem.mainEntity = main
            GizmoSystem.translation = getEntityTranslation(main)

            const t = main.components[COMPONENTS.TRANSFORM]
            GizmoSystem.targetRotation = t !== undefined ? t.rotationQuat : [0, 0, 0, 1]

            GizmoSystem.transformationMatrix = Gizmo.translateMatrix(EMPTY_COMPONENT, GizmoSystem.transformationType)
        }
    }

    #drawSSGizmo() {
        if (!GizmoSystem.transformationMatrix)
            return
        const cube = EditorRenderer.cubeMesh
        gpu.bindVertexArray(cube.VAO)
        gpu.bindBuffer(gpu.ELEMENT_ARRAY_BUFFER, cube.indexVBO)
        cube.vertexVBO.enable()

        GizmoSystem.gizmoShader.use()
        Gizmo.drawGizmo(cube, GizmoSystem.transformationMatrix, 0, PICK_ID_SS_GIZMO, GizmoSystem.translation, 0)

        cube.vertexVBO.disable()
        gpu.bindVertexArray(null)

    }

    execute(transformationType = TRANSFORMATION_TYPE.GLOBAL) {
        if (!depthSystem)
            depthSystem = LoopAPI.renderMap.get("depthPrePass")
        if (GizmoSystem.selectedEntities.length > 0) {
            gpu.clear(gpu.DEPTH_BUFFER_BIT)
            this.#findMainEntity()
            GizmoSystem.transformationType = transformationType
            if (GizmoSystem.targetGizmo)
                GizmoSystem.targetGizmo.execute()
            this.#drawSSGizmo()
        } else if (GizmoSystem.targetGizmo || !GizmoSystem.selectedEntities[0]) {
            GizmoSystem.targetGizmo = undefined
            GizmoSystem.selectedEntities = []
            GizmoSystem.mainEntity = undefined
            GizmoSystem.transformationMatrix = undefined
            GizmoSystem.translation = undefined
        }
    }
}
