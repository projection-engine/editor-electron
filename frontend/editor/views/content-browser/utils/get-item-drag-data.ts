import getIcon from "./get-icon"
import SelectionStore from "../../../../shared/stores/SelectionStore"


export default function getItemDragData(icon, childQuantity, data, items, setOnDrag, type, metadata){
	return  {
		dragImage: `
                <span data-svelteicon="-" style="font-size: 70px">${getIcon(icon, metadata, childQuantity, type)}</span>
                ${data.name}
            `,
		onDragOver: () => type === 0 ? "Link folder" : undefined,
		onDragEnd: () => setOnDrag(false),
		onDragStart: () => {
			setOnDrag(true)
			const ss = SelectionStore.contentBrowserSelected.map(s => items.find(i => i.id === s))
			if (ss.length > 0)
				return JSON.stringify(ss.map(s => s?.registryID))
			return JSON.stringify([type === 1 ? data.registryID : data.id])
		}
	}
}