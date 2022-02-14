import styles from '../styles/Forms.module.css'
import {useContext, useEffect, useState} from "react";
import PropTypes from "prop-types";
import Selector from "../../../components/selector/Selector";
import {Accordion, AccordionSummary} from "@f-ui/core";
import LoadProvider from "../../../components/loader/LoadProvider";
import EVENTS from "../../../pages/project/utils/misc/EVENTS";

export default function SkyboxComponent(props) {
    const [currentImage, setCurrentImage] = useState(undefined)
    const fileSystem = props.quickAccess.fileSystem
    const load = useContext(LoadProvider)
    useEffect(() => {
        if (props.selected.imageID)
            setCurrentImage(props.quickAccess.images.find(i => i.registryID === props.selected.imageID))

    }, [])

    return (

        <Accordion>
            <AccordionSummary>
                Environment map
            </AccordionSummary>
            <div className={styles.formWrapper} >
                <Selector
                    type={'image'}
                    selected={currentImage}
                    handleChange={(src) => {
                        load.pushEvent(EVENTS.LOAD_FILE)
                        fileSystem.readRegistryFile(src.registryID)
                            .then(rs => {
                                if (rs)
                                    fileSystem.readFile(fileSystem.path + '\\assets\\' + rs.path)
                                        .then(file => {
                                            if (file) {
                                                props.submit({
                                                    blob: file,
                                                    id: src.registryID
                                                })
                                                setCurrentImage(props.quickAccess.images.find(i => i.registryID === src.registryID))

                                            }
                                            load.finishEvent(EVENTS.LOAD_FILE)
                                        })
                                else
                                    load.finishEvent(EVENTS.LOAD_FILE)
                            })
                    }}
                />
            </div>
        </Accordion>
    )
}

SkyboxComponent.propTypes = {
    quickAccess: PropTypes.object,
    database: PropTypes.object,
    selected: PropTypes.object,
    submit: PropTypes.func
}