import GPUState from "../states/GPUState";

export default class GPUUtil{
    static bind2DTextureForDrawing(uniform:WebGLUniformLocation, activeIndex:number, sampler:WebGLTexture){
        const context = GPUState.context
        context.activeTexture(context.TEXTURE0 + activeIndex)
        context.bindTexture(context.TEXTURE_2D, sampler)
        context.uniform1i(uniform, activeIndex)
    }
}
