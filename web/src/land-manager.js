import EventEmitter from 'eventemitter3'
import Terrain from './objects/terrain'

export default class LandManager extends THREE.Object3D {

	constructor() {
		super()

		this.eventEmitter = new EventEmitter()

		this.index = 0
		this.terrainList = []
		this.loading = false
		this.lastOffset = 0

		this.cameraSpline = new THREE.CatmullRomCurve3([])

		this.nextLink = '/test/data.json?random=true'

		this.load()
	}

	load() {
		if (this.loading) {
			return
		}

		this.loading = true

		this.emit('start-loading')

		$.getJSON(this.nextLink, (data) => {

			this.nextLink = data.next_link

			let splinePoints = this.cameraSpline.points

			// add land plane
			data.terrains.forEach((info) => {

				let i = this.terrainList.length
				let offset = i == 0 ? 0 : this.lastOffset + info.offset

				// generate center point of terrain
				let center = new THREE.Vector3(
					offset * Config.TERRAIN_WIDTH,
					i * -Config.TERRAIN_STEP,
					i * Config.TERRAIN_WIDTH + (i - 1) * Config.WATERFALL_DEPTH
				)

				// add terrain
				let terrain = new Terrain(info)
				terrain.position.copy(center)
				this.add(terrain)

				// add point to camera spline
				splinePoints.push(center)

				if (i > 0) {
					this.terrainList[i - 1].setNext(terrain)
				}

				this.terrainList.push(terrain)
				this.lastOffset = offset
			})

			// calculate camera points
			this.cameraSpline = new THREE.CatmullRomCurve3(splinePoints)
			this.cameraSplineLength = this.cameraSpline.getLength()

			this.loading = false
			this.emit('load', {cameraSplineLength: this.cameraSplineLength})
		})
	}

	getOffsetAt(y) {

		if (this.terrainList.length == 0) {
			return new THREE.Vector3(0, 0, 0)
		} else {
			let t = -y / this.cameraSplineLength
			return this.cameraSpline.getPoint(t)
		}
	}

	// EventEmiter
	on(name, cb) {
		this.eventEmitter.on(name, cb)
	}

	emit(name, e) {
		this.eventEmitter.emit(name, e)
	}
}
