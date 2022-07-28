import Node from "../Node"
import {DATA_TYPES} from "../../../../../engine/data/DATA_TYPES"
import NODE_TYPES from "../../../data/NODE_TYPES"


export default class AbsoluteWorldPosition extends Node {

    constructor() {
        super([], [
            {label: "Coordinates", key: "vPosition", type: DATA_TYPES.VEC4}
        ])

        this.name = "AbsoluteWorldPosition"
        this.size = 2
    }

    get type() {
        return NODE_TYPES.STATIC
    }
    getFunctionCall( ) {
        this.vPosition = "vPosition"
        return ""
    }
}