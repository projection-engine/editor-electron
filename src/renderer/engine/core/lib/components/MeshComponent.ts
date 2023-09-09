import AbstractComponent from "@engine-core/lib/components/AbstractComponent"
import MaterialManager from "@engine-core/managers/MaterialManager"
import GPUState from "@engine-core/states/GPUState"
import {Components,} from "@engine-core/engine.enum";

export default class MeshComponent extends AbstractComponent {
    getDependencies(): Components[] {
        return [Components.TRANSFORMATION, Components.CULLING];
    }

    static get componentKey(): Components {
        return Components.MESH
    }

    getComponentKey(): Components {
        return MeshComponent.componentKey
    }

    castsShadows = true
    meshID?: string
    _materialID?: string

    _mappedUniforms = {}
    #materialUniforms: MaterialUniform[] = []

    updateMaterialUniformValue(key: string, value: any) {
        this._mappedUniforms[key] = value
    }

    get mappedUniforms() {
        return this._mappedUniforms
    }

    contributeToProbes = true
    overrideMaterialUniforms = false

    resetUniforms = () =>  {
        if (!this.materialID)
            return
        const mat = GPUState.materials.get(this.materialID)
        this.#materialUniforms = mat.uniforms
        this._mappedUniforms = {}
        MaterialManager.mapUniforms(this.#materialUniforms, this._mappedUniforms).catch(console.error)
    }

    set materialID(materialID) {
        this._mappedUniforms = {}
        this.#materialUniforms = null
        this._materialID = materialID
    }

    get materialUniforms(): MaterialUniform[] {
        return this.#materialUniforms
    }

    get materialID() {
        return this._materialID
    }

}
