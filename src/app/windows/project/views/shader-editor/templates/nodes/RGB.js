import Node from "./Node"
import {DATA_TYPES} from "../../../../engine/data/DATA_TYPES"
import NODE_TYPES from "../../data/NODE_TYPES"
import checkFloat from "../../utils/checkFloat"


export default class RGB extends Node {
    v = [0, 0, 0]
    uniform = false

    constructor() {
        super([
            {
                label: "Dynamic",
                key: "uniform",
                type: DATA_TYPES.CHECKBOX,
                info: "Allow node to be set dynamically"
            },
            {label: "Color", key: "v", type: DATA_TYPES.COLOR},
        ], [
            {label: "Value", key: "COLOR_RGB", type: DATA_TYPES.VEC3},
        ])
        this.name = "RGB"
    }

    get type() {
        return NODE_TYPES.STATIC
    }

    async getInputInstance(index, uniforms, uniformData) {
        const v = this.v
        if (this.uniform) {
            this.uniformName = `COLOR_RGB${index}`
            uniformData.push({
                key: this.uniformName,
                data: v.map(i => i / 255),
                type: DATA_TYPES.VEC3
            })
            uniforms.push({
                label: this.name,
                key: this.uniformName,
                type: DATA_TYPES.VEC3,
                value: v.map(i => i / 255),
                normalized: true
            })

            return `uniform vec3 ${this.uniformName};`
        } else {
            this.uniformName = `COLOR_RGB${index}`

            return `#define ${this.uniformName} vec3(${checkFloat(v[0] / 255)}, ${checkFloat(v[1] / 255)}, ${checkFloat(v[2] / 255)})`
        }
    }

    getFunctionCall(_, index) {
        this.COLOR_RGB = "COLOR_RGB" + index
        return ""
    }
}