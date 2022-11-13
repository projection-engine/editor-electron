import ScreenSpaceGizmo from "../lib/transformation/ScreenSpaceGizmo";
import GizmoSystem from "../runtime/GizmoSystem";
import TRANSFORMATION_TYPE from "../../../static/TRANSFORMATION_TYPE";
import Wrapper from "../Wrapper";
import {vec3, vec4} from "gl-matrix";
import TranslationGizmo from "../lib/transformation/TranslationGizmo";

export default function gizmoTranslateEntity(event){
    const g = event.ctrlKey ? 1 : TranslationGizmo.gridSize
    const vec = ScreenSpaceGizmo.onMouseMove(event, GizmoSystem.sensitivity)
    let toApply, firstEntity = GizmoSystem.mainEntity
    if (GizmoSystem.transformationType === TRANSFORMATION_TYPE.GLOBAL || Wrapper.selected.length > 1)
        toApply = vec
    else
        toApply = vec4.transformQuat([], [...vec, 1], firstEntity._rotationQuat)
    vec3.add(TranslationGizmo.cache, TranslationGizmo.cache, toApply)
    if (Math.abs(TranslationGizmo.cache[0]) >= g || Math.abs(TranslationGizmo.cache[1]) >= g || Math.abs(TranslationGizmo.cache[2]) >= g) {
        const entities = Wrapper.selected
        const SIZE = entities.length
        if (SIZE === 1 && entities[0].lockedTranslation)
            return
        for (let i = 0; i < SIZE; i++) {
            const target = entities[i]
            if (target.lockedTranslation)
                continue

            vec3.add(target.pivotPoint, target.pivotPoint, TranslationGizmo.cache)
            if (SIZE === 1 && event.altKey) {
                target.__pivotChanged = true
                continue
            }
            vec3.add(target._translation, target._translation, TranslationGizmo.cache)


            target._translation[0] = Math.round(target._translation[0] / g) * g
            target._translation[1] = Math.round(target._translation[1] / g) * g
            target._translation[2] = Math.round(target._translation[2] / g) * g

            target.pivotPoint[0] = Math.round(target.pivotPoint[0] / g) * g
            target.pivotPoint[1] = Math.round(target.pivotPoint[1] / g) * g
            target.pivotPoint[2] = Math.round(target.pivotPoint[2] / g) * g
            if(i === 0 && target.parent != null)
                target.__pivotChanged = true
            target.__changedBuffer[0] = 1
        }
        TranslationGizmo.cache = [0, 0, 0]
    }
}