let geom = new THREE.PlaneGeometry(300, 150, 1, 1)

let textureLoader = new THREE.TextureLoader()

let mat = new THREE.ShaderMaterial({
	uniforms: {
		tex: {value: textureLoader.load('./assets/cloud_0.jpg')},
		cloudFill: {value: Config.CLOUD_FILL}
	},
	vertexShader: require('./clouds.vert'),
	fragmentShader: require('./clouds.frag'),
	transparent: true
})

let linear = function(a, b, t) {
	return (b - a) * t + a
}

export default class Clouds extends THREE.Object3D {

	constructor() {
		super()

		this.cameraSpline = new THREE.CatmullRomCurve3([])
		this.lastCloudY = 0
	}

	generate(spline) {

		let len = spline.getLength()

		for (let p = len - 1; 0 < p; p -= 200) {

			let t = p / len

			let c = spline.getPoint(t)

			// console.log(c.y)

			if (c.y > this.lastCloudY) {
				break
			}

			let mesh = new THREE.Mesh(geom, mat)

			if (Math.random() < .7) {
				mesh.scale.set(2)
				c.add(new THREE.Vector3(
					linear(-300, 300, Math.random()),
					linear(-20, 20, Math.random()),
					linear(-600, -200, Math.random())
				))
			} else {
				mesh.scale.set(0.3)
				c.add(new THREE.Vector3(
					linear(90, 150, Math.random()) * (Math.random() > .5 ? 1 : -1),
					linear(-10, 10, Math.random()),
					linear(80, 120, Math.random())
				))
			}
			mesh.position.copy(c)

			this.add(mesh)

			// let axis = new THREE.AxisHelper(10)
			// axis.position.copy(c)
			// this.add(axis)
		}

		this.lastCloudY = spline.points[spline.points.length - 1].y
	}
}
