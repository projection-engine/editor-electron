import styles from "../styles/SideBar.module.css"
import {Button} from "@f-ui/core"

import PropTypes from "prop-types"
import ThemeProvider from "../../project/utils/hooks/ThemeProvider"
import React, {useContext, useState} from "react"

export default function SideBar(props) {
    const theme = useContext(ThemeProvider)
    const [extended, setExtended] = useState(false)

    const {
        open, setOpen
    } = props
    return (
        <div className={styles.wrapper} data-extended={`${extended}`}>
            <div style={{width: "100%", overflow: "hidden", height: "100%"}}>
                <div className={styles.block}>
                    <Button onClick={() => setOpen(0)}
                        className={styles.button}
                        variant={open === 0 ? "filled" : undefined}
                        styles={{justifyContent: !extended ? "center" : undefined}}
                    >
                        <span
                            style={{width: "30px"}}
                            className={"material-icons-round"}>inventory_2</span>
                        {extended ? "Projects" : undefined}
                    </Button>

                    <Button onClick={() => setOpen(1)}
                        className={styles.button}
                        variant={open === 1 ? "filled" : undefined}
                        styles={{justifyContent: !extended ? "center" : undefined}}
                    >
                        <span
                            style={{width: "30px"}}
                            className={"material-icons-round"}>chat_bubble</span>
                        {extended ? "Give feedback" : undefined}
                    </Button>
                </div>
            </div>
            <div className={styles.block} style={{transform: "none", height: "100%", alignContent: "flex-end"}}>
                <Button onClick={() => theme.setDark(!theme.dark)}
                    className={styles.button}
                    styles={{justifyContent: !extended ? "center" : undefined}}
                >
                    <span style={{width: "30px"}}
                        className={"material-icons-round"}>{theme.dark ? "dark_mode" : "light_mode"}</span>
                    {extended ? "Theme" : undefined}
                </Button>


                <Button onClick={() => setExtended(!extended)}
                    styles={{justifyContent: !extended ? "center" : undefined}}
                    className={styles.button}
                >
                    <span style={{width: "30px"}}
                        className={"material-icons-round"}>{extended ? "chevron_right" : "chevron_left"}</span>
                    {extended ? "Hide" : undefined}
                </Button>
            </div>
        </div>

    )
}

SideBar.propTypes = {
    open: PropTypes.number,
    setOpen: PropTypes.func
}