import {mat4, quat} from "gl-matrix";
import Transformation from "../../../../engine/utils/workers/Transformation";
import ImageProcessor from "../../../image/ImageProcessor";
import ROTATION_TYPES from "../../../../engine/templates/ROTATION_TYPES";
import Material from "../../../../../views/blueprints/material/nodes/Material";
import emptyMaterial from '../../../../utils/emptyMaterial.json'

import {v4 as uuidv4} from 'uuid';

const fs = window.require('fs')
const path = window.require('path')


export function materialParser(basePath, material, textures, images) {
    return new Promise(resolve => {
        // let materialObj = {
        //     name: ,
        //
        //     emissiveFactor: material.emissiveFactor,
        // }
        // TODO - EMISSIVE
        let promises = []


        if (material.pbrMetallicRoughness) {
            if (material.pbrMetallicRoughness.baseColorTexture)
                promises.push(loadTexture('albedo', basePath, material.pbrMetallicRoughness.baseColorTexture, textures, images))
            else if (material.pbrMetallicRoughness.baseColorFactor)
                promises.push(new Promise(async resolve => resolve({
                    key: 'albedo',
                    data: await ImageProcessor.colorToImage(material.pbrMetallicRoughness.baseColorFactor)
                })))

            if (material.pbrMetallicRoughness.metallicRoughnessTexture) {
                promises.push(loadTexture('metallic', basePath, material.pbrMetallicRoughness.metallicRoughnessTexture, textures, images, [0, 0, 1, 1]))
                promises.push(loadTexture('roughness', basePath, material.pbrMetallicRoughness.metallicRoughnessTexture, textures, images, [0, 1, 0, 1]))
            } else {
                const m = material.pbrMetallicRoughness.metallicFactor,
                    r = material.pbrMetallicRoughness.roughnessFactor
                if (m)
                    promises.push(new Promise(async resolve => resolve({
                        key: 'metallic',
                        data: await ImageProcessor.colorToImage([m, m, m, 1])
                    })))
                if (r)
                    promises.push(new Promise(async resolve => resolve({
                        key: 'roughness',
                        data: await ImageProcessor.colorToImage([r, r, r, 1])
                    })))
            }
        }

        if (material.normalTexture)
            promises.push(loadTexture('normal', basePath, material.normalTexture, textures, images))

        if (material.occlusionTexture)
            promises.push(loadTexture('ao', basePath, material.occlusionTexture, textures, images, material.pbrMetallicRoughness.metallicRoughnessTexture?.index === material.occlusionTexture?.index ? [1, 0, 0, 1] : undefined))

        if (material.heightTexture)
            promises.push(loadTexture('height', basePath, material.heightTexture, textures, images))


        Promise.all(promises)
            .then(result => {
                const mat = new Material()
                mat.id = emptyMaterial.response.id
                mat.compile(result).then(() => {
                    resolve({
                        name: material.name,
                        response: mat,
                        id: uuidv4()
                    })
                })

            })

    })
}

function loadTexture(key, basePath, texture, textures, images, channels) {

    return new Promise(resolve => {
        const index = texture.index
        const source = index !== undefined ? textures[index] : undefined
        const imgURI = source !== undefined ? images[source.source] : undefined

        if (imgURI !== undefined) {
            let file

            if (typeof imgURI.uri === 'string' && imgURI.uri.includes('data:image'))
                file = imgURI.uri
            else {
                const resolved = path.resolve(basePath + '\\' + imgURI.uri)
                try {
                    file = fs.readFileSync(resolved, {encoding: 'base64'})
                } catch (e) {
                }
            }

            if (file) {
                file = `data:image/${imgURI.uri.split('.').pop()};base64, ` + file
                if (channels !== undefined && channels.length === 4)
                    ImageProcessor.byChannels(channels, file)
                        .then(f => {
                            resolve({key, data: f})
                        })
                        .catch(() => resolve({key}))
                else
                    resolve({key, data: file})
            } else
                resolve({key})
        } else
            resolve({key})
    })

}

export function nodeParser(node, allNodes, parentTransform) {
    let res = []
    let children = node.children && node.children.length > 0 ? allNodes
            .map((n, index) => {
                if (node.children.includes(index))
                    return {...allNodes[index], index}
                else
                    return undefined
            }).filter(e => e !== undefined)
        :
        []


    let parsedNode = {
        name: node.name,
        meshIndex: node.mesh,
        scaling: [1, 1, 1],
        rotation: [0, 0, 0],
        translation: [0, 0, 0],
        children: []
    }
    let transformationMatrix
    if (node.matrix) {
        parsedNode = {
            ...parsedNode,
            ...Transformation.extractTransformations(node.matrix)
        }
        transformationMatrix = node.matrix
    } else {
        let translation = node.translation,
            rotation = node.rotation,
            scale = node.scale

        if (!translation)
            translation = [0, 0, 0]
        if (!scale)
            scale = [1, 1, 1]
        if (!rotation)
            parsedNode.rotationQuad = [0, 0, 0, 1]
        else
            parsedNode.rotationQuat = quat.normalize([], rotation)

        parsedNode.scaling = scale
        parsedNode.translation = translation
        transformationMatrix = Transformation.transform(parsedNode.translation, parsedNode.rotation, parsedNode.scaling, ROTATION_TYPES.GLOBAL)
    }


    if (parentTransform) {
        mat4.multiply(
            transformationMatrix,
            parentTransform,
            transformationMatrix
        )
        parsedNode = {
            ...parsedNode,
            ...Transformation.extractTransformations(transformationMatrix)
        }
    }
    children = children
        .map(child => {
            return nodeParser(child, allNodes, transformationMatrix)
        })
        .flat()

    res.push(...children)
    if (node.mesh !== undefined)
        res.push(parsedNode)
    return res
}


export function getPrimitives(mesh, materials = []) {
    const primitives = mesh.primitives;

    primitives.forEach(primitive => {
        primitive.attributes = Object.keys(primitive.attributes).map(name => ({
            name,
            index: primitive.attributes[name]
        }))

        if (typeof primitive.material !== "undefined") {
            primitive.material = materials[primitive.material];
        }
    });
    return primitives.map(p => {
        const vert = p.attributes.find(d => d.name === 'POSITION')
        const norm = p.attributes.find(d => d.name === 'NORMAL')
        const tang = p.attributes.find(d => d.name === 'TANGENT')
        const uv = p.attributes.find(d => d.name === 'TEXCOORD_0')

        return {
            indices: p.indices,
            vertices: vert ? vert.index : -1,
            tangents: tang ? tang.index : -1,
            normals: norm ? norm.index : -1,
            uvs: uv ? uv.index : -1,
            material: p.material
        }
    })
}