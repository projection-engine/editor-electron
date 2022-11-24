import mapGizmoMesh from "../../utils/map-gizmo-mesh"
import GizmoSystem from "../../runtime/GizmoSystem";
import Inheritance from "../Inheritance";
import gizmoTranslateEntity from "../../utils/gizmo-translate-entity";

export default class TranslationGizmo extends Inheritance {
    static gridSize = 1
    tracking = false
    key = "_translation"

    static cache = [0, 0, 0]

    constructor() {
        super()
        this.xyz = GizmoSystem.translationGizmoMesh
        this.xGizmo = mapGizmoMesh("x", "TRANSLATION")
        this.yGizmo = mapGizmoMesh("y", "TRANSLATION")
        this.zGizmo = mapGizmoMesh("z", "TRANSLATION")
        this.updateTransformationRealtime = true
    }

    onMouseDown(event) {
        super.onMouseDown(event);
        TranslationGizmo.cache = [0, 0, 0]
    }

    onMouseMove(event) {
        super.onMouseMove()
        gizmoTranslateEntity(event)
    }


}