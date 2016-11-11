export default class Canvas {

	constructor() {
		this.initScene()

		$(window).on('resize', this.resizeCanvas.bind(this))

		this.render = this.render.bind(this)
		this.render()
	}

	initScene() {
		this.scene = new THREE.Scene()

		this.camera = new THREE.PerspectiveCamera(75, 1, .1, 1000)
		this.camera.position.set(100, 100, 100)
		this.camera.lookAt(new THREE.Vector3(0, 0, 0))

		this.renderer = new THREE.WebGLRenderer({
			canvas: $('.canvas')[0]
		})
		this.renderer.setClearColor(0x00ff00)

		{
			// debug
			let geom = new THREE.BoxGeometry(10, 10, 10)
			let mat = new THREE.MeshBasicMaterial({color: 0xff0000})
			let mesh = new THREE.Mesh(geom, mat)
			this.scene.add(mesh)
		}

		this.resizeCanvas()
	}

	resizeCanvas() {
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		this.camera.aspect = window.innerWidth / window.innerHeight
	}

	render() {
		console.log('a')
		requestAnimationFrame(this.render)
		this.renderer.render(this.scene, this.camera)
	}
}
