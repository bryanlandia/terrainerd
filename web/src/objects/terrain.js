/* global gl*/
import Waterfall from './waterfall.js'

export default class Terrain extends THREE.Object3D {

	constructor(info) {
		super()

		this.info = info
		this.next = null

		// plane
		let mat = new THREE.ShaderMaterial({
			uniforms: {
				fogTex:					{value: gl.fogTexture},
				terrainTex: 		{value: gl.loadTexture(info.terrain_image)},
				riverTex: 			{value: gl.loadTexture(info.river_image)},
				heightTex: 			{value: gl.loadTexture(info.height_image)},
				heightDiff:			{value: info.meta.elevationDiff}
			},
			vertexShader: require('./terrain.vert'),
			fragmentShader: require('./terrain.frag'),
			depthTest: true,
			transparent: true,
			fog: false
		})

		let geom = new THREE.PlaneGeometry(Config.LAND_SIZE, Config.LAND_SIZE, 64, 64)

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
