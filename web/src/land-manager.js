import EventEmitter from 'eventemitter3'

import Config from './config'

export default class LandManager extends THREE.Object3D {

	constructor() {
		super()

		this.eventEmitter = new EventEmitter()

		this.textureLoader = new THREE.TextureLoader()

		this.index = 0
		this.landData = []
		this.loading = false
		this.lastOffset = 0

		this.load()
	}

	load() {
		if (this.loading) {
			return
		}

		this.loading = true

		this.emit('start-loading')

		const args = {
			offset: this.offset,
			num: Config.LAND_PER_LOAD
		}

		$.getJSON(`/test/data.json?${$.param(args)}`, (data) => {

			let geom = new THREE.PlaneGeometry(Config.LAND_SIZE, Config.LAND_SIZE, 5, 5)


			// add land plane
			data.forEach((d) => {

				let i = this.landData.length
				let offset = this.lastOffset + d.offset

				let mat = new THREE.MeshBasicMaterial({
					color: 0xffffff,
					wireframe: true,
					side: THREE.DoubleSide
				})
				let mesh = new THREE.Mesh(geom, mat)
				mesh.position.set(
					offset * Config.LAND_SIZE,
					i * -Config.LAND_STEP,
					i * Config.LAND_SIZE
				)
				mesh.rotation.x = -Math.PI / 2
				this.add(mesh)

				this.textureLoader.load(d.terrain_image, (texture) => {
					mat.map = texture
					mat.wireframe = false
					mat.needsUpdate = true
				})

				this.lastOffset = offset
				this.landData.push(d)
			})

			this.loading = false
			this.emit('load')
		})
	}

	getOffsetAt(y) {
		let fi = -y / Config.LAND_STEP
		let i = Math.floor(fi)
		let t = fi - i

		if (this.landData.length <= i + 1) {
			return 0
		} else {
			let a = this.children[i].position.x
			let b = this.children[i + 1].position.x

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
