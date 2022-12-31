import ShaderNode from "../../ShaderNode"
import DATA_TYPES from "../../../../../../../engine-core/static/DATA_TYPES"
import NODE_TYPES from "../../../libs/material-compiler/templates/NODE_TYPES"


export default class AbsoluteWorldPosition extends ShaderNode {

    constructor() {
        super([], [
            {label: "Coordinates", key: "worldSpacePosition", type: DATA_TYPES.VEC3}
        ])

        this.name = "AbsoluteWorldPosition"
        this.size = 2
    }

    get type() {
        return NODE_TYPES.STATIC
    }
    getFunctionCall( ) {
        this.worldSpacePosition = "worldSpacePosition"
        return ""
    }
}