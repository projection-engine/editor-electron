import PickingAPI from "../../../engine-core/lib/utils/PickingAPI";

const MOUSE_LEFT = 0
export default class SculptingGizmo {
    ctx = null
    brushImage = null
    currentImage = null
    callback

    updateMesh = () => null
    updateSettings(brushSize, brushScale, brushStrength){
        this.ctx.lineWidth = brushSize
        const d = brushStrength * 255
        this.ctx.strokeStyle = `rgb(${d}, ${d}, ${d}, ${brushScale})`
        this.ctx.fillStyle = `rgb(${d}, ${d}, ${d}, ${brushScale})`
    }
    updateImage(image){
        this.currentImage = new Image();
        this.currentImage.onload = () => {
            this.canvas.width = this.currentImage.naturalWidth
            this.canvas.height = this.currentImage.naturalHeight
            this.ctx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height)
        }
        this.currentImage.src = image
    }

    constructor(image) {

        this.canvas = document.createElement("canvas")
        this.ctx = this.canvas.getContext("2d")
        this.ctx.lineJoin = "round"
        this.ctx.strokeStyle = 'rgba(0,0,0,0.5)';

        this.updateImage(image)

        this.handlerBound = this.handler.bind(this)

        GPUCanvas.addEventListener("mousedown", this.handlerBound)
        document.addEventListener("mouseup", this.handlerBound)

    }

    destroy() {
        document.removeEventListener("mousemove", this.handlerBound)
        GPUCanvas.removeEventListener("mousedown", this.handlerBound)
        document.removeEventListener("mouseup", this.handlerBound)
    }

    handler(e) {

        switch (e.type) {
            case "mousedown": {
                if (e.button !== MOUSE_LEFT || e.target !== GPUCanvas)
                    return
                clearInterval(this.interval)
                this.interval = setInterval(() => this.updateMesh(), 300)
                this.ctx.beginPath()
                const {texCoords} = PickingAPI.readUV(e.clientX, e.clientY, this.currentImage.naturalWidth, this.currentImage.naturalHeight)
                this.ctx.moveTo(texCoords.x, texCoords.y)

                document.addEventListener("mousemove", this.handlerBound)
                this.wasDown = true
                break
            }
            case "mouseup":
                if (this.wasDown) {
                    clearInterval(this.interval)
                    this.wasDown = false
                    this.updateMesh()
                    document.removeEventListener("mousemove", this.handlerBound)
                }
                break
            case "mousemove": {
                const ctx = this.ctx
                const {texCoords} = PickingAPI.readUV(e.clientX, e.clientY, this.currentImage.naturalWidth, this.currentImage.naturalHeight)

                ctx.lineTo(texCoords.x, texCoords.y)
                ctx.stroke();
                break
            }
            default:
                break
        }
    }
}