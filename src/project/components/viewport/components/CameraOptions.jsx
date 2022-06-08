import styles from "../styles/ViewportOptions.module.css"
import PropTypes from "prop-types"
import RENDER_TARGET from "../../../../static/misc/RENDER_TARGET"
import {Button, Dropdown, DropdownOption, DropdownOptions, ToolTip} from "@f-ui/core"
import React, {useContext, useMemo, useState} from "react"
import EditorCamera from "../../../engine-extension/camera/EditorCamera"
import {handleGrab} from "../transformCamera"
import Range from "../../../../components/range/Range"
import SettingsProvider from "../../../hooks/SettingsProvider"
import CAMERA_GIZMO from "../../../engine-extension/CAMERA_GIZMO"
import CameraGizmo from "./CameraGizmo"

export default function CameraOptions(props) {
    const  settingsContext = useContext(SettingsProvider)
    const {engine} = props
    const [cameraIsOrthographic, setCameraIsOrthographic] = useState(props.engine?.renderer?.camera?.ortho)

    const cameraIcon = useMemo(() => {
        if (!cameraIsOrthographic)
            return (
                <div
                    style={{width: "20px", height: "20px", perspective: "40px", transformStyle: "preserve-3d"}}>
                    <span
                        style={{fontSize: "1.1rem", transform: "rotateX(45deg)"}}
                        className={"material-icons-round"}>grid_on</span>
                </div>
            )
        else
            return <span style={{fontSize: "1rem"}} className={"material-icons-round"}>grid_on</span>
    }, [cameraIsOrthographic])

    const [cameraLocked, setCameraLocked] = useState(engine?.renderer?.camera?.locked)
    const [cameraSpeed, setCameraSpeed] = useState(settingsContext.cameraSpeed)
    const [cameraScrollDelay, setCameraScrollDelay] = useState(settingsContext.cameraScrollDelay)
    const [cameraScrollSpeed, setCameraScrollSpeed] = useState(settingsContext.cameraScrollSpeed)
    function bind(yaw, pitch) {
        engine.renderer.camera.updateProjection()
        engine.renderer.camera.yaw = yaw
        engine.renderer.camera.pitch = pitch
        engine.renderer.camera.updateViewMatrix()
    }
    return (
        <div className={styles.floating} style={{top: 0}}>
            <CameraGizmo  bind={bind} renderer={engine.renderer}/>
            <div className={styles.buttonGroup} style={{display: "grid", gap: "2px"}}>
                <Dropdown hideArrow={true}
                    className={styles.groupItemVert}
                    onClick={() => {
                        const engine = props.engine
                        engine.renderer.camera.ortho = !engine.renderer.camera.ortho
                        engine.renderer.camera.updateProjection()

                        setCameraIsOrthographic(!cameraIsOrthographic)
                    }}>
                    <ToolTip styles={{textAlign: "left", display: "grid"}}>
                        Camera position
                    </ToolTip>
                    <span style={{fontSize: "1.1rem"}} className={"material-icons-round"}>videocam</span>
                    <DropdownOptions>
                        <DropdownOption
                            option={{
                                label: "Top",
                                onClick: () => bind(0, Math.PI /2)
                            }}/>
                        <DropdownOption
                            option={{
                                label: "Bottom",
                                onClick: () => bind(0, -Math.PI /2)
                            }}/>
                        <DropdownOption
                            option={{
                                label: "Left",
                                onClick: () => bind(Math.PI , 0)
                            }}/>
                        <DropdownOption
                            option={{
                                label: "Right",
                                onClick: () => bind(0,0)
                            }}/>
                        <DropdownOption
                            option={{
                                label: "Front",
                                onClick: () =>  bind(Math.PI /2, 0)
                            }}/>
                        <DropdownOption
                            option={{
                                label: "Back",
                                onClick: () =>  bind(Math.PI * 1.5, 0)
                            }}/>
                    </DropdownOptions>
                </Dropdown>
                <Dropdown
                    className={styles.groupItemVert}
                    hideArrow={true}>
                    <ToolTip styles={{textAlign: "left", display: "grid"}}>
                       Camera sensitivity
                    </ToolTip>
                    <span className={"material-icons-round"}
                        style={{fontSize: "1rem"}}>directions_run</span>
                    <DropdownOptions>
                        <div className={styles.rangeWrapper} style={{display: "grid"}}>
                            <div className={styles.rangeLabel}>
                                Movement sensitivity
                            </div>
                            <Range
                                onFinish={v => {
                                    setCameraSpeed(v)
                                    settingsContext.cameraSpeed = v
                                }} accentColor={"red"}
                                handleChange={(v) => setCameraSpeed(v)}
                                value={cameraSpeed}
                                minValue={0.00000001}
                                precision={4}
                                incrementPercentage={.0001}
                            />
                        </div>
                        <div className={styles.rangeWrapper} style={{display: "grid"}}>
                            <div className={styles.rangeLabel}>
                                Zoom speed
                            </div>
                            <Range
                                onFinish={v => {
                                    setCameraScrollSpeed(v)
                                    settingsContext.cameraScrollSpeed = v
                                }} accentColor={"red"}
                                handleChange={(v) => setCameraScrollSpeed(v)}
                                value={cameraScrollSpeed}
                                minValue={0}
                                precision={4}
                                incrementPercentage={.0001}
                            />
                        </div>
                        <div className={styles.rangeWrapper} style={{display: "grid"}}>
                            <div className={styles.rangeLabel}>
                                Zoom delay
                            </div>
                            <Range
                                onFinish={v => {
                                    setCameraScrollDelay(v)
                                    settingsContext.cameraScrollDelay = v
                                }} accentColor={"red"}
                                handleChange={(v) => setCameraScrollDelay(v)}
                                value={cameraScrollDelay}
                                minValue={0}
                                precision={1}
                                incrementPercentage={.1}
                            />
                        </div>
                    </DropdownOptions>
                </Dropdown>
                <Button
                    className={styles.groupItemVert}
                    onClick={() => {
                        engine.renderer.camera.ortho = !engine.renderer.camera.ortho
                        engine.renderer.camera.updateProjection()

                        setCameraIsOrthographic(!cameraIsOrthographic)
                    }}>
                    <ToolTip styles={{textAlign: "left", display: "grid"}}>
                        <div>Switch between last Ortho/Perspective</div>
                    </ToolTip>
                    {cameraIcon}
                </Button>

                <div
                    className={styles.buttonGroup}
                    style={{
                        display: engine.renderer?.camera instanceof EditorCamera ? "grid" : "none",
                        transform: "translateY(12px)",
                        gap: "2px"
                    }}>
                    <Button
                        className={styles.groupItemVert}
                        variant={cameraLocked ? "filled" : undefined}
                        onClick={() => {
                            const original = engine.renderer.camera.locked
                            engine.renderer.camera.locked = !original
                            setCameraLocked(!original)
                        }}>
                        <ToolTip styles={{textAlign: "left", display: "grid"}}>
                            Lock camera rotation
                        </ToolTip>
                        <span className={"material-icons-round"} style={{fontSize: "1.1rem"}} >{cameraLocked ? "lock" : "lock_open"}</span>
                    </Button>
                    <div
                        className={[styles.groupItemVert, styles.dragInput].join(" ")}
                        onMouseDown={e => handleGrab(e, engine.renderer.camera, 0)}
                    >
                        <ToolTip styles={{textAlign: "left", display: "grid"}}>
                            Drag X to zoom in/out
                        </ToolTip>
                        <span className={"material-icons-round"}>zoom_in</span>
                    </div>
                    <div
                        className={[styles.groupItemVert, styles.dragInput].join(" ")}
                        onMouseDown={e => handleGrab(e, engine.renderer.camera, 1)}
                        onDoubleClick={() => {
                            engine.renderer.camera.centerOn = [0, 0, 0]
                            engine.renderer.camera.updateViewMatrix()
                        }}>
                        <ToolTip styles={{textAlign: "left", display: "grid"}}>
                            <div>- Drag X to move forward/backwards</div>
                            <div>- Drag Y to move up/down</div>
                            <div>- Double click to center</div>
                        </ToolTip>
                        <span className={"material-icons-round"}>back_hand</span>
                    </div>
                </div>
            </div>
        </div>
    )

}
CameraOptions.propTypes = {
    engine: PropTypes.object
}