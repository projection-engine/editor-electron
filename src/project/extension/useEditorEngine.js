import {useCallback, useContext, useEffect, useState} from "react"
import useEngineEssentials, {ENTITY_ACTIONS} from "../engine/useEngineEssentials"
import useHistory from "../hooks/useHistory"
import {HISTORY_ACTIONS} from "../hooks/historyReducer"
import COMPONENTS from "../engine/templates/COMPONENTS"
import GPUContextProvider from "../components/viewport/hooks/GPUContextProvider"


export default function useEditorEngine(canExecutePhysicsAnimation, settings, canStart, setAlert) {
    const [canRender, setCanRender] = useState(true)
    const [selected, setSelected] = useState([])
    const [lockedEntity, setLockedEntity] = useState()
    const {
        meshes, setMeshes,
        materials, setMaterials,
        entities, dispatchEntities,
        scripts, setScripts
    } = useEngineEssentials()
    const {gpu, renderer} = useContext(GPUContextProvider)
    const {returnChanges, forwardChanges, dispatchChanges, changes} = useHistory(entities, dispatchEntities, setAlert)
    const [updated, setUpdated] = useState(false)
    useEffect(() => {
        if (renderer && updated)
            renderer.start()
    }, [renderer, updated])

    const onGizmoStart = () => {
        const e = entities.find(e => e.id === selected[0])
        if (e)
            dispatchChanges({
                type: HISTORY_ACTIONS.SAVE_COMPONENT_STATE,
                payload: {
                    key: COMPONENTS.TRANSFORM,
                    entityID: selected[0],
                    component: e.components[COMPONENTS.TRANSFORM]
                }
            })
    }
    const onGizmoEnd = () => {
        const e = entities.find(e => e.id === selected[0])
        if (e)
            dispatchEntities({
                type: ENTITY_ACTIONS.UPDATE_COMPONENT,
                payload: {key: COMPONENTS.TRANSFORM, entityID: selected[0], data: e.components[COMPONENTS.TRANSFORM]}
            })
    }

    const update = useCallback(() => {
        if (renderer && canStart && canRender) {
            if(!updated)
                setUpdated(true)
            renderer.gizmo = settings.gizmo
            renderer?.updatePackage(
                entities,
                materials,
                meshes,
                {canExecutePhysicsAnimation, selected, setSelected, ...settings},
                scripts,
                onGizmoStart,
                onGizmoEnd,
                false
            )
        }
    }, [
        canRender,
        canExecutePhysicsAnimation,
        selected, setSelected,
        materials, meshes, scripts,
        entities, gpu,
        settings, canStart,
        renderer, updated
    ])

    useEffect(update, [update])
    return {
        update,changes,
        returnChanges, forwardChanges,
        dispatchChanges,
        lockedEntity, setLockedEntity,
        entities, dispatchEntities,
        meshes, setMeshes,
        gpu, materials, setMaterials,

        selected,
        setSelected,
        canRender, setCanRender,
        renderer,
        scripts, setScripts
    }
}

