import {useContext, useEffect, useState} from "react";
import FileSystem from "../utils/files/FileSystem";
import EVENTS from "../utils/EVENTS";
import ImageProcessor from "../engine/utils/image/ImageProcessor";
import Entity from "../engine/basic/Entity";
import COMPONENTS from "../engine/templates/COMPONENTS";
import SkyboxComponent from "../engine/components/SkyboxComponent";
import FILE_TYPES from "../../../public/project/glTF/FILE_TYPES";
import RenderingPackager from "../engine/RenderingPackager";
import GPUContextProvider from "../components/viewport/hooks/GPUContextProvider";
import VBO from "../engine/instances/VBO";
import ShaderInstance from "../engine/instances/ShaderInstance";
import * as shaderCodeSkybox from "../engine/shaders/CUBE_MAP.glsl";
import * as skyboxCode from "../engine/shaders/SKYBOX.glsl";

export default function useQuickAccess(projectID, load) {
    const [images, setImages] = useState([])
    const [meshes, setMeshes] = useState([])
    const [materials, setMaterials] = useState([])
    const [scripts, setScripts] = useState([])
    const [sampleSkybox, setSampleSkybox] = useState()
    const {gpu} = useContext(GPUContextProvider)
    useEffect(() => {
        if(gpu && !sampleSkybox)
        import('../../static/sky.json')
            .then(img => {

                ImageProcessor.getImageBitmap(img.data)
                    .then(res => {
                        const newEntity = new Entity(undefined, 'sky')
                        newEntity.components[COMPONENTS.SKYBOX] = new SkyboxComponent()
                        newEntity.components[COMPONENTS.SKYBOX].blob = res

                        import('../engine/templates/CUBE')
                            .then(res => {
                                const skyShader = new ShaderInstance(shaderCodeSkybox.vertex, skyboxCode.generationFragment, gpu)
                                const cubeBuffer = new VBO(gpu, 1, new Float32Array(res), gpu.ARRAY_BUFFER, 3, gpu.FLOAT)
                                RenderingPackager.loadSkybox(newEntity, gpu, cubeBuffer, skyShader)
                                setSampleSkybox(newEntity)
                            })
                    })
            })
    }, [gpu])
    const fileSystem = new FileSystem(projectID)
    const refresh = () => {
        fileSystem.readRegistry()
            .then(reg => {
                const imagesReg = (reg.filter(r => r.path.includes(FILE_TYPES.IMAGE)))
                const meshesReg = (reg.filter(r => r.path.includes(FILE_TYPES.MESH)))
                const materialsReg = (reg.filter(r => r.path.includes(FILE_TYPES.MATERIAL)))
                const scriptReg = (reg.filter(r => r.path.includes(FILE_TYPES.RAW_SCRIPT)))

                let promises = []

                promises.push(...imagesReg.map(i => {
                    return new Promise(resolve => {
                        const split = (i.path.split(FileSystem.sep ))
                        resolve({
                            type: 'image',
                            registryID: i.id,
                            name: split[split.length - 1]
                        })
                    })
                }))

                promises.push(...meshesReg.map(i => {
                    return new Promise(resolve => {
                        const split = (i.path.split(FileSystem.sep))
                        resolve({
                            type: 'mesh',
                            registryID: i.id,
                            name: split[split.length - 1]
                        })

                    })
                }))
                promises.push(...materialsReg.map(i => {
                    return new Promise(resolve => {
                        const split = (i.path.split(FileSystem.sep ))
                        resolve({
                            type: 'material',
                            registryID: i.id,
                            name: split[split.length - 1].split('.')[0]
                        })
                    })
                }))
                promises.push(...scriptReg.map(i => {
                    return new Promise(resolve => {
                        const split = (i.path.split(FileSystem.sep))
                        resolve({
                            type: 'flowRaw',
                            registryID: i.id,
                            name: split[split.length - 1].split('.')[0]
                        })
                    })
                }))
                Promise.all(promises)
                    .then(res => {
                        setMeshes(res.filter(f => f.type === 'mesh'))
                        setMaterials(res.filter(f => f.type === 'material'))
                        setImages(res.filter(f => f.type === 'image'))
                        setScripts(res.filter(f => f.type === 'flowRaw'))
                        load.finishEvent(EVENTS.REFRESHING)
                    })

            })
    }
    useEffect(() => {
        refresh()
    }, [])
    return {
        sampleSkybox,
        fileSystem,
        images,
        meshes,
        materials,
        scripts,
        refresh
    }
}