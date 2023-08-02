import Component from "../../../../../engine/core/instances/components/Component"
import LocalizationEN from "../../../../../../shared/enums/LocalizationEN"
import EditorCameraSystem from "../../../../../engine/tools/systems/EditorCameraSystem"

export default [
	{
		type: Component.propTypes.NUMBER,
		label: LocalizationEN.SCREEN_GRABBING_SPEED,
		key: ["camera", "screenSpaceMovementSpeed"],
		target: "settings",
		min: .01,
		increment: .1,
		onChange: v => {
			EditorCameraSystem.screenSpaceMovementSpeed = v
			return v
		}
	},
	{
		type: Component.propTypes.NUMBER,
		label: LocalizationEN.TRANSLATION,
		key: ["camera", "movementSpeed"],
		target: "settings",
		min: .01,
		increment: .1,
		onChange: v => {
			EditorCameraSystem.movementSpeed = v
			return v
		}
	},
	{
		type: Component.propTypes.NUMBER,
		label: LocalizationEN.ROTATION,
		key: ["camera", "turnSpeed"],
		target: "settings",
		min: .01,
		increment: .001,
		onChange: v => {
			EditorCameraSystem.turnSpeed = v
			return v
		}
	},
	{
		type: Component.propTypes.NUMBER,
		label: LocalizationEN.SMOOTHING,
		key: ["camera", "smoothing"],
		target: "settings",
		min: 0,
		max: 10,
		increment: .001,
		onChange: v => 1 / v
	}
]
