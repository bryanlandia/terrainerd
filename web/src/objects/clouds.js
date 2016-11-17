let geometry = new THREE.PlaneGeometry(100, 50, 1, 1)

let textureLoader = new THREE.TextureLoader()

let linear = function(a, b, t) {
	return (b - a) * t + a
}

export default class Clouds extends THREE.Object3D {

	constructor() {
		super()

		this.cameraSpline = new THREE.CatmullRomCurve3([])
		this.lastCloudY = 0

		let mat = new THREE.ShaderMaterial({
			uniforms: {
				tex: {value: textureLoader.load('./assets/cloud_0.jpg')},
				cloudFill: {value: Config.CLOUD_FILL}
			},
			vertexShader: require('./clouds.vert'),
			fragmentShader: require('./clouds.frag'),
			transparent: true
		})

		this.mesh = new THREE.Mesh(new THREE.Geometry(), mat)
		this.mesh.frustumCulled = false
		this.mesh.matrixAutoUpdate = false
		this.mesh.updateMatrix()
		this.add(this.mesh)
	}

	generate(spline) {

		let len = spline.getLength()

		for (let p = len - 1; 0 < p; p -= 200) {

			let t = p / len
			let position = spline.getPoint(t)

			if (position.y > this.lastCloudY) {
				break
			}

			let scale = new THREE.Vector3(1, 1, 1)

			if (Math.random() < .7) {
				scale.set(4, 4, 4)
				position.add(new THREE.Vector3(
					linear(-300, 300, Math.random()),
					linear(-20, 20, Math.random()),
					linear(-600, -200, Math.random())
				))
			} else {
				position.add(new THREE.Vector3(
					linear(60, 120, Math.random()) * (Math.random() > .5 ? 1 : -1),
					linear(-10, 10, Math.random()),
					linear(80, 120, Math.random())
				))
			}

			let matrix = new THREE.Matrix4()

			matrix.compose(position, new THREE.Quaternion(), scale)

			this.mesh.geometry.merge(geometry, matrix)

			// let axis = new THREE.AxisHelper(10)
			// axis.position.copy(c)
			// this.add(axis)
		}

		console.log(this.children[0].geometry)

		this.mesh.geometry.verticesNeedUpdate = true
		this.mesh.geometry.elementsNeedUpdate = true
		this.mesh.geometry.uvsNeedUpdate = true

		this.lastCloudY = spline.points[spline.points.length - 1].y
	}
}
