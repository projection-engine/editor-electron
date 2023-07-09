import Engine from "../../../engine-core/core/Engine"
import CameraTracker from "../../../engine-core/tools/utils/CameraTracker"
import EngineTools from "../../../engine-core/tools/EngineTools"
import CameraAPI from "../../../engine-core/core/lib/utils/CameraAPI"
import ENVIRONMENT from "../../../engine-core/core/static/ENVIRONMENT"
import EngineResources from "../../../engine-core/core/lib/EngineResources"
import AbstractSingleton from "../../../shared/AbstractSingleton"
import EngineStore from "../../stores/EngineStore"
import SettingsStore from "../../stores/SettingsStore"
import VisualsStore from "../../stores/VisualsStore"
import SelectionStore from "../../stores/SelectionStore"
import UIAPI from "../../../engine-core/core/lib/rendering/UIAPI"
import GPU from "../../../engine-core/core/GPU"
import SelectionStoreUtil from "../util/SelectionStoreUtil"
import EngineToolsState from "../../../engine-core/tools/EngineToolsState"
import EngineState from "../../../engine-core/core/EngineState"
import SETTINGS from "../static/SETTINGS"
import GizmoState from "../../../engine-core/tools/gizmo/util/GizmoState"

export default class EngineToolsService extends AbstractSingleton {

	constructor() {
		super()
		SelectionStore.getInstance()
			.addListener("EngineToolsService", EngineToolsService.#updateSelection)
		EngineStore.getInstance()
			.addListener("EngineToolsService", EngineToolsService.#updateCameraTracker)
		SettingsStore.getInstance()
			.addListener("EngineToolsService_camera", EngineToolsService.#updateWithSettings)
		VisualsStore.getInstance()
			.addListener("EngineToolsService", EngineToolsService.#updateEngineSettings)
	}

	static #updateSelection() {
		EngineTools.updateSelectionData(SelectionStoreUtil.getEntitiesSelected())
	}

	static #updateEngineState() {
		const visualSettings = VisualsStore.getData()
		EngineState.fxaaEnabled = visualSettings.FXAA
		EngineState.fxaaSpanMax = visualSettings.FXAASpanMax
		EngineState.fxaaReduceMin = visualSettings.FXAAReduceMin
		EngineState.fxaaReduceMul = visualSettings.FXAAReduceMul
		EngineState.ssgiEnabled = visualSettings.SSGI.enabled
		EngineState.ssgiBlurSamples = visualSettings.SSGI.blurSamples
		EngineState.ssgiBlurRadius = visualSettings.SSGI.blurRadius
		EngineState.ssgiStepSize = visualSettings. SSGI.stepSize
		EngineState.ssgiMaxSteps = visualSettings. SSGI.maxSteps
		EngineState.ssgiStrength = visualSettings. SSGI.strength
		EngineState.ssrFalloff = visualSettings.SSR.falloff
		EngineState.ssrStepSize = visualSettings.SSR.stepSize
		EngineState.ssrMaxSteps = visualSettings.SSR.maxSteps
		EngineState.sssMaxDistance = visualSettings.SSS.maxDistance
		EngineState.sssDepthThickness = visualSettings.SSS.depthThickness
		EngineState.sssEdgeFalloff = visualSettings. SSS.edgeFalloff
		EngineState.sssDepthDelta = visualSettings.SSS.depthDelta
		EngineState.sssMaxSteps = visualSettings.SSS.maxSteps
		EngineState.ssaoEnabled = visualSettings.SSAO.enabled
		EngineState.ssaoFalloffDistance = visualSettings.SSAO.falloffDistance
		EngineState.ssaoRadius = visualSettings.SSAO.radius
		EngineState.ssaoPower = visualSettings.SSAO.power
		EngineState.ssaoBias = visualSettings. SSAO.bias
		EngineState.ssaoBlurSamples = visualSettings.SSAO.blurSamples
		EngineState.ssaoMaxSamples = visualSettings.SSAO.maxSamples
		EngineState.physicsSubSteps = visualSettings.physicsSubSteps
		EngineState.physicsSimulationStep = visualSettings.physicsSimulationStep
		EngineResources.updateParams()
	}

	static 	#updateEngineSettings() {
		const visualSettings = VisualsStore.getData()
		GPU.canvas.width = visualSettings.resolutionX
		GPU.canvas.height = visualSettings.resolutionY

		if (Engine.environment === ENVIRONMENT.DEV)
			EngineTools.bindSystems()
		else
			EngineTools.unbindSystems()
		EngineToolsService.#updateEngineState()
	}

	static #updateCameraTracker() {
		const engine = EngineStore.getData()
		const settings = SettingsStore.getData()
		if (engine.executingAnimation)
			UIAPI.showUI()
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
	}

	static 	#updateEngineToolsState() {
		const settings = SettingsStore.getData() as typeof SETTINGS
		EngineToolsState.gridColor = settings.gridColor
		EngineToolsState.gridScale = settings.gridScale * 10
		EngineToolsState.gridThreshold = settings.gridThreshold
		EngineToolsState.gridOpacity = settings.gridOpacity
		EngineToolsState.showGrid = settings.showGrid
		EngineToolsState.showIcons = settings.showIcons
		EngineToolsState.showLines = settings.showLines
		EngineToolsState.iconScale = settings.iconScale
		EngineToolsState.showOutline = settings.showOutline
		EngineToolsState.outlineColor = settings.outlineColor
		EngineToolsState.outlineWidth = settings.outlineWidth
	}

	static #updateWithSettings() {
		const settings = SettingsStore.getData()
		GizmoState.rotationGridSize = settings.gizmoGrid.rotationGizmo || .001
		GizmoState.translationGridSize = settings.gizmoGrid.translationGizmo || .001
		GizmoState.scalingGridSize = settings.gizmoGrid.scaleGizmo || .001
		GizmoState.transformationType = settings.transformationType
		GizmoState.sensitivity =settings?.gizmoGrid?.sensitivity / 100 || .001
		GizmoState.gizmoType =settings.gizmo
		EngineToolsService.#updateCameraTracker()
		EngineToolsService.#updateEngineToolsState()
		CameraAPI.isOrthographic = settings.camera.ortho
	}
}