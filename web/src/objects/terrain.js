/* global gl*/
import Waterfall from './waterfall.js'

export default class Terrain extends THREE.Object3D {

	constructor(info) {
		super()

		this.info = info
		this.next = null

		// plane
		let mat = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			wireframe: true,
			side: THREE.DoubleSide,
			map: gl.loadTexture(this.info.terrain_image, () => {
				mat.wireframe = false
				mat.needsUpdate = true
			})
		})

		let geom = new THREE.PlaneGeometry(Config.LAND_SIZE, Config.LAND_SIZE, 5, 5)

		let plane = new THREE.Mesh(geom, mat)

		// waterfall
		this.waterfall = new Waterfall(info)
		this.waterfall.position.z = Config.LAND_SIZE / 2.0
		this.add(this.waterfall)


		plane.rotation.x = -Math.PI / 2
		this.add(plane)
	}

	setNext(terrain) {
		this.next = terrain
		this.waterfall.setNextInfo(this.next.info)
	}
}
