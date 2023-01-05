import GPU from "../../../../../engine-core/GPU";
import Engine from "../../../../../engine-core/Engine";
import VisibilityRenderer from "../../../../../engine-core/runtime/VisibilityRenderer";
import StaticFBO from "../../../../../engine-core/lib/StaticFBO";
import StaticShaders from "../../../../../engine-core/lib/StaticShaders";
import StaticMeshes from "../../../../../engine-core/lib/StaticMeshes";
import StaticEditorShaders from "../../../../../engine-tools/lib/StaticEditorShaders";
import IconsSystem from "../../../../../engine-tools/runtime/IconsSystem";
import SettingsStore from "../../../stores/SettingsStore";

export default function drawIconsToBuffer() {
    StaticFBO.visibility.startMapping(true)
    StaticEditorShaders.iconToDepth.bind()

    GPU.context.activeTexture(GPU.context.TEXTURE0)
    GPU.context.bindTexture(GPU.context.TEXTURE_2D, IconsSystem.iconsTexture)

    IconsSystem.loop(IconsSystem.drawIcon, SettingsStore.data, StaticEditorShaders.iconToDepthUniforms)
    StaticFBO.visibility.stop()
}
