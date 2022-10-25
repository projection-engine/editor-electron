import COMPONENTS from "../../../../public/engine/static/COMPONENTS";
import getComponentIcon from "./get-component-icon";

export default function getComponentLabel(component){
    switch (component){
        case COMPONENTS.MESH:
            return "Mesh"
        case COMPONENTS.CAMERA:
            return "Camera"
        case COMPONENTS.POINT_LIGHT:
            return "Point Light"
        case COMPONENTS.DIRECTIONAL_LIGHT:
            return "Directional Light"
        case COMPONENTS.SPRITE:
            return "Sprite"
        case COMPONENTS.PROBE:
            return "Probe"
        case COMPONENTS.PHYSICS_COLLIDER:
            return "Physics collider"
        case COMPONENTS.RIGID_BODY:
            return "Rigid body"
        case COMPONENTS.CULLING:
            return "Culling"
        case COMPONENTS.UI:
            return "UI wrapper"
        case COMPONENTS.TERRAIN:
            return "Terrain"

    }
}