import GPUState from "../states/GPUState"
import CameraManager from "../managers/CameraManager"
import StaticFBOState from "../states/StaticFBOState"
import StaticShadersState from "../states/StaticShadersState"
import StaticMeshesState from "../states/StaticMeshesState"
import Framebuffer from "@engine-core/lib/resources/Framebuffer"
import MetricsManager from "../managers/MetricsManager"
import METRICS_FLAGS from "../static/METRICS_FLAGS"
import GPUUtil from "../utils/GPUUtil";
import AbstractSystem from "../AbstractSystem";

export default class BloomSystem extends AbstractSystem{

    shouldExecute(): boolean {
        return CameraManager.bloom;
    }

    execute() {
        const context = GPUState.context
        StaticFBOState.lens.startMapping()
        StaticShadersState.bloom.bind()
        GPUUtil.bind2DTextureForDrawing(StaticShadersState.bloomUniforms.sceneColor, 0, StaticFBOState.postProcessing1Sampler)

        context.uniform1f(StaticShadersState.bloomUniforms.threshold, CameraManager.bloomThreshold)
        StaticMeshesState.drawQuad()
        StaticFBOState.lens.stopMapping()

        StaticShadersState.gaussian.bind()
        const downscale = StaticFBOState.downscaleBloom
        const upscale = StaticFBOState.upscaleBloom
        for (let i = 0; i < downscale.length; i++) {
            this.#downscale(downscale[i], i > 0 ? downscale[i - 1].colors[0] : StaticFBOState.lensSampler)
        }
        StaticShadersState.upSampling.bind()

        for (let i = 0; i < upscale.length; i++) {
            const fbo = upscale[i]
            this.#upscale(fbo, context, i > 0 ? upscale[i - 1].colors[0] : undefined, downscale[downscale.length - 1 - i].colors[0])
        }
        this.#upscale(StaticFBOState.postProcessing2, context, StaticFBOState.postProcessing1Sampler, upscale[upscale.length - 1].colors[0])
        MetricsManager.currentState = METRICS_FLAGS.BLOOM
    }

    #upscale(fbo: Framebuffer, context: WebGL2RenderingContext, nextSampler: WebGLTexture, blurredSampler: WebGLTexture) {
        const upSamplingShaderUniforms = StaticShadersState.upSamplingUniforms
        fbo.startMapping()

        GPUUtil.bind2DTextureForDrawing(upSamplingShaderUniforms.nextSampler, 0, nextSampler)
        GPUUtil.bind2DTextureForDrawing(upSamplingShaderUniforms.blurred, 1, blurredSampler)

        context.uniform1f(upSamplingShaderUniforms.sampleScale, CameraManager.bloomOffset)
        StaticMeshesState.drawQuad()
        fbo.stopMapping()
    }

    #downscale(fbo: Framebuffer, sceneColor: WebGLTexture) {
        const context = GPUState.context
        const uniforms = StaticShadersState.gaussianUniforms
        fbo.startMapping()
        GPUUtil.bind2DTextureForDrawing(uniforms.sceneColor, 0, sceneColor)
        context.uniform1f(uniforms.blurRadius, 10)
        context.uniform1i(uniforms.samples, CameraManager.bloomQuality)
        context.uniform2fv(uniforms.bufferResolution, fbo.resolution)

        StaticMeshesState.drawQuad()
        fbo.stopMapping()
    }

}
