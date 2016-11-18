let width = 600
let fontSize = 48
let lineHeight = fontSize * 1.5
let scale = .04

export default class Caption extends THREE.Sprite {

	constructor(message, parameters = {align: 'center'}) {

		let canvas = document.createElement('canvas')
		let ctx = canvas.getContext('2d')

		canvas.width = width
		canvas.height = lineHeight
		// console.log(textWidth)
		ctx.clearRect(0, 0, canvas.width, canvas.height)

		ctx.fillStyle = '#172a6f'
		ctx.font = `Italic ${fontSize}px Cormorant Garamond`
		ctx.textAlign = parameters.align
		ctx.fillText(message, width / 2, fontSize)

		let texture = new THREE.Texture(canvas)
		texture.needsUpdate = true

		let mat = new THREE.SpriteMaterial({
			map: texture
		})

		super(mat)

		this.scale.set(width * scale, lineHeight * scale, 1)
	}
}
