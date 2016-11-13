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

			// add land plane
			data.terrains.forEach((info) => {

				let i = this.terrainList.length

				let offset = i == 0 ? 0 : this.lastOffset + info.offset

				let terrain = new Terrain(info)
				terrain.position.set(
					offset * Config.LAND_SIZE,
					i * -Config.LAND_STEP,
					i * Config.LAND_SIZE
				)
				this.add(terrain)

				if (i > 0) {
					this.terrainList[i - 1].setNext(terrain)
				}

				this.terrainList.push(terrain)

				this.lastOffset = offset
			})

			this.loading = false
			this.emit('load')
		})
	}

	getOffsetAt(y) {
		let fi = -y / Config.LAND_STEP
		let i = Math.floor(fi)
		let t = fi - i

		if (this.terrainList.length <= i + 1) {
			return 0
		} else {
			let a = this.terrainList[i].position.x
			let b = this.terrainList[i + 1].position.x

			return (a + (b - a) * t)
		}
	}

	// EventEmiter
	on(name, cb) {
		this.eventEmitter.on(name, cb)
	}

	emit(name) {
		this.eventEmitter.emit(name)
	}
}
