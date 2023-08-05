import Component from "../../components/Component"

export default  [
	Component.number("MASS", "mass", undefined, 0),

	Component.group("INERTIA", [
		Component.array(["X", "Y", "Z"], "inertia",   .001)
	]),
]
