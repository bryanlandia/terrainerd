import { device_pixel_ratio } from 'javascript-retina-detect'

import LerpSoft from './lerp-soft'
import LandManager from './land-manager.js'

import Config from './config'

export default class Canvas {

	constructor() {

		this.lerps = {}

		// initialization
		this.initScene()

		// bind this
		this.onScroll = this.onScroll.bind(this)


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
			min: 0
		})

		this.landManager = new LandManager()
		this.landManager.on('load', () => {
			this.lerpScroll.min = (this.landManager.children.length - 1) * -Config.LAND_STEP
		})
		this.scene.add(this.landManager)

		this.camera = new THREE.PerspectiveCamera(30, 1, .1, 1000)
		this.camera.position.set(0, 80, 150)
		this.camera.lookAt(new THREE.Vector3(0, 0, 0))
		this.cameraParent.add(this.camera)

		{
			// add lights
			let light = new THREE.AmbientLight(0xffffff)
			this.scene.add(light)
		}

		this.renderer = new THREE.WebGLRenderer({
			canvas: $('.canvas')[0]
		})
		this.renderer.setClearColor(0x000000)
		this.renderer.setPixelRatio(device_pixel_ratio())

		this.resizeCanvas()
	}

	resizeCanvas() {
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix()
	}

	onScroll(e) {
		this.lerpScroll.offsetTarget(e.deltaY / 20)

		if (this.lerpScroll.target == this.lerpScroll.min) {
			this.landManager.load()
		}
	}

	render() {
		requestAnimationFrame(this.render)

		this.lerpScroll.update()
		this.cameraParent.position.set(
			this.landManager.getOffsetAt(this.lerpScroll.value),
			this.lerpScroll.value,
			this.lerpScroll.value * -(Config.LAND_SIZE / Config.LAND_STEP)
		)

		this.renderer.render(this.scene, this.camera)
	}
}
