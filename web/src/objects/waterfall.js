/* global gl */

let geometry = (function() {
	let num = 7000

	let positions = new Float32Array(num * 3 * 2)
	let offsets = new Float32Array(num * 2)

	for (let i = 0; i < num; i++) {
		let p = Math.random()
		positions[i*6] 		 = p
		positions[i*6 + 3] = p
		positions[i*6 + 4] = 1

		let o = Math.random()
		offsets[i*2] = o
		offsets[i*2 + 1] = o
	}

	let geometry = new THREE.BufferGeometry()
	geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
	geometry.addAttribute('offset', new THREE.BufferAttribute(offsets, 1))

	geometry.boundingSphere = new THREE.Sphere(
		THREE.Vector3(0, -Config.TERRAIN_STEP / 2, 0),
		Math.max(Config.TERRAIN_STEP, Config.TERRAIN_WIDTH) * Math.sqrt(2) / 2
	)

	return geometry
})()

let clock = new THREE.Clock()
clock.start()

export default class Waterfall extends THREE.LineSegments {

	constructor(info) {

		let mat = new THREE.ShaderMaterial({
			uniforms: {
				time: 					{value: 0.0},
				terrainTex: 		{value: gl.loadTexture(info.terrain_image)},
				heightTex: 			{value: gl.loadTexture(info.height_image)},
				nextTerrainTex: {value: gl.texture},
				nextHeightTex:	{value: gl.texture},
				nextTerrainOffset: {value: 0.0},
				fogTex:					{value: gl.fogTexture}
			},
			defines: {
				ELEVATION_AMP: Config.ELEVATION_AMP.toFixed(1),
				WATERFALL_DEPTH: Config.WATERFALL_DEPTH.toFixed(1),
				TERRAIN_STEP: Config.TERRAIN_STEP.toFixed(1),
				TERRAIN_WIDTH: Config.TERRAIN_WIDTH.toFixed(1)
			},
			vertexShader: require('./waterfall.vert'),
			fragmentShader: require('./waterfall.frag'),
			depthTest: true,
			transparent: true,
			fog: false
		})

		super(geometry, mat)

		this.uniforms = mat.uniforms

		this.onBeforeRender = () => {
			this.uniforms.time.value = clock.getElapsedTime()
		}
	}

	setNextInfo(info) {
		this.uniforms.nextTerrainTex.value = gl.loadTexture(info.terrain_image)
		this.uniforms.nextHeightTex.value = gl.loadTexture(info.height_image)
		this.uniforms.nextTerrainOffset.value = info.offset
	}

}
