import GPUState from "../states/GPUState"
import Engine from "../Engine"
import DEBUG_FRAG from "../static/shaders/uber-shader/UBER-MATERIAL-DEBUG.frag"
import BASIS_FRAG from "../static/shaders/uber-shader/UBER-MATERIAL-BASIS.frag"
import VERTEX_SHADER from "../static/shaders/uber-shader/UBER-MATERIAL.vert"
import Shader from "@engine-core/lib/resources/Shader"

export default class UberShader {

	static #MAX_LIGHTS = 310
	static get MAX_LIGHTS() {
		return UberShader.#MAX_LIGHTS
	}

	static #uberSignature = {}
	static get uberSignature() {
		return UberShader.#uberSignature
	}

	static uber?: Shader
	static uberUniforms?: { [key: string]: WebGLUniformLocation }

	static compile(forceCleanShader?: boolean) {
		UberShader.uber = undefined
		const methodsToLoad = [
				`
            if(isDecalPass){ 
                if(useAlbedoDecal)
                    albedo = texture(sampler1, texCoords).rgb;
                else
                    albedo = vec3(1., 0., 0.);
                if(useMetallicDecal)
                    metallic = texture(sampler2, texCoords).r;
                if(useRoughnessDecal)
                    roughness = texture(sampler3, texCoords).r;
                if(useNormalDecal){
                    computeTBN();
                    N = normalize(TBN * ((texture(sampler4, texCoords).rgb * 2.0)- 1.0));
                }
                else
                    N = normalVec;
                if(useOcclusionDecal)
                    naturalAO = texture(sampler5, texCoords).r;
                
            }
            else
                switch (materialID) {
            `
			], uniformsToLoad = []
		if (!forceCleanShader)
			GPUState.materials.forEach(mat => {
				const declaration = [`case ${mat.bindID}: {`, mat.functionDeclaration, "break;", "}", ""]
				methodsToLoad.push(declaration.join("\n"))
				uniformsToLoad.push(mat.uniformsDeclaration)
			})
		methodsToLoad.push(`
            default:
                N = normalVec;
                break;
            }
        `)

		let fragment = Engine.developmentMode ? DEBUG_FRAG : BASIS_FRAG
		fragment = fragment.replace("//--UNIFORMS--", uniformsToLoad.join("\n"))
		fragment = fragment.replace("//--MATERIAL_SELECTION--", methodsToLoad.join("\n"))

		const shader = new Shader(VERTEX_SHADER, fragment)
		if (shader.messages.hasError) {

			if (!UberShader.uber && !forceCleanShader)
				UberShader.compile(true)
			console.error("Invalid shader", shader.messages)

			return
		}
		if (UberShader.uber)
			GPUState.context.deleteProgram(UberShader.uber.program)

		UberShader.uber = shader
		UberShader.uberUniforms = shader.uniformMap

	}
}