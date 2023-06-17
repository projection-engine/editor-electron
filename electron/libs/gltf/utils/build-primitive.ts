import PrimitiveProcessor from "../../../../engine-core/lib/math/PrimitiveProcessor"
import getPrimitiveIndices from "./get-primitive-indices"
import {mat4} from "gl-matrix"

const IDENTITY = Array.from(mat4.create())


export default async function buildPrimitive(materialsMap, meshName, index, primitive, accessors) {
	const indices = getPrimitiveIndices(primitive)

	if (!accessors[indices.vertices])
		return

	const [min, max] = PrimitiveProcessor.computeBoundingBox(accessors[indices.vertices].data)

	const normals = (indices.normals === -1 || indices.normals === undefined) ? PrimitiveProcessor.computeNormals(accessors[indices.indices]?.data, accessors[indices.vertices]?.data) : accessors[indices.normals]?.data
	const tangents = (indices.tangents === -1 || indices.tangents === undefined) ? PrimitiveProcessor.computeTangents(accessors[indices.indices]?.data, accessors[indices.vertices]?.data, accessors[indices.uvs]?.data, normals) : accessors[indices.tangents]?.data

	return {
		material: materialsMap[primitive.material],
		indices: accessors[indices.indices]?.data,
		vertices: accessors[indices.vertices]?.data,
		tangents: tangents,
		normals: normals,
		uvs: accessors[indices.uvs]?.data,
		maxBoundingBox: max,
		minBoundingBox: min,
		name: meshName + "-" + index,
		baseTransformationMatrix: IDENTITY
	}

}
