import PropTypes from "prop-types";
import styles from './styles/Scene.module.css'
import React, {useContext, useMemo, useState} from "react";
import TreeView from "../../../components/tree/TreeView";
import mapToView from "./utils/mapToView";
import useForm from "./utils/useForm";
import QuickAccessProvider from "../../hooks/QuickAccessProvider";
import {Button, Dropdown, DropdownOption, DropdownOptions} from "@f-ui/core";
import FolderComponent from "../../engine/components/FolderComponent";
import {ENTITY_ACTIONS} from "../../engine/useEngineEssentials";
import Entity from "../../engine/basic/Entity";
import ResizableBar from "../../../components/resizable/ResizableBar";
import FormTabs from "./components/FormTabs";
import COMPONENTS from "../../engine/templates/COMPONENTS";
import {HISTORY_ACTIONS} from "../../hooks/historyReducer";
import LoaderProvider from "../../../components/loader/LoaderProvider";
import getComponentInfo from "./utils/getComponentInfo";

const getHierarchy = (start, all) => {
    const result = []
    const direct = all.filter(e => e.linkedTo === start.id)
    direct.forEach(d => {
        result.push(...getHierarchy(d, all))
    })
    result.push(...direct)
    return result
}
export default function SceneView(props) {
    const quickAccess = useContext(QuickAccessProvider)
    const [currentTab, setCurrentTab] = useState('-2')
    const [allHidden, setAllHidden] = useState(false)
    const [required, setRequired] = useState()

    const load = useContext(LoaderProvider)
    const data = useMemo(() => {
        console.log(required)
        const toFilter = props.engine.entities.filter(d => !d.linkedTo && !required || required && d.components[required] !== undefined)
        return [{
            id: 0,
            label: 'Scene',
            children: toFilter.map(f => {
                return mapToView(
                    f,
                    props.engine.entities,
                    (el, e) => {
                        if (e && e.ctrlKey) {
                            props.engine.setSelected(prev => {
                                const indexFound = prev.findIndex(f => f === el.id)
                                if (indexFound === -1) return [...prev, el.id]
                                else {
                                    let n = [...prev]
                                    n.splice(indexFound, 1)
                                    return n
                                }
                            })
                        } else if (!el.components[COMPONENTS.FOLDER])
                            props.engine.setSelected([el.id])
                        else if (el.components[COMPONENTS.FOLDER]) {
                            props.engine.setSelected(getHierarchy(el, props.engine.entities).filter(e => !e.components[COMPONENTS.FOLDER]).map(e => e.id))
                        }
                    },
                    props.engine,
                    setAllHidden,
                    required)
            }),
            icon: <span className={'material-icons-round'} style={{fontSize: '1rem'}}>inventory_2</span>,
            type: 'Scene',
            phantomNode: true,
            highlight: true,
            onHide: () => {
                let newEntities
                if (allHidden) {
                    setAllHidden(false)
                    newEntities = props.engine.entities.map(e => {
                        e.active = true
                        return e
                    })
                } else {

                    setAllHidden(true)
                    newEntities = props.engine.entities.map(e => {
                        e.active = false
                        return e
                    })
                }
                props.engine.dispatchEntities({type: ENTITY_ACTIONS.DISPATCH_BLOCK, payload: newEntities})
            },
            canBeHidden: true,
            hidden: allHidden
        }]
    }, [props.engine.entities, required])

    const currentForm = useForm(
        props.engine,
        props.setAlert,
        props.executingAnimation,
        quickAccess,
        load,
        currentTab)


    const createFolder = () => {
        const newEntity = new Entity()
        newEntity.name = 'New folder'
        newEntity.components[COMPONENTS.FOLDER] = new FolderComponent()
        props.engine.dispatchEntities({
            type: ENTITY_ACTIONS.ADD, payload: newEntity
        })
        props.engine.dispatchChanges({
            type: HISTORY_ACTIONS.PUSHING_DATA, payload: [newEntity]
        })
    }
    const options = useMemo(() => {
        return Object.keys(COMPONENTS).map(e => {
            const o = getComponentInfo(COMPONENTS[e])
            if (Object.keys(o).length > 0)
                return (
                    <React.Fragment key={e}>
                        <DropdownOption option={{
                            onClick: () => setRequired(required === COMPONENTS[e] ? undefined : COMPONENTS[e]),
                            ...o,
                            icon: required !== COMPONENTS[e] ? undefined :
                                <span className={'material-icons-round'} style={{fontSize: '1rem'}}>checked</span>
                        }}/>
                    </React.Fragment>
                )
        })
    }, [required])
    return (<div className={styles.wrapper}>
            <div className={styles.wrapperContent} style={{overflow: 'hidden'}}>
                <div className={[styles.header, styles.mainHeader].join(' ')}
                     style={{justifyContent: 'space-between', padding: '0 4px'}}>
                    <label className={styles.overflow}>
                        Scene hierarchy
                    </label>
                    <div style={{display: 'flex', gap: '2px'}}>
                        <Button className={styles.button} onClick={() => createFolder()}>
                        <span className={'material-icons-round'}
                              style={{fontSize: '1rem'}}>create_new_folder</span>
                        </Button>
                        <Dropdown className={styles.button} hideArrow={true}>
                        <span className={'material-icons-round'}
                              style={{fontSize: '1rem'}}>filter_alt</span>
                            <DropdownOptions>
                                {options}
                            </DropdownOptions>
                        </Dropdown>
                    </div>
                </div>
                <TreeView
                    contextTriggers={['data-node', 'data-self']}
                    onMultiSelect={(items) => props.engine.setSelected(items)}
                    multiSelect={true}
                    searchable={true}
                    draggable={true}
                    options={[{
                        requiredTrigger: 'data-self',
                        label: 'Create folder',
                        icon: <span className={'material-icons-round'}>create_new_folder</span>,
                        onClick: () => createFolder()
                    },
                        {
                            requiredTrigger: 'data-node',
                            label: 'Remove entity',
                            icon: <span className={'material-icons-round'}>delete</span>,
                            onClick: (node) => {
                                const t = node.getAttribute('data-node')
                                const toRemove = getHierarchy(props.engine.entities.find(e => e.id === t), props.engine.entities).map(e => e.id)

                                props.engine.setSelected([])
                                props.engine.dispatchEntities({
                                    type: ENTITY_ACTIONS.REMOVE_BLOCK, payload: [...toRemove, t]
                                })

                            }
                        }]}
                    onDrop={(event, target) => {
                        event.preventDefault()
                        try {
                            const entities = JSON.parse(event.dataTransfer.getData('text'))
                            entities.forEach(entity => {
                                const current = props.engine.entities.find(f => f.id === target)
                                const dropTarget = props.engine.entities.find(f => f.id === entity)

                                if (!current) {
                                    dropTarget.components[COMPONENTS.TRANSFORM].changed = true
                                    props.engine.dispatchEntities({
                                        type: ENTITY_ACTIONS.UPDATE,
                                        payload: {
                                            entityID: dropTarget.id, key: 'linkedTo', data: undefined
                                        }
                                    })
                                } else if (dropTarget && dropTarget !== current && current.linkedTo !== dropTarget.id) {
                                    dropTarget.components[COMPONENTS.TRANSFORM].changed = true

                                    props.engine.dispatchEntities({
                                        type: ENTITY_ACTIONS.UPDATE,
                                        payload: {
                                            entityID: dropTarget.id,
                                            key: 'linkedTo',
                                            data: current.id
                                        }
                                    })
                                }
                            })
                        } catch (e) {
                        }
                    }}
                    onDragStart={e => {
                        if (e.ctrlKey)
                            e.dataTransfer.setData('text', JSON.stringify(props.engine.selected.includes(e.currentTarget.id) ? props.engine.selected : [...props.engine.selected, e.currentTarget.id]))
                        else e.dataTransfer.setData('text', JSON.stringify([e.currentTarget.id]))
                    }}

                    ids={props.engine.entities}
                    selected={props.engine.selected}
                    nodes={data}
                    handleRename={(treeNode, newName) => {
                        props.engine.dispatchEntities({
                            type: ENTITY_ACTIONS.UPDATE, payload: {entityID: treeNode.id, key: 'name', data: newName}
                        })
                    }}
                />
            </div>

            <ResizableBar type={'height'}/>
            <div className={styles.wrapperContent}>

                <div className={styles.content}>
                    <FormTabs
                        entity={currentForm.selected}
                        currentTab={currentTab}
                        setCurrentTab={setCurrentTab}
                    />
                    <div style={{width: '100%', overflowX: 'hidden'}}>
                        {currentForm.open ? (<div className={styles.header}>
                            <label className={styles.overflow}>{currentForm.name}</label>
                            <Button
                                styles={{minHeight: '25px', minWidth: '25px'}}
                                onClick={() => props.engine.setLockedEntity(props.engine.lockedEntity === currentForm.selected?.id ? undefined : currentForm.selected.id)}
                                className={styles.button}
                                variant={props.engine.lockedEntity === currentForm.selected?.id ? 'filled' : undefined}
                            >
                                <span className={'material-icons-round'} style={{fontSize: '1rem'}}>push_pin</span>
                            </Button>
                        </div>) : props.engine.executingAnimation ? null : (
                            <div className={styles.header} style={{justifyContent: 'flex-start'}}>
                                <div
                                    className={'material-icons-round'}
                                    style={{fontSize: '1.2rem'}}
                                >
                                    {currentTab === '-1' ? 'tv' : null}
                                    {currentTab === '-2' ? 'image' : null}
                                    {currentTab === '-3' ? 'videocam' : null}
                                </div>
                                <label className={styles.overflow}>
                                    {currentTab === '-1' ? 'Display' : null}
                                    {currentTab === '-2' ? 'Rendering features' : null}
                                    {currentTab === '-3' ? 'Editor camera effects' : null}
                                </label>
                            </div>
                        )}
                        {currentForm.content}
                    </div>
                </div>
            </div>
        </div>
    )
}

SceneView.propTypes = {
    executingAnimation: PropTypes.bool, setAlert: PropTypes.func.isRequired, engine: PropTypes.object,
}