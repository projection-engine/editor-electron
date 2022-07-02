import {useCallback, useEffect} from "react"
import ProjectLoader from "../utils/ProjectLoader"
import FileSystem from "../utils/files/FileSystem"


export default function useSerializer(engine, settings, id) {
    let interval
    useEffect(() => {
        interval = setInterval(save, 300000)
        return () => {
            if(interval)
                clearInterval(interval)
        }
    }, [settings, engine.entities])

    const save = useCallback(async () => {
        if (id) {
            let promise = []
            if (id) {
                const canvas = window.gpu.canvas
                const res = await window.fileSystem.readFile(window.fileSystem.path + FileSystem.sep + ".meta")
                if (res) {
                    const old = JSON.parse(res.toString())
                    await window.fileSystem
                        .updateProject(
                            {
                                ...old,
                                entities: engine.entities.length,
                                meshes: engine.meshes.length,
                                materials: engine.materials.length,
                                lastModification: (new Date()).toDateString(),
                                creation: settings.creationDate
                            },
                            {
                                ...settings,
                                cameraPosition: window.renderer.camera.position,
                                yaw: window.renderer.camera.yaw,
                                pitch: window.renderer.camera.pitch,
                            })
                }
            }
            await Promise.all(promise)
            const all = await ProjectLoader.getEntities( )
            await Promise.all(all.map(a => {
                if (a && !engine.entities.find(e => e.id === a.id))
                    return window.fileSystem.deleteFile("logic" + FileSystem.sep + a.id + ".entity")
            }).filter(e => e))

            try {
                await Promise.all(engine.entities.map(e => {
                    const str = JSON.stringify(e)
                    return window.fileSystem.updateEntity(str, e.id)
                }))
            } catch (err) {
                console.error(err)
                alert.pushAlert("Error saving project", "error")
            }
            alert.pushAlert(
                "Project saved.",
                "success"
            )
        } else
            alert.pushAlert("Error saving project", "error")
    }, [engine.entities, settings])
    return save
}

