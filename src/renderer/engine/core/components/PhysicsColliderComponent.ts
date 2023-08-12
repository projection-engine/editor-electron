import Component from "./Component"
import PHYSICS_COLLIDER_PROPS from "../static/component-props/PHYSICS_COLLIDER_PROPS"
import {ColliderTypes, Components,} from "@engine-core/engine.enum";

export default class PhysicsColliderComponent extends Component {
	getDependencies(): Components[] {
		return [Components.TRANSFORMATION, Components.RIGID_BODY];
	}

	static get componentKey(): Components {
		return Components.PHYSICS_COLLIDER
	}
	getComponentKey(): Components {
		return PhysicsColliderComponent.componentKey
	}

	_props = PHYSICS_COLLIDER_PROPS
	collisionType = ColliderTypes.BOX
	direction = "Y"
	_center = [0, 0, 0]
	_size = [1, 1, 1]
	_height = 1
	_radius = 1
	initialized =false
	#shape?: btBoxShape | btSphereShape

	get shape(): btBoxShape | btSphereShape | undefined {
		return this.#shape
	}

	set shape(data) {
		this.#shape = data
	}

	get center(): number[] {
		return this._center
	}

	set center(data) {
		this._center = data
	}

	get size(): number[] {
		return this._size
	}

	set size(data) {
		this._size = data
	}

	get height(): number {
		return this._height
	}

	set height(data) {
		this._height = data
	}

	get radius(): number {
		return this._radius
	}

	set radius(data) {
		this._radius = data
	}


}
