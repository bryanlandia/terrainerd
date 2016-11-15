/* global gl*/
import Waterfall from './waterfall.js'

let geometry = new THREE.PlaneGeometry(Config.TERRAIN_WIDTH, Config.TERRAIN_WIDTH, Config.TERRAIN_SEGMENTS, Config.TERRAIN_SEGMENTS)

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
				heightTex: 			{value: gl.loadTexture(info.height_image.replace('jpg', 'png'))},
				heightDiff:			{value: info.meta.elevationDiff}
			},
			defines: {
				ELEVATION_AMP: Config.ELEVATION_AMP.toFixed(1)
			},
			vertexShader: require('./terrain.vert'),
			fragmentShader: require('./terrain.frag'),
			depthTest: true,
			transparent: true,
			fog: false
		})



		let plane = new THREE.Mesh(geometry, mat)

		// waterfall
		this.waterfall = new Waterfall(info)
		this.waterfall.position.z = Config.TERRAIN_WIDTH / 2.0
		this.add(this.waterfall)


		plane.rotation.x = -Math.PI / 2
		this.add(plane)
	}

	setNext(terrain) {
		this.next = terrain
		this.waterfall.setNextInfo(this.next.info)
	}
}
