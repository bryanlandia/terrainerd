uniform sampler2D heightTex;

varying vec2 vUv;
varying vec3 pos;

void main() {

	vUv = uv;

	pos = (modelMatrix * vec4(position, 1.0)).xyz - cameraPosition + vec3(0., 80., 150.);

	float elevation = texture2D(heightTex, uv).g;

	vec3 p = position;
	p.z += elevation * 5.0;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
