import {useCallback, useEffect, useMemo, useReducer, useRef, useState} from "react"
import entityReducer from "./entityReducer"
import COMPONENTS from "../engine/templates/COMPONENTS"
import Entity from "../engine/basic/Entity"
import TransformComponent from "../engine/components/TransformComponent"
import Transformation from "../engine/utils/Transformation"
import toObject from "../engine/utils/toObject"
import MaterialInstance from "../engine/instances/MaterialInstance"
import * as shaderCode from "../engine/shaders/mesh/FALLBACK.glsl"
import FALLBACK_MATERIAL from "../../static/misc/FALLBACK_MATERIAL"
import {v4} from "uuid"


function getCursor() {
    const entity = new Entity()
    const t = new TransformComponent()
    t.lockedRotation = true
    t.lockedScaling = true
    t.transformationMatrix = Transformation.transform(t.translation, [0, 0, 0, 1], t.scaling)
    entity.components[COMPONENTS.TRANSFORM] = t

    return entity
}

const WORKER = new Worker(new URL("./cleanupWorker.js", import.meta.url))
export default function useEngine(settings) {
    const entities = useRef(new Map())
    const [executingAnimation, setExecutingAnimation] = useState(false)
    const [viewportInitialized, setViewportInitialized] = useState(false)
    // const {returnChanges, forwardChanges, dispatchChanges, changes} = useHistory(entities, dispatchEntities)
    const [levelScript, setLevelScript] = useState()
    const [selected, setSelected] = useState([])
    const [lockedEntity, setLockedEntity] = useState()
    const [meshes, setMeshes] = useState([])
    const [materials, setMaterials] = useState([])
    const [fallbackMaterial, setFallbackMaterial] = useState()
    const [entitiesChangeID, setChangeID] = useState(v4())

    useEffect(() => {
        WORKER.postMessage({
            entities: entities.current,
            COMPONENTS,
            meshes: toObject(meshes, true),
            materials: toObject(materials, true)
        })
        WORKER.onmessage = ({data: {meshesFiltered, materialsFiltered}}) => {
            if (Object.keys(meshesFiltered).length > 0) setMeshes(prev => {
                const filtered = []
                for (let i = 0; i < prev.length; i++) {
                    if (!meshesFiltered[prev[i].id]) filtered.push(prev[i])
                    else prev[i].delete()
                }
                return filtered
            })
            if (Object.keys(materialsFiltered).length > 0) setMaterials(prev => {
                const filtered = []
                for (let i = 0; i < prev.length; i++) {
                    if (!materialsFiltered[prev[i].id]) filtered.push(prev[i])
                    else prev[i].delete()
                }
                return filtered
            })
        }
    }, [entitiesChangeID])


    const onGizmoStart = () => {
        // const e = entities.get(selected[0])
        // if (e) dispatchChanges({
        //     type: HISTORY_ACTIONS.SAVE_COMPONENT_STATE, payload: {
        //         key: COMPONENTS.TRANSFORM, entityID: e.id, component: e.components[COMPONENTS.TRANSFORM]
        //     }
        // })
    }
    const onGizmoEnd = () => {
        // const e = entities.get(selected[0])
        // if (e) dispatchEntities({
        //     type: ENTITY_ACTIONS.UPDATE_COMPONENT,
        //     payload: {key: COMPONENTS.TRANSFORM, entityID: e.id, data: e.components[COMPONENTS.TRANSFORM]}
        // })
    }
    const update = useCallback(() => {
        if (viewportInitialized) {
            let fMat = fallbackMaterial
            if (!fallbackMaterial) {
                fMat = new MaterialInstance({
                    vertex: shaderCode.fallbackVertex,
                    fragment: shaderCode.fragment,
                    settings: {isForward: false},
                    cubeMapShaderCode: shaderCode.cubeMapShader,
                    id: FALLBACK_MATERIAL
                })
                setFallbackMaterial(fMat)
            }

            window.renderer.camera.ortho = selected.ortho
            window.renderer.camera.updateProjection()
            window.renderer.entitiesMap = entities.current
            window.renderer.meshes = meshes
            window.renderer.materials = materials
            window.renderer.camera.animated = settings.cameraAnimation
            window.renderer.gizmo = settings.gizmo
            if(!window.renderer.cursor)
                window.renderer.cursor = getCursor()

            window.renderer.updatePackage(
                executingAnimation,
                {selected, setSelected, ...settings},
                onGizmoStart,
                onGizmoEnd,
                levelScript,
                fMat
            )
        }
    }, [
        fallbackMaterial, viewportInitialized,
        executingAnimation,
        selected, materials, meshes,
        settings, entitiesChangeID
    ])

    useEffect(update, [update])

    const selectedEntity = useMemo(() => {
        if (selected[0])
            return entities.current.get(selected[0])
        return entities.current.get(lockedEntity)
    }, [selected, entitiesChangeID, lockedEntity])


    return {
        selectedEntity,
        executingAnimation,
        setExecutingAnimation,
        viewportInitialized,
        setViewportInitialized,
        update,
        returnChanges: () => null,
        forwardChanges: () => null,
        dispatchChanges: () => null,
        lockedEntity,
        entitiesChangeID,
        meshes,
        materials,
        selected,
        setMaterials,
        setMeshes,
        setLockedEntity,
        setSelected,
        setLevelScript,

        dispatchEntities: packageData => entityReducer(packageData, entities.current, setChangeID),

    }
}


