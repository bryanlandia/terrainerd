uniform sampler2D heightTex;

varying vec2 vUv;
varying vec3 pos;

void main() {

	vUv = uv;

	pos = (modelMatrix * vec4(position, 1.0)).xyz - cameraPosition + vec3(0., 80., 150.);

 	vec2 heightUv = position.xz * vec2(1., -1.) / 50.0 + .5;
	float elevation = texture2D(heightTex, heightUv).g;
	float intensity = mix(.5, 1., (position.y + 4.) / 4.);

	vec3 p = position;
	p.y += elevation * ELEVATION_AMP * intensity;

	gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
