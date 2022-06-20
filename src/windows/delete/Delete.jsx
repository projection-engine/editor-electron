import React, {useEffect} from "react"
import ReactDOM from "react-dom"
import "../../styles/globals.css"
import {ThemeProvider} from "@f-ui/core"
import styles from "../../styles/App.module.css"
import Frame from "../../components/frame/Frame"
import FRAME_EVENTS from "../../../public/static/FRAME_EVENTS"

function Delete() {
    useEffect(() => {
        document.body.classList.add(styles.dark)
    }, [])

    return (
        <ThemeProvider
            language={"en"}
            theme={"dark"}
            className={styles.wrapper}
        >
            <Frame 
                label={"Editor shortcuts"}
                options={[]}
                pageInfo={{
                    closeEvent: FRAME_EVENTS.CLOSE_SHORTCUTS,
                    minimizeEvent: FRAME_EVENTS.MINIMIZE_SHORTCUTS,
                    maximizeEvent: FRAME_EVENTS.MAXIMIZE_SHORTCUTS
                }}
            />
        </ThemeProvider>
    )
}


ReactDOM.render(
    <React.StrictMode>
        <Delete/>
    </React.StrictMode>,
    document.getElementById("root")
)