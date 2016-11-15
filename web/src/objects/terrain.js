/* global gl*/
import 'OBJLoader'

import Waterfall from './waterfall.js'

let objLoader = new THREE.OBJLoader()

let geometry = null
let onLoadGeometry = []

objLoader.load('./assets/terrain.obj', (obj) => {
	geometry = obj.children[0].geometry
	onLoadGeometry.forEach((cb) => cb())
})

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

		if (geometry) {
			let mesh = new THREE.Mesh(geometry, mat)
			this.add(mesh)
		} else {
			onLoadGeometry.push(() => {
				let mesh = new THREE.Mesh(geometry, mat)
				this.add(mesh)
			})
		}

		// waterfall
		this.waterfall = new Waterfall(info)
		this.waterfall.position.z = Config.TERRAIN_WIDTH / 2.0
		this.add(this.waterfall)




	}

	setNext(terrain) {
		this.next = terrain
		this.waterfall.setNextInfo(this.next.info)
	}
}
