/* global gl */
import { device_pixel_ratio } from 'javascript-retina-detect'

import './gl'
import LerpSoft from './lerp-soft'
import LandManager from './land-manager.js'

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
		// this.cameraParent.rotation.y = -Math.PI * .2
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

		{
			// debug
			// this.scene.add(new THREE.GridHelper(200, 10))
		}

		this.camera = new THREE.PerspectiveCamera(30, 1, .1, 1000)
		this.camera.position.set(0, 80, 150)
		this.camera.lookAt(new THREE.Vector3(0, 20, 0))
		this.cameraParent.add(this.camera)


		this.cameraParent.add(new THREE.AxisHelper(10))

		{
			// add lights
			let light = new THREE.AmbientLight(0xffffff)
			this.scene.add(light)
		}

		gl.renderer.setClearColor(Config.BG)
		gl.renderer.setPixelRatio(device_pixel_ratio())

		this.resizeCanvas()
	}

	resizeCanvas() {
		gl.renderer.setSize(window.innerWidth, window.innerHeight)
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
			this.lerpScroll.value * -((Config.LAND_SIZE + Config.WATERFALL_DEPTH) / Config.LAND_STEP)
		)

		gl.renderer.render(this.scene, this.camera)
	}
}
