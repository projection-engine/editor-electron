import GizmoAPI from "../GizmoAPI";
import GizmoSystem from "../../runtime/GizmoSystem";
import AXIS from "../../static/AXIS";
import ConversionAPI from "../../../../../public/engine/lib/math/ConversionAPI";
import {vec3} from "gl-matrix";
import getPickerId from "../../../../../public/engine/utils/get-picker-id";


const PICK_ID_SS_GIZMO = getPickerId(1)
export default class ScreenSpaceGizmo {

    static onMouseMove(event, damping = 1) {
        if (GizmoSystem.clickedAxis < 0)
            return [0, 0, 0]
        const cameraDistance = 100
        const x = event.movementX * cameraDistance * 1000
        const y = event.movementY * cameraDistance * 1000
        const ssP = ConversionAPI.toWorldCoordinates(x, y).slice(0, 3)
        vec3.scale(ssP, ssP, 1 / cameraDistance ** 2)
        ScreenSpaceGizmo.mapToAxis(ssP)

        return ssP
    }

    static mapToAxis(vec) {
        const axis = GizmoSystem.clickedAxis
        if (axis < 0) {
            vec[0] = 0
            vec[1] = 0
            vec[2] = 0
        }
        switch (axis) {
            case AXIS.X:
                vec[1] = 0
                vec[2] = 0
                break
            case AXIS.Y:
                vec[0] = 0
                vec[2] = 0
                break
            case AXIS.Z:
                vec[0] = 0
                vec[1] = 0
                break
            case AXIS.XZ:
                vec[1] = 0
                break
            case AXIS.XY:
                vec[2] = 0
                break
            case AXIS.ZY:
                vec[0] = 0
                break
        }
    }

    static drawGizmo() {
        if (!GizmoSystem.mainEntity || GizmoSystem.clickedAxis >= 0)
            return
        GizmoAPI.drawGizmo(GizmoSystem.screenSpaceMesh, GizmoSystem.mainEntity.__cacheCenterMatrix, AXIS.SCREEN_SPACE, PICK_ID_SS_GIZMO, GizmoSystem.mainEntity.pivotPoint, GizmoSystem.clickedAxis)
    }
}