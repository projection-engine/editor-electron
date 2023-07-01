import DynamicMap from "../../engine-core/resource-libs/DynamicMap"
import AbstractSingleton from "../../shared/AbstractSingleton"

export default class AbstractStore extends AbstractSingleton {
	#data: MutableObject = {}
	#listeners = new DynamicMap<string, { callback: Function, dependencies: string[] }>()

	constructor(initialValue: MutableObject) {
		super()
		Object.assign(this.#data, initialValue)
	}

	get data() {
		return this.#data
	}

	updateStore(data = this.#data) {
		const listeners = this.#listeners.array
		for (let i = 0; i < listeners.length; i++) {
			const listener = listeners[i]
			const dependencies = listener.dependencies
			if (dependencies.length === 0)
				listener.callback(data)
			else {
				for (let j = 0; j < dependencies.length; j++) {
					const dep = dependencies[j]
					if (data[dep] !== this.#data[dep]) {
						listener.callback(data)
						break
					}
				}
			}
		}
		this.#data = data
	}

	addListener(id: string, callback: Function, dependencies = []) {
		if (this.#listeners.has(id))
			return
		this.#listeners.set(id, {callback, dependencies})
		callback(this.#data)
	}

	removeListener(id: string) {
		this.#listeners.delete(id)
	}

	updateStoreByKeys(newObject: MutableObject) {
		Object.assign(this.data, newObject)
		this.updateStore()
	}

	static getInstance(): AbstractStore {
		return super.get<AbstractStore>()
	}
}