import {useContext, useEffect, useRef, useState} from "react";

import {ENTITY_ACTIONS} from "../../../../engine/utils/entityReducer";
import Entity from "../../../../engine/shared/ecs/basic/Entity";
import sphereMesh from '../../../../engine/editor/assets/Sphere.json'

import EditorEngine from "../../../../engine/editor/EditorEngine";
import TransformSystem from "../../../../engine/shared/ecs/systems/utils/TransformSystem";
import ShadowMapSystem from "../../../../engine/shared/ecs/systems/rendering/ShadowMapSystem";
import SkyboxComponent from "../../../../engine/shared/ecs/components/SkyboxComponent";
import DirectionalLightComponent from "../../../../engine/shared/ecs/components/DirectionalLightComponent";

import MeshComponent from "../../../../engine/shared/ecs/components/MeshComponent";
import TransformComponent from "../../../../engine/shared/ecs/components/TransformComponent";
import MeshInstance from "../../../../engine/shared/instances/MeshInstance";
import {LoaderProvider} from "@f-ui/core";
import {SHADING_MODELS} from "./useSettings";
import EVENTS from "../utils/EVENTS";
import CAMERA_TYPES from "../../../../engine/editor/camera/CAMERA_TYPES";
import MaterialComponent from "../../../../engine/shared/ecs/components/MaterialComponent";

import {v4 as uuidv4} from 'uuid';
import useEngineEssentials from "../../../../engine/shared/useEngineEssentials";
import ImageProcessor from "../../../../engine/utils/image/ImageProcessor";
import COMPONENTS from "../../../../engine/shared/templates/COMPONENTS";

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

    useEffect(() => {
        if (gpu && !initialized && id) {
            initializeSkybox(dispatchEntities, gpu)
            initializeLight(dispatchEntities)

            if (initializeSphere)
                initializeMesh(sphereMesh, gpu, IDS.SPHERE, 'Sphere', dispatchEntities, setMeshes)

            if (loadAllMeshes)
                import('../../../../engine/editor/assets/Cube.json')
                    .then(cubeData => {
                        initializeMesh(cubeData, gpu, IDS.CUBE, 'Sphere', dispatchEntities, setMeshes, undefined, true)
                    })
            renderer.current = new EditorEngine(id, gpu)
            renderer.current.camera.notChangableRadius = true

            load.pushEvent(EVENTS.UPDATING_SYSTEMS)
            setInitialized(true)
            renderer.current.systems = [
                new TransformSystem(),
                new ShadowMapSystem(gpu)
            ]
            renderer.current.camera.radius = 2.5
            load.finishEvent(EVENTS.UPDATING_SYSTEMS)

            setFinished(true)

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
                    exposure: 1,
                    materials: [],
                    noRSM: true,
                    shadingModel: SHADING_MODELS.DETAIL,
                    cameraType: CAMERA_TYPES.SPHERICAL
                })
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
    import('../../../../static/sky.json')
        .then(img => {
            ImageProcessor.getImageBitmap(img.data)
                .then(res => {
                    const newEntity = new Entity(undefined, 'sky')
                    newEntity.addComponent(new SkyboxComponent(undefined, gpu))

                    newEntity.components[COMPONENTS.SKYBOX].blob = res
                    newEntity.components[COMPONENTS.SKYBOX].gamma = .5
                    newEntity.components[COMPONENTS.SKYBOX].exposure = 1
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