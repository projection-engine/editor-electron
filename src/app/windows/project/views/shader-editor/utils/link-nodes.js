import DATA_TYPES from "../../../libs/engine/production/data/DATA_TYPES";

export default function linkNodes(data, inputData, node, handleLink) {
    if (inputData.accept.includes(data.type) || inputData.accept.includes(DATA_TYPES.ANY))
        handleLink(
            {attribute: data, id: data.nodeID},
            {attribute: inputData, id: node.id}
        )

    else
        alert.pushAlert(
            "Invalid type",
            "error"
        )
}