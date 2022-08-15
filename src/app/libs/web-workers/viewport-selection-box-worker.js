import COMPONENTS from "../../windows/project/libs/engine/data/COMPONENTS";

export default function viewportSelectionBoxWorker(){
    const src = ` 
    self.onmessage = ({data: {entities, data}}) => {
        const COMPONENTS = ${JSON.stringify(COMPONENTS)}
        const selected = [], ids = []
        for (let i = 0; i < data.length; i += 4) {
            const ID =  Math.round((data[i + 1] + data[i + 2]) * 255)
            if(ID > 0 && !selected.includes(ID)) {
    
                const found = entities.find(e => {
                    const pick = e.components[COMPONENTS.PICK].__pickID
                    return pick[0] * 255 + pick[1] * 255 + pick[2] * 255 === ID
                })
                if (found) {
                    selected.push(ID)
                    ids.push(found.id)
                }
            }
        }
        self.postMessage(ids)
    }
    `
    const workerBlob = new Blob([src], {type: "application/javascript"});
    const workerUrl = URL.createObjectURL(workerBlob);
    return new Worker(workerUrl);
}