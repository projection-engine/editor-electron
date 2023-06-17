import Engine from "../../../../../engine-core/Engine"
import CameraTracker from "../../../../../engine-core/tools/lib/CameraTracker"
import EngineTools from "../../../../../engine-core/tools/EngineTools"
import CameraAPI from "../../../../../engine-core/lib/utils/CameraAPI"
import DirectionalShadows from "../../../../../engine-core/runtime/DirectionalShadows"
import GizmoSystem from "../../../../../engine-core/tools/runtime/GizmoSystem"
import ENVIRONMENT from "../../../../../engine-core/static/ENVIRONMENT"
import Loop from "../../../../../engine-core/Loop"
import RotationGizmo from "../../../../../engine-core/tools/lib/transformation/RotationGizmo"
import TranslationGizmo from "../../../../../engine-core/tools/lib/transformation/TranslationGizmo"
import ScalingGizmo from "../../../../../engine-core/tools/lib/transformation/ScalingGizmo"
import GIZMOS from "../../../static/GIZMOS"
import EngineResources from "../../../../../engine-core/lib/EngineResources"
import VISUAL_SETTINGS from "../../../static/VISUAL_SETTINGS"


export default function updateRenderer(selected, engine, settings) {

	EngineTools.updateSelectionData(selected)
	RotationGizmo.gridSize = settings.gizmoGrid.rotationGizmo || .001
	TranslationGizmo.gridSize = settings.gizmoGrid.translationGizmo || .001
	ScalingGizmo.gridSize = settings.gizmoGrid.scaleGizmo || .001

	if (Engine.environment === ENVIRONMENT.DEV && !engine.focusedCamera) {
		CameraAPI.trackingEntity = undefined
		if (settings.camera !== undefined) {
			CameraTracker.screenSpaceMovementSpeed = settings.camera.screenSpaceMovementSpeed || 1
			CameraTracker.movementSpeed = settings.camera.movementSpeed * .1
			CameraTracker.turnSpeed = settings.camera.turnSpeed * .01
			if (settings.camera.smoothing != null)
				CameraAPI.translationSmoothing = settings.screenSpaceMovement ? 0 : settings.camera.smoothing * .001
			CameraAPI.updateViewTarget(settings.camera)
		}
	}
	if (Engine.environment === ENVIRONMENT.DEV)
		Loop.linkToExecutionPipeline(EngineTools.execute)
	else
		Loop.linkToExecutionPipeline()

	GizmoSystem.transformationType = settings.transformationType
	DirectionalShadows.allocateBuffers(settings.shadowAtlasQuantity, settings.shadowMapResolution)

	if (settings.gizmoGrid.sensitivity != null)
		GizmoSystem.sensitivity = settings.gizmoGrid.sensitivity



	EngineResources.updateParams(
		settings,
		settings.SSGI ?? VISUAL_SETTINGS.SSGI,
		settings.SSR ?? VISUAL_SETTINGS.SSR,
		settings.SSS ?? VISUAL_SETTINGS.SSS,
		settings.SSAO ?? VISUAL_SETTINGS.SSAO,
		settings.physicsSimulationStep,
		settings.physicsSubSteps
	)

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
}