varying vec2 vUv;
varying vec3 pos;

void main() {

	vUv = uv;

	pos = (modelMatrix * vec4(position, 1.0)).xyz - cameraPosition + vec3(0., 80., 150.);

	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
