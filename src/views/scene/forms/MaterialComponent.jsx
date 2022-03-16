import PropTypes from "prop-types";
import styles from '../styles/Forms.module.css'
import {Accordion, AccordionSummary, Checkbox, LoaderProvider} from "@f-ui/core";
import React, {useContext, useEffect, useState} from "react";
import EVENTS from "../../../services/utils/misc/EVENTS";

import Selector from "../../../components/selector/Selector";
import Range from "../../../components/range/Range";


export default function MaterialComponent(props) {
    const [currentMaterial, setCurrentMaterial] = useState(undefined)
    const [state, setState] = useState({
        tilingX: props.selected.tiling[0],
        tilingY: props.selected.tiling[1],
        overrideTiling: props.selected.overrideTiling,
        radius: props.selected.radius
    })
    console.log( props.selected.radius)
    const fileSystem = props.quickAccess.fileSystem
    const load = useContext(LoaderProvider)


    useEffect(() => {
        setState({
            tilingX: props.selected.tiling[0],
            tilingY: props.selected.tiling[1],
            overrideTiling: props.selected.overrideTiling
        })

        setCurrentMaterial(props.quickAccess.materials.find(i => i.registryID === props.selected.materialID))
    }, [props.selected])

    return (
        <>


            <Accordion>
                <AccordionSummary className={styles.summary}>
                    Material
                </AccordionSummary>
                <div className={styles.formWrapper}>
                    <Selector
                        selected={currentMaterial}
                        type={'material'}
                        handleChange={src => {
                            if (src) {
                                load.pushEvent(EVENTS.LOAD_FILE)
                                fileSystem.readRegistryFile(src.registryID)
                                    .then(rs => {
                                        if (rs)
                                            fileSystem.readFile(fileSystem.path + '\\assets\\' + rs.path, 'json')
                                                .then(file => {
                                                    if (file && file.response) {
                                                        props.submit({
                                                            blob: file.response,
                                                            id: src.registryID,
                                                            name: src.name
                                                        })
                                                        setCurrentMaterial(src)
                                                    } else
                                                        props.setAlert({
                                                            type: 'error',
                                                            message: 'Error loading material.'
                                                        })
                                                    load.finishEvent(EVENTS.LOAD_FILE)
                                                })
                                        else
                                            load.finishEvent(EVENTS.LOAD_FILE)
                                    })
                            } else
                                props.submit()
                        }}/>
                </div>
            </Accordion>

            <Accordion>
                <AccordionSummary className={styles.summary}>
                    UV tiling
                </AccordionSummary>
                <div style={{padding: '4px'}}>

                    <div className={styles.inputs} style={{padding: 0, marginTop: '8px'}}>
                        <Range
                            accentColor={'red'}
                            metric={'x'}
                            disabled={!state.overrideTiling}
                            value={state.tilingX}
                            precision={3}
                            incrementPercentage={.01}
                            onFinish={() => props.submitTiling([state.tilingX, state.tilingY])}
                            handleChange={e => {
                                props.selected.tiling = [parseFloat(e), state.tilingY]
                                setState({...state, tilingX: parseFloat(e)})
                            }}
                        />
                        <Range
                            accentColor={'green'}
                            metric={'y'}
                            disabled={!state.overrideTiling}
                            precision={3}
                            incrementPercentage={.01}
                            value={state.tilingY}
                            onFinish={() => props.submitTiling([state.tilingX, state.tilingY])}
                            handleChange={e => {
                                console.log(props.selected)
                                props.selected.tiling = [state.tilingX, parseFloat(e)]
                                setState({...state, tilingY: parseFloat(e)})

                            }}
                        />
                    </div>
                </div>
            </Accordion>
            <Accordion>
                <AccordionSummary className={styles.summary}>
                    CubeMap influence radius
                </AccordionSummary>
                <div style={{padding: '4px'}}>


                        <Range
                            accentColor={'red'}
                            metric={'un'}

                            value={state.radius}
                            precision={3}
                            incrementPercentage={.01}
                            onFinish={() => props.submitRadius(state.radius)}
                            handleChange={e => {
                                props.selected.radius = state.radius
                                setState({...state, radius: parseFloat(e)})
                            }}
                        />

                </div>
            </Accordion>
            <div className={styles.inputs} style={{padding: '4px 0'}}>
                <Checkbox checked={state.overrideTiling} handleCheck={() => {
                    setState({...state, overrideTiling: !state.overrideTiling})
                    props.submitTiling(undefined, !state.overrideTiling)
                }}/>
                <label className={styles.label}>
                    Override material UVs
                </label>
            </div>

        </>

    )
}
MaterialComponent.propTypes = {
    quickAccess: PropTypes.object,
    setAlert: PropTypes.func.isRequired,
    selected: PropTypes.object,
    submitTiling: PropTypes.func,

    submit: PropTypes.func,
    submitRadius: PropTypes.func
}