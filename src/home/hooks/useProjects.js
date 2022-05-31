import {AlertProvider} from "@f-ui/core"
import {useContext, useEffect, useRef, useState} from "react"
import LoaderProvider from "../../components/loader/LoaderProvider"
import AsyncFS from "../../project/utils/AsyncFS"
import FileSystem from "../../project/utils/files/FileSystem"

const path = window.require("path")

export default function useProjects() {
    const [projects, setProjects] = useState([])
    const [startPath, setStartPath] = useState()
    const load = useContext(LoaderProvider)
    const alert = useContext(AlertProvider)

    const uploadRef = useRef()

    const refresh = async (path) => {

        alert.pushAlert('Loading projects', 'info')
        const [e, res] = await AsyncFS.readdir(path)
        if (!(await AsyncFS.exists(path))) await AsyncFS.mkdir(path)

        if (!e) {
            const data = []
            for (let i in res) {
                const f = res[i]
                let filename = path + f;
                const [_, stat] = await AsyncFS.lstat(filename)
                console.log(await AsyncFS.lstat(filename))
                if (stat && stat.isDirectory) {
                    const [e1, meta] = await AsyncFS.read(filename + '/.meta')
                    const [e2, settings] = await AsyncFS.read(filename + '/.settings')
                    const parts = filename.split(FileSystem.sep)
                    data.push({
                        id: parts.pop(),
                        meta: meta ? JSON.parse(meta) : undefined,
                        settings: settings ? JSON.parse(settings) : undefined
                    })
                }
            }
            setProjects(data.filter(e => e !== undefined).map(e => {
                let res = {...e}
                if (!res.meta) res.meta = {name: 'New project'}
                if (!res.settings) res.settings = {}

                if (!res.meta.name) res.meta.name = 'New project'
                return res
            }))
        }
    }

    useEffect(() => {

        let b = localStorage.getItem('basePath')
        if (localStorage.getItem('basePath') === null) {
            b = window.require("os").homedir() + path.sep + 'ProjectionEngineProjects' + path.sep
            localStorage.setItem('basePath', b)
        }
        AsyncFS.mkdir(b).then(res => {
            console.log(res)
        })
        setStartPath(b + 'projects')
        refresh(b + 'projects' + FileSystem.sep).catch()

    }, [])

    return {
        alert,
        projects,
        setProjects,
        setAlert: ({type, message}) => alert.pushAlert(message, type),
        load,
        uploadRef,
        refresh,
        startPath,
        setStartPath
    }
}