uniform sampler2D tex;
uniform vec3 cloudFill;

varying vec2 vUv;

void main() {
	float alpha = texture2D(tex, vUv).r;
	gl_FragColor = vec4(cloudFill, alpha);
	// gl_FragColor = vec4(vec3(1., 0., 0.), alpha);
}
