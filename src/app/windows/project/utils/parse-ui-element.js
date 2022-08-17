import UIElement from "../libs/engine/templates/basic/UIElement";
import {v4} from "uuid";

export default function parseUiElement(obj) {
    const newElement = new UIElement()
    Object.entries(obj)
        .forEach(([key, value]) => {
            if(key !== "_element")
            newElement[key] = value
        })
    return newElement
}