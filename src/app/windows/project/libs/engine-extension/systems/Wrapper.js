import GridSystem from "./GridSystem"
import IconsSystem from "./IconsSystem"
import GizmoSystem from "./GizmoSystem"
import SelectedSystem from "./SelectedSystem"
import PreviewSystem from "./PreviewSystem"
import BackgroundSystem from "./BackgroundSystem"

let gpu
export default class Wrapper {
    constructor( resolution) {
        gpu = window.gpu
        this.gridSystem = new GridSystem()
        this.billboardSystem = new IconsSystem()
        this.gizmoSystem = new GizmoSystem()
        this.selectedSystem = new SelectedSystem(resolution)
        this.previewSystem = new PreviewSystem()
        this.backgroundSystem = new BackgroundSystem()
    }

    execute(options, data, isAfter) {
        const {
            meshes,
            meshesMap
        } = data
        const {
            selected,
            camera,
            transformationType,
            gizmo,
            canExecutePhysicsAnimation
        } = options

        if(!isAfter) {
            this.backgroundSystem.execute(data, options)
            this.gridSystem.execute(options)
        }
        else {
            gpu.enable(gpu.BLEND)
            gpu.blendFunc(gpu.SRC_ALPHA, gpu.ONE_MINUS_SRC_ALPHA)
            if (!canExecutePhysicsAnimation)
                this.billboardSystem.execute(data, options)
            if (gizmo !== undefined && !canExecutePhysicsAnimation) {
                gpu.clear(gpu.DEPTH_BUFFER_BIT)
                this.gizmoSystem.execute(
                    meshes,
                    meshesMap,
                    selected,
                    camera,

                    gizmo,
                    transformationType
                )
                this.selectedSystem.execute(selected, meshesMap, camera)
            }
        }

    }
}