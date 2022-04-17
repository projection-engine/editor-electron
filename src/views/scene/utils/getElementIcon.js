import COMPONENTS from "../../../engine/shared/templates/COMPONENTS";

export default function getElementIcon(components, isBP) {
    if (isBP)
        return <span className={'material-icons-round'} style={{fontSize: '1rem'}}>terminal</span>
    switch (true) {
        case components.SkyboxComponent !== undefined:
            return (
                <span className={'material-icons-round'} style={{fontSize: '1rem'}}>cloud</span>
            )
        case components.MeshComponent !== undefined:
            return (
                <span className={'material-icons-round'} style={{fontSize: '1rem'}}>view_in_ar</span>
            )
        case components.PointLightComponent !== undefined:
            return (
                <span className={'material-icons-round'} style={{fontSize: '1rem'}}>lightbulb</span>
            )
        case components.SpotLightComponent !== undefined:
            return (
                <span className={'material-icons-round'} style={{fontSize: '1rem'}}>flashlight_on</span>
            )
        case components.DirectionalLightComponent !== undefined:
            return (
                <span className={'material-icons-round'} style={{fontSize: '1rem'}}>light_mode</span>
            )
        case components.Grid !== undefined:
            return (
                <span className={'material-icons-round'} style={{fontSize: '1rem'}}>grid_4x4</span>
            )
        case components.FolderComponent !== undefined:
            return (
                <span className={'material-icons-round'} style={{fontSize: '1rem'}}>folder</span>
            )
        case components.CubeMapComponent !== undefined:
            return (
                <span className={'material-icons-round'} style={{fontSize: '1rem'}}>panorama_photosphere</span>
            )
        case components[COMPONENTS.CAMERA] !== undefined:
            return (
                <span className={'material-icons-round'} style={{fontSize: '1rem'}}>videocam</span>
            )
        default:
            return
    }
}