import PickingAPI from "../../../core/lib/utils/PickingAPI"
import GPU from "../../../core/GPU"
import CameraAPI from "../../../core/lib/utils/CameraAPI"
import StaticFBO from "../../../core/lib/StaticFBO"
import AXIS from "../../static/AXIS"
import VisibilityRenderer from "../../../core/runtime/VisibilityRenderer"
import StaticEditorShaders from "../../utils/StaticEditorShaders"
import GizmoState from "./GizmoState"
import GizmoSystem from "../GizmoSystem"
import GizmoUtil from "./GizmoUtil"
import {vec3} from "gl-matrix"

export default class GizmoMouseUtil {

	static onMouseUp() {
		GizmoState.hasTransformationStarted = false
		// document.exitPointerLock()
		GizmoState.clickedAxis = AXIS.NONE
		if (!GizmoState.mainEntity)
			return
		GizmoUtil.updateGizmosTransformation(true)
		GizmoSystem.callListeners()
		GizmoSystem.onStop?.()
		GizmoState.initialEntityPosition[0] = 0
		GizmoState.initialEntityPosition[1] = 0
		GizmoState.initialEntityPosition[2] = 0
	}

	static onMouseDown(event: MouseEvent) {
		if (!GizmoState.mainEntity)
			return
		GizmoUtil.updateGizmosTransformation(true)
		GizmoMouseUtil.#drawGizmoToDepth()
		const axis = PickingAPI.readEntityID(event.clientX, event.clientY)
		if (axis === 0)
			return
		vec3.copy(GizmoState.initialEntityPosition, GizmoState.mainEntity.__pivotOffset)
		GizmoSystem.callListeners(false)
		GizmoState.wasOnGizmo = true
		GizmoState.clickedAxis = axis
		GizmoSystem.onStart?.()
	}

	static #drawGizmoToDepth() {
		const data = {
			translation: GizmoState.mainEntity.__pivotOffset,
			cameraIsOrthographic: CameraAPI.isOrthographic
		}
		StaticFBO.visibility.startMapping()
		GPU.context.disable(GPU.context.CULL_FACE)
		for (let i = 0; i < GizmoState.targetGizmos.length; i++) {
			GizmoState.targetGizmos[i].drawToDepth(data)
		}
		StaticFBO.visibility.stopMapping()
		VisibilityRenderer.needsUpdate = true
		GPU.context.enable(GPU.context.CULL_FACE)
	}

	static drawToDepth(data, mesh, transformation, pickId) {
		data.transformMatrix = transformation
		data.uID = pickId
		StaticEditorShaders.toDepthBuffer.bindForUse(data)
		mesh.draw()
	}

	static onMouseMove(event: MouseEvent) {
		for (let i = 0; i < GizmoState.targetGizmos.length; i++) {
			GizmoState.targetGizmos[i].onMouseMove(event)
		}
	}
}