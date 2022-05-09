import React, {useEffect, useState} from 'react'
import ReactDOM from 'react-dom'
import '../styles/globals.css'
import {Fabric} from "@f-ui/core";
import styles from '../styles/App.module.css'
import ThemeProvider from "../project/hooks/ThemeProvider";
import useGlobalOptions from "../project/hooks/useGlobalOptions";
import useLoader from "../components/loader/useLoader";
import LoaderProvider from "../components/loader/LoaderProvider";
import Project from "./Project";
import useGPU from "../components/viewport/hooks/useGPU";
import GPUContextProvider from "../components/viewport/hooks/GPUContextProvider";
import useSettings from "./hooks/useSettings";

const {ipcRenderer} = window.require('electron')

function EntryPoint() {
    const global = useGlobalOptions()
    const loader = useLoader(global.dark, global.accentColor)
    const [project, setProject] = useState()
    const [events, setEvents] = useState({})
    const [initialized, setInitialized] = useState(false)
    const settings = useSettings()
    const gpuContext = useGPU(initialized, settings.resolution)

    useEffect(() => {
        ipcRenderer.send('load-page')
        ipcRenderer.on('page-load-props', (ev, data) => {
            setProject(data.package)
            setEvents(data)
        })
    }, [])

    return (<Fabric
        language={"en"}
        theme={global.dark ? 'dark' : "light"}
        accentColor={global.accentColor}
        backgrounds={{
            primary: '#f0f0f0', secondary: '#e5e5e5', tertiary: '#e0e0e0', quaternary: '#d5d5d5'
        }}
        borders={{
            primary: '#e8e8e8'
        }}
        className={[styles.wrapper, global.dark ? styles.dark : styles.light].join(' ')}
    >
        <LoaderProvider.Provider value={loader}>
            <ThemeProvider.Provider value={{
                ...global, themeClass: global.dark ? styles.dark : styles.light
            }}>
                <GPUContextProvider.Provider value={gpuContext}>
                    {project ? <Project
                        settings={settings}
                        initialized={initialized}
                        setInitialized={setInitialized}
                        events={events}
                        id={project.id}
                        meta={project.meta}
                    /> : null}
                </GPUContextProvider.Provider>
            </ThemeProvider.Provider>
        </LoaderProvider.Provider>
    </Fabric>)
}


ReactDOM.render(<React.StrictMode>
    <EntryPoint/>
</React.StrictMode>, document.getElementById('root'))