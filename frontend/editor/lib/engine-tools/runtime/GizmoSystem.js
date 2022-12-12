import TranslationGizmo from "../lib/transformation/TranslationGizmo"
import RotationGizmo from "../lib/transformation/RotationGizmo"
import ScalingGizmo from "../lib/transformation/ScalingGizmo"
import TRANSFORMATION_TYPE from "../../../static/TRANSFORMATION_TYPE"
import Movable from "../../../../../public/engine/instances/Movable";
import TransformationAPI from "../../../../../public/engine/lib/math/TransformationAPI";
import ScreenSpaceGizmo from "../lib/transformation/ScreenSpaceGizmo";
import GPU from "../../../../../public/engine/GPU";
import STATIC_MESHES from "../../../../../public/engine/static/resources/STATIC_MESHES";
import STATIC_SHADERS from "../../../../../public/engine/static/resources/STATIC_SHADERS";
import AXIS from "../static/AXIS";
import LineAPI from "../../../../../public/engine/lib/rendering/LineAPI";
import {mat4} from "gl-matrix";
import getPivotPointMatrix from "../utils/get-pivot-point-matrix";
import GizmoAPI from "../lib/GizmoAPI";
import LineRenderer from "./LineRenderer";


const lineMatrix = mat4.create()
const EMPTY_COMPONENT = new Movable()

const LINE_SIZE = 1000000;
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
    static transformationType = TRANSFORMATION_TYPE.GLOBAL

    static updateGizmoToolTip = () => null

    static linkEntityToGizmo(main) {
        getPivotPointMatrix(main)
        main.__pivotChanged = true
        GizmoSystem.mainEntity = main
        GizmoSystem.targetGizmo.transformGizmo()
        GizmoSystem.targetRotation = main._rotationQuat
        RotationGizmo.currentRotation = [0, 0, 0]
    }

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

        GizmoSystem.lineShader =
            GizmoSystem.toBufferShader = GPU.shaders.get(STATIC_SHADERS.DEVELOPMENT.TO_BUFFER)
        GizmoSystem.gizmoShader = GPU.shaders.get(STATIC_SHADERS.DEVELOPMENT.GIZMO)
        GizmoSystem.translationGizmo = new TranslationGizmo()
        GizmoSystem.scaleGizmo = new ScalingGizmo()
        GizmoSystem.rotationGizmo = new RotationGizmo()
        GizmoSystem.targetGizmo = GizmoSystem.translationGizmo
    }


    static execute() {
        const m = GizmoSystem.mainEntity
        if (m != null) {
            const axis = GizmoSystem.clickedAxis
            GizmoSystem.highlightX = axis === AXIS.X || axis === AXIS.XZ || axis === AXIS.XY || axis === AXIS.SCREEN_SPACE
            GizmoSystem.highlightY = axis === AXIS.Y || axis === AXIS.ZY || axis === AXIS.XY || axis === AXIS.SCREEN_SPACE
            GizmoSystem.highlightZ = axis === AXIS.Z || axis === AXIS.ZY || axis === AXIS.XZ || axis === AXIS.SCREEN_SPACE

            getPivotPointMatrix(m)
            const t = GizmoSystem.targetGizmo
            if (t) {
                if (t !== GizmoSystem.rotationGizmo)
                    ScreenSpaceGizmo.drawGizmo()
                t.drawGizmo()
                mat4.identity(lineMatrix)
                GizmoAPI.applyTransformation(lineMatrix, [0, 0, 0, 1], [0, 0, 0], [1, 1, 1])
            }

            LineRenderer.setState(0, 0, LINE_SIZE)
            if (GizmoSystem.highlightX) LineRenderer.drawX(lineMatrix)
            if (GizmoSystem.highlightY) LineRenderer.drawY(lineMatrix)
            if (GizmoSystem.highlightZ) LineRenderer.drawZ(lineMatrix)
            LineRenderer.finish()
        } else
            GizmoSystem.hasStarted = false
    }


}
