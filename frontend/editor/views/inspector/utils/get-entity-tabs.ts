import getComponentIcon from "../../../utils/get-component-icon"
import getComponentLabel from "../../../utils/get-component-label"
import LocalizationEN from "../../../../../shared/LocalizationEN";


export default function getEntityTabs(components) {
	return [

		{icon: "settings", label: LocalizationEN.ENTITY_PROPERTIES, index: -1, color: "var(--pj-accent-color-secondary)"},
		{icon: "code", label: LocalizationEN.CUSTOM_COMPONENTS, index: -2, color: "var(--pj-accent-color-secondary)"},
		{divider: true},
		...components.map((c, i) => ({
			icon: getComponentIcon(c.componentKey),
			label: getComponentLabel(c.componentKey),
			index: i, color: "var(--pj-accent-color-tertiary)"
		}))
	]
}