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

	geometry.boundingSphere = new THREE.Sphere(
		THREE.Vector3(0, -Config.LAND_STEP / 2, 0),
		Math.max(Config.LAND_STEP, Config.LAND_SIZE) * Math.sqrt(2) / 2
	)

	return geometry
})()

let clock = new THREE.Clock()
clock.start()

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
				nextTerrainOffset: {value: 0.0},
				fogTex:					{value: gl.fogTexture}
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
		this.uniforms.nextRiverTex.value = gl.loadTexture(info.river_image)
		this.uniforms.nextTerrainOffset.value = info.offset
	}

}
