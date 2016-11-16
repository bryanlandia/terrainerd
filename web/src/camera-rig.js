import EventEmitter from 'eventemitter3'
import LerpSoft from './lerp-soft'

export default class CameraRig extends THREE.Object3D {

	constructor() {
		super()

		// this.rotation.y = -Math.PI * .2

		this.eventEmitter = new EventEmitter()

		this.lerpScroll = new LerpSoft(0, {
			coeff: .1,
			max: 0,
			min: 0
		})

		// camera
		this.camera = new THREE.PerspectiveCamera(30, 1, .1, 1000)
		this.camera.position.set(0, 80, 150)
		this.camera.lookAt(new THREE.Vector3(0, 0, 0))
		this.add(this.camera)

		// camera spline
		this.cameraSpline = null

		// this.add(new THREE.AxisHelper(10))
	}

	scroll(e) {
		this.lerpScroll.offsetTarget(e.deltaY * Config.SCROLL_SPEED)

		if (this.lerpScroll.target == this.lerpScroll.min) {
			this.emit('reached-bottom')
		}
	}

	update() {
		this.lerpScroll.update()
		let y = this.lerpScroll.value

		if (this.cameraSpline) {
			let t = -y / this.cameraSplineLength
			let p = this.cameraSpline.getPoint(t)
			this.position.copy(p)
		} else {
			this.position.set(0, 0, 0)
		}
	}

	onBeforeRender() {
		console.log('redner')
	}

	setAspect(aspect) {
		this.camera.aspect = aspect
		this.camera.updateProjectionMatrix()
	}

	setSpline(spline) {
		this.cameraSpline = spline
		this.cameraSplineLength = this.cameraSpline.getLength()
		this.lerpScroll.min = -this.cameraSplineLength
	}

	// EventEmiter
	on(name, cb) {
		this.eventEmitter.on(name, cb)
	}

	emit(name, e) {
		this.eventEmitter.emit(name, e)
	}
}
