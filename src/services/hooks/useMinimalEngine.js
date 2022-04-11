import {useContext, useEffect, useRef, useState} from "react";

import {ENTITY_ACTIONS} from "../utils/entityReducer";
import Entity from "../engine/ecs/basic/Entity";
import sphereMesh from '../../static/assets/Sphere.json'

import Engine from "../engine/Engine";
import TransformSystem from "../engine/ecs/systems/TransformSystem";
import ShadowMapSystem from "../engine/ecs/systems/ShadowMapSystem";
import MeshSystem from "../engine/ecs/systems/MeshSystem";
import PostProcessingSystem from "../engine/ecs/systems/PostProcessingSystem";
import SkyboxComponent from "../engine/ecs/components/SkyboxComponent";
import DirectionalLightComponent from "../engine/ecs/components/DirectionalLightComponent";

import MeshComponent from "../engine/ecs/components/MeshComponent";
import TransformComponent from "../engine/ecs/components/TransformComponent";
import MeshInstance from "../engine/instances/MeshInstance";
import {LoaderProvider} from "@f-ui/core";
import {SHADING_MODELS} from "../../pages/project/hook/useSettings";
import EVENTS from "../utils/misc/EVENTS";
import CAMERA_TYPES from "../engine/templates/CAMERA_TYPES";
import MaterialComponent from "../engine/ecs/components/MaterialComponent";

import {v4 as uuidv4} from 'uuid';
import useEngineEssentials from "../engine/useEngineEssentials";
import ImageProcessor from "../workers/image/ImageProcessor";
import COMPONENTS from "../engine/templates/COMPONENTS";

export default function useMinimalEngine(initializeSphere, centerOnSphere, loadAllMeshes) {
    const [id, setId] = useState(uuidv4())
    const {
        meshes, setMeshes,
        materials, setMaterials,
        entities, dispatchEntities,
        gpu
    } = useEngineEssentials(id + '-canvas')

    const [initialized, setInitialized] = useState(false)
    const [canRender, setCanRender] = useState(true)
    const [finished, setFinished] = useState(false)

    const load = useContext(LoaderProvider)
    const renderer = useRef()
    let resizeObserver


    useEffect(() => {
        if (gpu && !initialized && id) {
            initializeSkybox(dispatchEntities, gpu)
            initializeLight(dispatchEntities)

            if (initializeSphere)
                initializeMesh(sphereMesh, gpu, IDS.SPHERE, 'Sphere', dispatchEntities, setMeshes)

            if (loadAllMeshes)
                import('../../static/assets/Cube.json')
                    .then(cubeData => {
                        initializeMesh(cubeData, gpu, IDS.CUBE, 'Sphere', dispatchEntities, setMeshes, undefined, true)
                    })
            renderer.current = new Engine(id, gpu)
            renderer.current.camera.notChangableRadius = true
            const deferred = new MeshSystem(gpu, 1)
            load.pushEvent(EVENTS.UPDATING_SYSTEMS)
            setInitialized(true)
            deferred.initializeTextures()
                .then(() => {
                    renderer.current.systems = [
                        new TransformSystem(),
                        new ShadowMapSystem(gpu),
                        deferred,
                        new PostProcessingSystem(gpu,   1)
                    ]
                    renderer.current.camera.radius = 2.5
                    load.finishEvent(EVENTS.UPDATING_SYSTEMS)

                    setFinished(true)
                })
        } else if (gpu && id && initialized && finished) {
            if (!canRender)
                renderer.current?.stop()
            else {
                if (centerOnSphere) {
                    renderer.current.camera.centerOn = [0, 1, 0]
                    renderer.current.camera.updateViewMatrix()
                }
                renderer.current?.start(entities, materials, meshes, {
                    fxaa: true,
                    meshes,
                    gamma: 2.2,
                    exposure: 1.2,
                    materials: [],
                    noRSM: true,
                    shadingModel: SHADING_MODELS.DETAIL,
                    cameraType: CAMERA_TYPES.SPHERICAL
                } )
            }
        }

        return () => {
            renderer.current?.stop()
        }
    }, [
        meshes,
        materials,
        finished,
        initialized,
        entities,
        gpu,
        id,
        canRender
    ])


    return {
        id, load,
        entities, dispatchEntities,
        meshes, setMeshes, gpu,
        material: materials[0], setMaterial: mat => setMaterials([mat]),
        initialized, renderer: renderer.current,
        canRender, setCanRender,
        toImage: () => new Promise(re => re(gpu.canvas.toDataURL()))
    }
}

function initializeSkybox(dispatch, gpu) {
    import('../../static/sky.json')
        .then(img => {
            console.log(img)
            ImageProcessor.getImageBitmap(img.data)
                .then(res => {
                    const newEntity = new Entity(undefined, 'sky')
                    newEntity.addComponent(new SkyboxComponent(undefined, gpu))

                    newEntity.components[COMPONENTS.SKYBOX].blob = res
                    dispatch({
                        type: ENTITY_ACTIONS.ADD,
                        payload: newEntity
                    })
                })
        })

}

function initializeLight(dispatch) {
    const newEntity = new Entity(undefined, 'light')
    const light = new DirectionalLightComponent()
    light.direction = [0, 100, 100]
    dispatch({
        type: ENTITY_ACTIONS.ADD,
        payload: newEntity
    })
    dispatch({
        type: ENTITY_ACTIONS.ADD_COMPONENT,
        payload: {
            entityID: newEntity.id,
            data: light
        }
    })
}

export function initializeMesh(data, gpu, id, name, dispatch, setMeshes, noTranslation, noEntity) {
    let mesh = new MeshInstance({
        ...data,
        id: id,
        gpu: gpu,

    })
    setMeshes(prev => [...prev, mesh])
    if (!noEntity) {
        const newEntity = new Entity(id, name)
        const transformation = new TransformComponent()

        transformation.scaling = data.scaling
        transformation.rotation = data.rotation
        if (!noTranslation)
            transformation.translation = data.translation

        if (id === IDS.SPHERE)
            transformation.translation = [0, 1, 0]
        newEntity.components.MeshComponent = new MeshComponent(undefined, mesh.id)
        newEntity.components.TransformComponent = transformation
        newEntity.components.MaterialComponent = new MaterialComponent(undefined, id === IDS.PLANE ? undefined : IDS.MATERIAL, id === IDS.PLANE)

        dispatch({
            type: ENTITY_ACTIONS.ADD,
            payload: newEntity
        })
    }
}

export const IDS = {
    MATERIAL: '1',
    SPHERE: 'SPHERE-0',
    PLANE: 'PLANE-0',
    TARGET: 'TARGET',
    CUBE: 'CUBE-0'
}