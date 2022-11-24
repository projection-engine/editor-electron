import cloneClass from "../../../../../../public/engine/utils/clone-class";
import NODE_TYPES from "../templates/NODE_TYPES";
import resolveRelationship from "./resolve-relationship";
import getShaderTemplate from "./get-shader-template";

export default async function compileFragmentShader(n, links, shadingType, discardedLinks = ["worldOffset"], noAmbient) {
    const nodes = n.map(nn =>  cloneClass(nn))
    const startPoint = nodes.find(n => n.type === NODE_TYPES.OUTPUT)
    startPoint.shadingType = shadingType
    if (noAmbient)
        startPoint.ambientInfluence = false
    const codeString = getShaderTemplate(shadingType),
        uniforms = [],
        uniformData = []
    let toJoin = [], typesInstantiated = {}
    nodes.forEach(n => {
        if (n.type === NODE_TYPES.FUNCTION && !typesInstantiated[n.constructor.name]) {
            toJoin.push(n.getFunctionInstance())
            typesInstantiated[n.constructor.name] = true
        }
    })
    codeString.functions = toJoin.join("\n")
    toJoin = []
    typesInstantiated = {}
    for(let i =0; i < nodes.length; i++){
        const n = nodes[i]
        if (typeof n.getInputInstance === "function" && !typesInstantiated[n.id]) {
            const res = await n.getInputInstance(i, uniforms, uniformData)
            toJoin.push(res)
            typesInstantiated[n.id] = true
        }
    }
    codeString.inputs = toJoin.join("\n")


    let body = []
    console.log(links)
    resolveRelationship(startPoint, [], links.filter(l => l.targetRef.id !== startPoint.id || l.targetRef.id === startPoint.id && !discardedLinks.includes(l.targetRef.attribute.key)), nodes, body, false)
    return {
        code: `
            ${codeString.static}
            ${codeString.inputs}
            ${codeString.functions}
            ${codeString.wrapper(body.join("\n"), startPoint.ambientInfluence)}
        `,
        uniforms,
        uniformData
    }

}