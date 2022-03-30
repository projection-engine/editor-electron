import Node from "../../../../components/flow/Node";
import {TYPES} from "../../../../components/flow/TYPES";
import NODE_TYPES from "../../../../components/flow/NODE_TYPES";


export default class MouseY extends Node {

    constructor() {
        super(
            [],
            [{label: 'Position', key: 'y', type: TYPES.NUMBER}],
        );
        this.name = 'MouseY'
    }

    get type() {
        return NODE_TYPES.DATA
    }

    static compile(tick, inputs, entity, entities, attr, nodeID, exec, setExec, rTarget, keys, {x, y}) {
        const attributes = {...attr}
        attributes[nodeID] = {}
        attributes[nodeID].y = y
        return attributes
    }
}