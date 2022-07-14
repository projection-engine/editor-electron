import COMPONENTS from "../../../../engine/templates/COMPONENTS"

export default function getOptionsViewport(engine, utils) {
    const {
        group,
        copy,
        paste,
        invertSelection,
        deleteSelected

    } = utils
    const base = [
        {
            label: "Select all",
            onClick: () => {
                engine.setSelected(window.renderer.entities.filter(e => !e.isFolder).map(e => e.id))
            },
            shortcut: ["A"]
        },
        {
            label: "Invert selection",
            onClick: invertSelection,
            shortcut: ["Alt", "A"]
        }
    ]
    if (!engine.selectedEntity)
        return base
    return [
        ...base,
        {
            label: "Copy",
            onClick: () => copy(false),
            icon: "copy_all",
            shortcut: ["Ctrl", "C"]
        },
        {
            label: "Paste",
            onClick: paste,
            icon: "content_paste_go",
            shortcut: ["Ctrl", "V"]
        },
        {divider: true},
        {
            label: "Group entities",
            onClick: group,
            shortcut: ["Ctrl", "P"]
        },
        {divider: true},
        {
            label: "Duplicate active",
            onClick: () => {

            },
            icon: "content_copy",
            disabled: true
        },
        {
            label: "Duplicate entities",
            onClick: () => {

            },
            disabled: true
        },
        {divider: true},
        {
            label: "Apply current transformation",
            onClick: () => {
                const comp = engine.selectedEntity.components[COMPONENTS.TRANSFORM]
                comp.baseTransformationMatrix = comp.transformationMatrix

                comp.translation = [0, 0, 0]
                comp.scaling = [1, 1, 1]
                comp.rotationQuat = [0, 0, 0, 1]
            }
        },
        {
            label: "Center on 3D cursor",
            onClick: () => {
                const comp = engine.selectedEntity.components[COMPONENTS.TRANSFORM]
                comp.translation = window.renderer.cursor.components[COMPONENTS.TRANSFORM].translation
            }
        },
        {
            label: "Origin to 3D cursor",
            onClick: () => {
                const comp = engine.selectedEntity.components[COMPONENTS.TRANSFORM]
                comp.pivotPoint = window.renderer.cursor.components[COMPONENTS.TRANSFORM].translation
            }
        },
        {divider: true},
        {
            label: "Rename active",
            onClick: () => {
            },
            icon: "edit",
            disabled: true,
            shortcut: ["F2"]
        },
        {
            label: "Fixate active",
            onClick: () => {
                engine.setLockedEntity(engine.selectedEntity.id)
            },
            icon: "push_pin",
            shortcut: ["Ctrl", "F"]
        },
        {divider: true},
        {
            label: "Snap to grid",
            onClick: () => {
            },
            disabled: true
        },
        {divider: true},
        {
            shortcut: ["Delete"],
            icon: "delete_forever",
            label: "Delete",
            onClick: deleteSelected
        },

    ]
}