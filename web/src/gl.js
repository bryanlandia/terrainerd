let gl = {}

gl.textureLoader = new THREE.TextureLoader()
gl.renderer = new THREE.WebGLRenderer({
	canvas: $('.canvas')[0]
})

gl.texture = new THREE.Texture(require('base64-image!./1x1-transparent.png'))

gl.textures = {}

gl.loadTexture = function(url, cb) {

	if (gl.textures[url] != undefined) {
		setTimeout(cb, 1)
	} else {
		gl.textures[url] = gl.textureLoader.load(url, cb)
	}

	return gl.textures[url]
}

window.gl = gl
