import SETTINGS from "../editor/static/SETTINGS"
import ChangesTrackerStore from "./ChangesTrackerStore"
import StoreIPCListener from "../shared/lib/StoreIPCListener"
import UIDataStores from "../../shared/UIDataStores"
import AbstractStore from "./AbstractStore"

export default class SettingsStore extends AbstractStore{
	static noPush = false
	static #wasInitialized = false

	constructor() {
		super(SETTINGS)
	}

	updateStore(value) {
		if (SettingsStore.#wasInitialized)
			ChangesTrackerStore.getInstance().updateStore({changed: true})
		SettingsStore.#wasInitialized = true
		super.updateStore(value)
		if (!SettingsStore.noPush)
			StoreIPCListener.getInstance().onUpdate(this.data, UIDataStores.SETTINGS)
	}
}
