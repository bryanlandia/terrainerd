import VirtualScroll from 'virtual-scroll'

import LerpSoft from './lerp-soft'

const LAND_STEP = 30
const LAND_SIZE = 50

export default class Canvas {

	constructor() {
		this.lerps = {}

		this.numLand = 50

		this.initScene()

		this.virtualScroll = new VirtualScroll()
		this.virtualScroll.on(this.onScroll.bind(this))


		// add event
		$(window).on('resize', this.resizeCanvas.bind(this))

		// start frame
		this.render = this.render.bind(this)
		this.render()
	}

	initScene() {
		this.scene = new THREE.Scene()

		this.cameraParent = new THREE.Object3D()
		// this.cameraParent.rotation.y = -Math.PI * .5
		this.scene.add(this.cameraParent)

		this.lerpScroll = new LerpSoft(0, {
			coeff: .1,
			max: 0,
			min: -50 * LAND_STEP
		})

		this.camera = new THREE.PerspectiveCamera(30, 1, .1, 1000)
		this.camera.position.set(0, 80, 150)
		this.camera.lookAt(new THREE.Vector3(0, 0, 0))

		this.cameraParent.add(this.camera)

		this.renderer = new THREE.WebGLRenderer({
			canvas: $('.canvas')[0]
		})
		this.renderer.setClearColor(0x222266)

		{
			// debug
			let geom = new THREE.PlaneGeometry(LAND_SIZE, LAND_SIZE, 5, 5)
			let mat = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true})

			for (let i = 0; i < 50; i++) {
				let mesh = new THREE.Mesh(geom, mat)
				mesh.position.y = i * -LAND_STEP
				mesh.position.z = i * LAND_SIZE
				mesh.rotation.x = Math.PI / 2
				this.scene.add(mesh)
			}

		}

		this.resizeCanvas()
	}

	resizeCanvas() {
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix()
	}

	onScroll(e) {
		this.lerpScroll.offsetTarget(e.deltaY / 20)
	}

	render() {
		requestAnimationFrame(this.render)

		this.lerpScroll.update()
		this.cameraParent.position.y = this.lerpScroll.value
		this.cameraParent.position.z = this.lerpScroll.value * -(LAND_SIZE / LAND_STEP)

		console.log(this.lerpScroll.value)

		this.renderer.render(this.scene, this.camera)
	}
}
