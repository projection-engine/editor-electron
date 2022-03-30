import Node from "../../../../components/flow/Node";
import {TYPES} from "../../../../components/flow/TYPES";
import NODE_TYPES from "../../../../components/flow/NODE_TYPES";


export default class MouseX extends Node {

    constructor() {
        super(
            [],
            [{label: 'Position', key: 'x', type: TYPES.NUMBER}],
        );
        this.name = 'MouseX'
    }

    get type() {
        return NODE_TYPES.DATA
    }

    static compile(tick, inputs, entity, entities, attr, nodeID, exec, setExec, rTarget, keys, {x, y}) {
        const attributes = {...attr}
        attributes[nodeID] = {}
        attributes[nodeID].x = x

        return attributes
    }
}