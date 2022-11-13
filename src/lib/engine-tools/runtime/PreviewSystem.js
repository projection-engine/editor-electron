import {mat4} from "gl-matrix"
import Mesh from "../../../../public/engine/instances/Mesh"
import Material from "../../../../public/engine/instances/Material"
import MaterialAPI from "../../../../public/engine/lib/rendering/MaterialAPI";
import GPU from "../../../../public/engine/GPU";
import STATIC_MESHES from "../../../../public/engine/static/resources/STATIC_MESHES";
import STATIC_FRAMEBUFFERS from "../../../../public/engine/static/resources/STATIC_FRAMEBUFFERS";
import FALLBACK_MATERIAL from "../../../../public/engine/static/FALLBACK_MATERIAL";
import Framebuffer from "../../../../public/engine/instances/Framebuffer";
import GPUAPI from "../../../../public/engine/lib/rendering/GPUAPI";


function getCameraData(pitch, yaw, radius, centerOn) {
    const position = []
    const cosPitch = Math.cos(pitch)
    position[0] = radius * cosPitch * Math.cos(yaw) + centerOn[0]
    position[1] = radius * Math.sin(pitch) + centerOn[1]
    position[2] = radius * cosPitch * Math.sin(yaw) + centerOn[2]
    return [mat4.lookAt([], position, centerOn, [0, 1, 0]), position]
}

const RADIAN_60 = 1.0472, RADIAN_90 = 1.57
export default class PreviewSystem {
    static identity = mat4.create()
    static frameBuffer
    static cameraData = getCameraData(0, RADIAN_90, 2.5, [0, 0, 0])
    static projection = mat4.perspective([], RADIAN_60, 1, .1, 10000)
    static pointLightData = [
        [
            0, 0, 10, 0,
            1, 1, 1, 0,
            .5, 0, 0, 0,
            100, .1, 0, 0
        ],
        [
            0, 0, -10, 0,
            1, 1, 1, 0,
            .5, 0, 0, 0,
            100, .1, 0, 0
        ]
    ]

    static initialize() {
        PreviewSystem.frameBuffer = GPUAPI.allocateFramebuffer(STATIC_FRAMEBUFFERS.EDITOR.PREVIEW, 300, 300).texture()
    }

    static execute(materialMesh, meshEntity) {
        let response

        PreviewSystem.frameBuffer.startMapping()
        if (meshEntity && materialMesh instanceof Mesh) {
            const maxX = materialMesh.maxBoundingBox[0] - materialMesh.minBoundingBox[0],
                maxY = materialMesh.maxBoundingBox[1] - materialMesh.minBoundingBox[1],
                maxZ = materialMesh.maxBoundingBox[2] - materialMesh.minBoundingBox[2]
            const radius = Math.max(maxX, maxY, maxZ)
            const cam = getCameraData(0, RADIAN_90, radius + 2, meshEntity.translation)
            const transformMatrix = meshEntity.matrix
            const pointLightData = [[
                0, meshEntity.translation[1] / 2, radius * 10, 0,
                1, 1, 1, 0,
                .5, 0, 0, 0,
                100, .1, 0, 0
            ],
                [
                    0, meshEntity.translation[1] / 2, -radius * 10, 0,
                    1, 1, 1, 0,
                    .5, 0, 0, 0,
                    100, .1, 0, 0
                ]]

            MaterialAPI.drawMesh(
                undefined,
                materialMesh,
                GPU.materials.get(FALLBACK_MATERIAL),
                undefined,
                {
                    cameraPosition: cam[1],
                    viewMatrix: cam[0],
                    projectionMatrix: PreviewSystem.projection,
                    transformMatrix,

                    normalMatrix: PreviewSystem.identity,
                    directionalLightsQuantity: 0,
                    directionalLightsData: [],
                    dirLightPOV: [],
                    lightQuantity: 2,
                    pointLightData: pointLightData,
                    useCubeMapShader: true
                })
        } else if (materialMesh instanceof Material) {
            const [viewMatrix, cameraPosition] = PreviewSystem.cameraData
            MaterialAPI.drawMesh(
                undefined,
                GPU.meshes.get(STATIC_MESHES.PRODUCTION.SPHERE),
                materialMesh,
                undefined,
                {
                    cameraPosition,
                    viewMatrix,
                    projectionMatrix: PreviewSystem.projection,
                    transformMatrix: PreviewSystem.identity,
                    normalMatrix: PreviewSystem.identity,
                    directionalLightsQuantity: 0,
                    directionalLightsData: [],
                    dirLightPOV: [],
                    lightQuantity: 2,
                    pointLightData: PreviewSystem.pointLightData,

                    useCubeMapShader: true
                })
        }
        PreviewSystem.frameBuffer.stopMapping()

        response = Framebuffer.toImage(PreviewSystem.frameBuffer.FBO)

        return response
    }
}

