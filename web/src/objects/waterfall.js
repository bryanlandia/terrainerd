/* global gl */

let geometry = (function() {
	let num = 100000

	let positions = new Float32Array(num * 3)
	let offsets = new Float32Array(num)
	for (let i = 0; i < num; i++) {
		positions[i * 3] = Math.random()
		offsets[i] = Math.random()
	}

	let geometry = new THREE.BufferGeometry()
	geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
	geometry.addAttribute('offset', new THREE.BufferAttribute(offsets, 1))

	// geometry.computeBoundingBox()
	// console.log(geometry.boundingBox)
	// geometry.boundingBox = {
	// 	min: new THREE.Vector3(-Config.LAND_SIZE / 2, 0, 0),
	// 	max: new THREE.Vector3(+Config.LAND_SIZE / 2, -Config.LAND_STEP, 0)
	// }
	return geometry
})()

export default class Waterfall extends THREE.Points {

	constructor(info) {

		let mat = new THREE.ShaderMaterial({
			uniforms: {
				time: 					{value: 0.0},
				terrainWidth:		{value: Config.LAND_SIZE},
				height: 				{value: Config.LAND_STEP},
				terrainTex: 		{value: gl.loadTexture(info.terrain_image)},
				riverTex: 			{value: gl.loadTexture(info.river_image)},
				nextTerrainTex: {value: gl.texture},
				nextRiverTex:		{value: gl.texture},
				nextTerrainOffset: {value: 0.0}
			},
			vertexShader: require('./waterfall.vert'),
			fragmentShader: require('./waterfall.frag'),
			depthTest: true,
			transparent: true
		})

		super(geometry, mat)
		this.frustumCulled = false

		this.clock = new THREE.Clock()
		this.clock.start()

		this.uniforms = mat.uniforms
	}

	update() {
		this.uniforms.time.value = this.clock.getElapsedTime()
	}

	setNextInfo(info) {
		this.uniforms.nextTerrainTex.value = gl.loadTexture(info.terrain_image)
		this.uniforms.nextRiverTex.value = gl.loadTexture(info.river_image)
		this.uniforms.nextTerrainOffset.value = info.offset
	}

}
