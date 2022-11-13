import TranslationGizmo from "../lib/transformation/TranslationGizmo"
import RotationGizmo from "../lib/transformation/RotationGizmo"
import ScalingGizmo from "../lib/transformation/ScalingGizmo"
import TRANSFORMATION_TYPE from "../../../static/TRANSFORMATION_TYPE"
import getPickerId from "../../../../public/engine/utils/get-picker-id"
import GizmoAPI from "../lib/GizmoAPI";
import Movable from "../../../../public/engine/instances/Movable";
import TransformationAPI from "../../../../public/engine/lib/math/TransformationAPI";
import CameraAPI from "../../../../public/engine/lib/utils/CameraAPI";
import ScreenSpaceGizmo from "../lib/transformation/ScreenSpaceGizmo";
import DualAxisGizmo from "../lib/transformation/DualAxisGizmo";
import GPU from "../../../../public/engine/GPU";
import STATIC_MESHES from "../../../../public/engine/static/resources/STATIC_MESHES";
import STATIC_SHADERS from "../../../../public/engine/static/resources/STATIC_SHADERS";
import TransformationPass from "../../../../public/engine/runtime/misc/TransformationPass";
import AXIS from "../static/AXIS";
import LineAPI from "../../../../public/engine/lib/rendering/LineAPI";
import {mat4, vec3} from "gl-matrix";
import IconsSystem from "./IconsSystem";
import GBuffer from "../../../../public/engine/runtime/rendering/GBuffer";
import Wrapper from "../Wrapper";

const VEC_CACHE = vec3.create()
const M = mat4.create()
const EMPTY_COMPONENT = new Movable()
export default class GizmoSystem {
    static mainEntity
    static transformationMatrix
    static translation
    static onStart
    static onStop
    static targetRotation
    static targetGizmo
    static toBufferShader
    static gizmoShader
    static selectedEntities = []
    static clickedAxis
    static sensitivity = .001
    static hasStarted = false
    static _wasOnGizmo = false
    static get wasOnGizmo() {
        return GizmoSystem._wasOnGizmo
    }

    static set wasOnGizmo(data) {
        GizmoSystem._wasOnGizmo = data
        if (data)
            GizmoSystem.onStart?.()
        else
            GizmoSystem.onStop?.()
    }

    static rotationGizmoMesh
    static scaleGizmoMesh
    static translationGizmoMesh
    static dualAxisGizmoMesh
    static screenSpaceMesh
    static tooltip
    static translationGizmo
    static scaleGizmo
    static rotationGizmo
    static lineShader
    static EMPTY_COMPONENT = EMPTY_COMPONENT
    static transformationType = TRANSFORMATION_TYPE.GLOBAL
    static activeGizmoMatrix = M
    static save

    static initialize() {
        GizmoSystem.screenSpaceMesh = GPU.meshes.get(STATIC_MESHES.PRODUCTION.SPHERE)
        GizmoSystem.dualAxisGizmoMesh = GPU.meshes.get(STATIC_MESHES.EDITOR.DUAL_AXIS_GIZMO)
        GizmoSystem.translationGizmoMesh = GPU.meshes.get(STATIC_MESHES.EDITOR.TRANSLATION_GIZMO)
        GizmoSystem.rotationGizmoMesh = GPU.meshes.get(STATIC_MESHES.EDITOR.ROTATION_GIZMO)
        GizmoSystem.scaleGizmoMesh = GPU.meshes.get(STATIC_MESHES.EDITOR.SCALE_GIZMO)

        EMPTY_COMPONENT._scaling[0] = .2
        EMPTY_COMPONENT._scaling[1] = .2
        EMPTY_COMPONENT._scaling[2] = .2

        TransformationAPI.transformMovable(EMPTY_COMPONENT)

        GizmoSystem.lineShader = GPU.shaders.get(STATIC_SHADERS.DEVELOPMENT.LINE)
        GizmoSystem.toBufferShader = GPU.shaders.get(STATIC_SHADERS.DEVELOPMENT.TO_BUFFER)
        GizmoSystem.gizmoShader = GPU.shaders.get(STATIC_SHADERS.DEVELOPMENT.GIZMO)
        GizmoSystem.translationGizmo = new TranslationGizmo()
        GizmoSystem.scaleGizmo = new ScalingGizmo()
        GizmoSystem.rotationGizmo = new RotationGizmo()
    }

    static drawToDepthSampler(mesh, transforms) {
        const FBO = GBuffer.gBuffer
        const data = {
            translation: GizmoSystem.mainEntity.pivotPoint,
            cameraIsOrthographic: CameraAPI.isOrthographic
        }
        gpu.disable(gpu.CULL_FACE)
        FBO.startMapping()

        for (let i = 0; i < transforms.length; i++) {
            GizmoSystem.toBufferShader.bindForUse({
                ...data,
                transformMatrix: transforms[i],
                uID: getPickerId(i + 2),
            })
            mesh.draw()
        }

        GizmoSystem.toBufferShader.bindForUse({
            ...data,
            transformMatrix: GizmoSystem.mainEntity.__cacheCenterMatrix,
            uID: getPickerId(1)
        })
        GizmoSystem.screenSpaceMesh.draw()

        DualAxisGizmo.drawToBuffer(data)
        FBO.stopMapping()

        gpu.enable(gpu.CULL_FACE)
    }

    static #findMainEntity(main) {
        if (main && main === GizmoSystem.mainEntity)
            return

        if (!main) {
            GizmoSystem.targetGizmo = undefined
            GizmoSystem.mainEntity = undefined

        } else if (GizmoSystem.mainEntity !== main && GizmoSystem.targetGizmo) {

            main.__pivotChanged = true
            GizmoSystem.mainEntity = main
            GizmoSystem.targetGizmo.transformGizmo()
            GizmoSystem.targetRotation = main._rotationQuat
        }
    }



    static execute() {
        const selected = Wrapper.selected
        const valid = selected.length > 0

        if (valid)
            GizmoSystem.#findMainEntity(selected[0])
        if (valid && GizmoSystem.mainEntity != null) {
            const m = GizmoSystem.mainEntity
            if (m.__changedBuffer[1] === 1 || m.__pivotChanged) {
                IconsSystem.getMatrix(m)
                GizmoSystem.targetGizmo.transformGizmo()
                m.__pivotChanged = false
            }
            const t = GizmoSystem.targetGizmo
            GizmoSystem.#findMainEntity(selected[0])
            if (t) {
                t.drawGizmo()
                ScreenSpaceGizmo.drawGizmo()
            }
            if (t instanceof TranslationGizmo) {
                const c = GizmoSystem.clickedAxis
                const o = {transformMatrix: GizmoSystem.activeGizmoMatrix}
                if (c === AXIS.X) {
                    o.axis = [1, 0, 0]
                    GizmoSystem.lineShader.bindForUse(o)
                    LineAPI.draw(o.axis)
                }

                if (c === AXIS.Y) {
                    o.axis = [0, 1, 0]
                    GizmoSystem.lineShader.bindForUse(o)
                    LineAPI.draw(o.axis)
                }

                if (c === AXIS.Z) {
                    o.axis = [0, 0, 1]
                    GizmoSystem.lineShader.bindForUse(o)
                    LineAPI.draw(o.axis)
                }
            }

        } else if (GizmoSystem.targetGizmo || !selected[0]) {
            GizmoSystem.targetGizmo = undefined
            GizmoSystem.mainEntity = undefined
            GizmoSystem.hasStarted = false
        }
    }


}
