import ShaderNode from "../../ShaderNode"
import DATA_TYPES from "../../../../../../../engine-core/static/DATA_TYPES"
import NODE_TYPES from "../../../libs/material-compiler/templates/NODE_TYPES"
import checkGlslFloat from "../../../utils/check-glsl-float"


export default class Vec3 extends ShaderNode {
    v = [0, 0, 0]
    uniform = false

    constructor() {
        super([
            {
                label: "Dynamic",
                key: "uniform",
                type: DATA_TYPES.CHECKBOX,
            },
            {label: "Vector", key: "v", type: DATA_TYPES.VEC3},
        ], [
            {label: "Value", key: "VEC3_VAR", type: DATA_TYPES.VEC3},
        ])

        this.name = "Vec3"
        this.size = 2
    }

    get type() {
        if (this.uniform)
            return NODE_TYPES.VARIABLE
        else
            return NODE_TYPES.STATIC
    }


    async getInputInstance(index, uniforms, uniformValues) {
        if (this.uniform) {
            uniformValues.push({
                label: this.name,
                key: this.uniformName,
                type: DATA_TYPES.VEC3,
                data: this.v
            })
            uniforms.push({
                label: this.name,
                key: this.uniformName,
                type: DATA_TYPES.VEC3
            })
            return `uniform float ${this.uniformName};`
        }
        return `const vec3 ${this.uniformName} = vec3(${checkGlslFloat(this.v[0])}, ${checkGlslFloat(this.v[1])}, ${checkGlslFloat(this.v[2])});`

    }

    getFunctionCall() {
        this.VEC3_VAR = this.uniformName
        return ""
    }
}