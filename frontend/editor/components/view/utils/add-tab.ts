export default function addTab(tabs, setTabs, groupIndex, item) {
    const clone  = [...tabs]
    clone[groupIndex].push({color: [255, 255, 255], type: item.id})
    setTabs(clone)
}