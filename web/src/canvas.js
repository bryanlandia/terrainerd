/* global gl */
import { device_pixel_ratio } from 'javascript-retina-detect'

import './gl'
import TerrainManager from './terrain-manager'
import Clouds	from './objects/clouds'
import CameraRig from './camera-rig'

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

		// camera
		this.cameraRig = new CameraRig()
		this.cameraRig.on('reached-bottom', () => {
			this.terrainManager.load()
		})
		this.scene.add(this.cameraRig)

		// terrain
		this.terrainManager = new TerrainManager()
		this.terrainManager.on('load', (e) => {
			this.clouds.generate(e.cameraSpline)
			this.cameraRig.setSpline(e.cameraSpline)
		})
		this.scene.add(this.terrainManager)

		{
			// debug
			// this.scene.add(new THREE.GridHelper(200, 10))
		}

		// cloud
		this.clouds = new Clouds()
		this.scene.add(this.clouds)

		gl.renderer.setClearColor(Config.BG)
		gl.renderer.setPixelRatio(device_pixel_ratio())

		this.resizeCanvas()
	}

	resizeCanvas() {
		gl.renderer.setSize(window.innerWidth, window.innerHeight)
		this.cameraRig.setAspect(window.innerWidth / window.innerHeight)
	}

	onScroll(e) {
		this.cameraRig.scroll(e)
	}

	render() {
		requestAnimationFrame(this.render)

		this.cameraRig.update()

		gl.renderer.render(this.scene, this.cameraRig.camera)
	}
}
