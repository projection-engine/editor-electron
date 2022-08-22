import {mat4, quat, vec3} from "gl-matrix"
import COMPONENTS from "../../../../engine/data/COMPONENTS"
import TRANSFORMATION_TYPE from "../../../../../data/misc/TRANSFORMATION_TYPE"
import Conversion from "../../../../engine/services/Conversion"
import getEntityTranslation from "../utils/get-entity-translation"
import INFORMATION_CONTAINER from "../../../../../data/misc/INFORMATION_CONTAINER"
import RendererStoreController from "../../../../../stores/RendererStoreController";
import ViewportPicker from "../../../../engine/services/ViewportPicker";
import LoopAPI from "../../../../engine/libs/apis/LoopAPI";
import CameraAPI from "../../../../engine/libs/apis/CameraAPI";
import GizmoSystem from "../../../services/GizmoSystem";
import Transformations from "../../../../engine/libs/passes/misc/Transformations";

export default class Gizmo {
    target = []
    clickedAxis = -1
    tracking = false
    targetRotation = undefined

    distanceX = 0
    distanceY = 0
    distanceZ = 0
    xGizmo
    yGizmo
    zGizmo
    xyz
    gridSize
    totalMoved = 0

    started = false

    translation = undefined
    mainEntity = undefined
    updateTransformationRealtime = false
    key

    constructor() {
        this.renderTarget = document.getElementById(INFORMATION_CONTAINER.TRANSFORMATION)
    }

    onMouseMove() {
        if (!this.started) {
            this.started = true
            RendererStoreController.saveEntity(
                GizmoSystem.mainEntity.id,
                COMPONENTS.TRANSFORM,
                this.key,
                GizmoSystem.mainEntity.components[COMPONENTS.TRANSFORM][this.key]
            )
        }
    }

    onMouseDown(event) {
        if (!this.renderTarget)
            this.renderTarget = document.getElementById(INFORMATION_CONTAINER.TRANSFORMATION)

        const w = gpu.canvas.width, h = gpu.canvas.height
        const x = event.clientX
        const y = event.clientY

        this.currentCoord = Conversion.toQuadCoord({x, y}, {w, h})
        this.#testClick()
    }

    notify(value, sign) {
        this.totalMoved += sign * value
        this.renderTarget.innerText = this.totalMoved.toFixed(3) + " un"
    }

    onMouseUp() {
        if (this.totalMoved !== 0) {
            RendererStoreController.saveEntity(
                GizmoSystem.mainEntity.id,
                COMPONENTS.TRANSFORM,
                this.key,
                GizmoSystem.mainEntity.components[COMPONENTS.TRANSFORM][this.key]
            )
        }
        this.totalMoved = 0
        this.started = false
        document.exitPointerLock()
        this.distanceX = 0
        this.distanceY = 0
        this.distanceZ = 0
        this.clickedAxis = -1
        this.tracking = false
        this.renderTarget.style.display = "none"
    }

    exit() {
        this.tracking = false

        GizmoSystem.mainEntity = undefined
        GizmoSystem.translation = undefined
        GizmoSystem.targetRotation = undefined
        GizmoSystem.selectedEntities = []
    }

    #testClick() {
        if (!GizmoSystem.mainEntity || !GizmoSystem.mainEntity.components[COMPONENTS.TRANSFORM])
            return

        const mX = Gizmo.translateMatrix(this.xGizmo.components[COMPONENTS.TRANSFORM])
        const mY = Gizmo.translateMatrix(this.yGizmo.components[COMPONENTS.TRANSFORM])
        const mZ = Gizmo.translateMatrix(this.zGizmo.components[COMPONENTS.TRANSFORM])
        const FBO = GizmoSystem.drawToDepthSampler(
            this.xyz,
            CameraAPI.viewMatrix,
            CameraAPI.projectionMatrix,
            [mX, mY, mZ],
            CameraAPI.position,
            GizmoSystem.translation,
            CameraAPI.isOrthographic
        )
        const dd = ViewportPicker.depthPick(FBO, this.currentCoord)
        const pickID = Math.round(255 * (dd[0]))
        this.clickedAxis = pickID

        if (pickID === 0)
            this.onMouseUp(true)
        else {
            this.tracking = true
            gpu.canvas.requestPointerLock()
            this.renderTarget.style.display = "block"
        }
    }


    execute() {
        if (GizmoSystem.translation && GizmoSystem.mainEntity === GizmoSystem.selectedEntities[0]) {
            if (this.updateTransformationRealtime)
                GizmoSystem.translation = getEntityTranslation(GizmoSystem.mainEntity)
            this.draw()
        }
    }

    static translateMatrix(comp) {

        const matrix = comp.transformationMatrix.slice(0)

        const translation = comp.translation,
            rotationQuat = comp.rotationQuat,
            scale = comp.scaling
        if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.RELATIVE)
            mat4.fromRotationTranslationScaleOrigin(
                matrix,
                quat.multiply([], GizmoSystem.targetRotation, rotationQuat),
                vec3.add([], GizmoSystem.translation, translation),
                scale,
                translation
            )
        else {
            matrix[12] += GizmoSystem.translation[0]
            matrix[13] += GizmoSystem.translation[1]
            matrix[14] += GizmoSystem.translation[2]
        }

        return matrix
    }

    draw() {

        const mX = Gizmo.translateMatrix(this.xGizmo.components[COMPONENTS.TRANSFORM])
        const mY = Gizmo.translateMatrix(this.yGizmo.components[COMPONENTS.TRANSFORM])
        const mZ = Gizmo.translateMatrix(this.zGizmo.components[COMPONENTS.TRANSFORM])

        GizmoSystem.gizmoShader.use()
        this.xyz.use()
        if (this.tracking && this.clickedAxis === 1 || !this.tracking)
            Gizmo.drawGizmo(this.xyz, mX, 1, this.xGizmo.pickID, GizmoSystem.translation, this.clickedAxis)
        if (this.tracking && this.clickedAxis === 2 || !this.tracking)
            Gizmo.drawGizmo(this.xyz, mY, 2, this.yGizmo.pickID, GizmoSystem.translation, this.clickedAxis)
        if (this.tracking && this.clickedAxis === 3 || !this.tracking)
            Gizmo.drawGizmo(this.xyz, mZ, 3, this.zGizmo.pickID, GizmoSystem.translation, this.clickedAxis)
        this.xyz.finish()
    }

    static drawGizmo(mesh, transformMatrix, axis, id, translation, selectedAxis) {
        GizmoSystem.gizmoShader.bindForUse({
            viewMatrix: CameraAPI.viewMatrix,
            transformMatrix,
            projectionMatrix: CameraAPI.projectionMatrix,
            camPos: CameraAPI.position,
            translation,
            axis,
            selectedAxis,
            uID: id,
            cameraIsOrthographic: CameraAPI.isOrthographic
        })
        gpu.drawElements(gpu.TRIANGLES, mesh.verticesQuantity, gpu.UNSIGNED_INT, 0)
    }
}
