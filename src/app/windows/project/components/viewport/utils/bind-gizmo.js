import GIZMOS from "../../../data/GIZMOS";
import Engine from "../../../libs/engine/production/Engine";
import GizmoSystem from "../../../libs/engine/editor/services/GizmoSystem";

export default function bindGizmo(selected, settings) {
    const entities = Engine.entitiesMap
    GizmoSystem.selectedEntities = selected
        .map(s => entities.get(s))
        .filter(c => settings.gizmo === GIZMOS.TRANSLATION || settings.gizmo === GIZMOS.ROTATION && !c.lockedRotation || settings.gizmo === GIZMOS.SCALE && !c.lockedScaling)

    if (GizmoSystem.selectedEntities.length > 0) {
        switch (settings.gizmo) {
            case GIZMOS.TRANSLATION:
                GizmoSystem.targetGizmo = GizmoSystem.translationGizmo
                break
            case GIZMOS.ROTATION:
                GizmoSystem.targetGizmo = GizmoSystem.rotationGizmo
                break
            case GIZMOS.SCALE:
                GizmoSystem.targetGizmo = GizmoSystem.scaleGizmo
                break
        }
    } else if (GizmoSystem.targetGizmo) {
        GizmoSystem.targetGizmo.tracking = false;
        GizmoSystem.targetGizmo = undefined
    }
}