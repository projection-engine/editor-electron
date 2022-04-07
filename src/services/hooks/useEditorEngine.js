import {useEffect, useRef, useState} from "react";
import {enableBasics} from "../engine/utils/misc/utils";
import PostProcessingSystem from "../engine/ecs/systems/PostProcessingSystem";
import MeshSystem from "../engine/ecs/systems/MeshSystem";
import TransformSystem from "../engine/ecs/systems/TransformSystem";
import PhysicsSystem from "../engine/ecs/systems/PhysicsSystem";
import ShadowMapSystem from "../engine/ecs/systems/ShadowMapSystem";
import PickSystem from "../engine/ecs/systems/PickSystem";
import Engine from "../engine/Engine";
import EVENTS from "../utils/misc/EVENTS";
import PerformanceSystem from "../engine/ecs/systems/PerformanceSystem";
import SYSTEMS from "../engine/templates/SYSTEMS";
import CubeMapSystem from "../engine/ecs/systems/CubeMapSystem";
import ScriptSystem from "../engine/ecs/systems/ScriptSystem";
import useEngineEssentials from "../engine/useEngineEssentials";
import useHistory from "./useHistory";
import GIZMOS from "../engine/templates/GIZMOS";
import {HISTORY_ACTIONS} from "../utils/historyReducer";
import COMPONENTS from "../engine/templates/COMPONENTS";


export default function useEditorEngine(id, canExecutePhysicsAnimation, settings, load, canStart, setAlert) {
    const {
        meshes, setMeshes,
        materials, setMaterials,
        entities, dispatchEntities,
        scripts, setScripts
    } = useEngineEssentials(true)
    const {
        returnChanges,
        forwardChanges,
        dispatchChanges
    } = useHistory(entities, dispatchEntities, setAlert)
    const [canRender, setCanRender] = useState(true)
    const [gpu, setGpu] = useState()
    const [selected, setSelected] = useState([])
    const [finished, setFinished] = useState(false)
    const [initialized, setInitialized] = useState(false)
    const [lockedEntity, setLockedEntity] = useState()

    useEffect(() => {
        if (id) {
            const newGPU = document.getElementById(id + '-canvas').getContext('webgl2', {
                antialias: false,
                preserveDrawingBuffer: true,
                premultipliedAlpha: false
            })
            enableBasics(newGPU)
            setGpu(newGPU)
        }
    }, [id])


    const renderer = useRef()
    let resizeObserver


    const updateSystems = (callback) => {
        load.pushEvent(EVENTS.UPDATING_SYSTEMS)
        const deferred = new MeshSystem(gpu, settings.resolutionMultiplier)
        deferred.initializeTextures()
            .then(() => {
                const shadows = renderer.current.systems[SYSTEMS.SHADOWS],
                    transformation = renderer.current.systems[SYSTEMS.TRANSFORMATION],
                    physics = renderer.current.systems[SYSTEMS.PHYSICS],
                    perf = renderer.current.systems[SYSTEMS.PERF],
                    pick = renderer.current.systems[SYSTEMS.PICK],
                    cubeMap = renderer.current.systems[SYSTEMS.CUBE_MAP],
                    s = renderer.current.systems[SYSTEMS.SCRIPT]

                renderer.current.systems = [
                    s ? s : new ScriptSystem(gpu),
                    perf ? perf : new PerformanceSystem(gpu),
                    physics ? physics : new PhysicsSystem(),
                    transformation ? transformation : new TransformSystem(),

                    cubeMap ? cubeMap : new CubeMapSystem(gpu),

                    shadows ? shadows : new ShadowMapSystem(gpu),
                    pick ? pick : new PickSystem(gpu),
                    deferred,
                    // new AOSystem(gpu),
                    new PostProcessingSystem(gpu, settings.resolutionMultiplier)
                ]
                load.finishEvent(EVENTS.UPDATING_SYSTEMS)
                callback()
            })
    }


    useEffect(() => {
        if (renderer.current)
            renderer.current.camera.fov = settings.fov
    }, [settings.fov])

    useEffect(() => {
        if (initialized && canStart && canRender)
            updateSystems(() => null)
    }, [settings.resolutionMultiplier, initialized, canStart, canRender])

    useEffect(() => {
        if (gpu && !initialized && id && !finished) {
            renderer.current = new Engine(id, gpu)
            setInitialized(true)
            updateSystems(() => {
                setFinished(true)
            })

        } else if (finished && canStart) {
            resizeObserver = new ResizeObserver(() => {
                if (gpu && initialized)
                    renderer.current.camera.aspectRatio = gpu.canvas.width / gpu.canvas.height
            })
            resizeObserver.observe(document.getElementById(id + '-canvas'))
            renderer.current?.updateCamera(settings.cameraType)
            renderer.current.gizmo = settings.gizmo

            if (!canRender)
                renderer.current?.stop()
            else
                renderer.current?.start(
                    entities,
                    materials,
                    meshes,
                    {canExecutePhysicsAnimation, selected, setSelected: d => setSelected(d), ...settings},
                    scripts,
                    () => {
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
                    },
                    () => {
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
                )

        }
        return () => {
            renderer.current?.stop()
        }
    }, [
        canExecutePhysicsAnimation,
        selected, setSelected,
        materials, meshes, scripts,
        initialized, entities, gpu, id, canRender,
        settings, finished, canStart
    ])


    return {
        returnChanges, forwardChanges,
        dispatchChanges,

        lockedEntity, setLockedEntity,
        entities, dispatchEntities: (obj) => {

            dispatchEntities(obj)
        },
        meshes, setMeshes,
        gpu, materials, setMaterials,
        selected, setSelected,
        canRender, setCanRender,
        renderer: renderer.current,
        scripts, setScripts
    }
}