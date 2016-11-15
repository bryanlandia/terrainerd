uniform float time;
uniform sampler2D heightTex;

attribute float offset;

varying float x;
varying float t;
varying vec3 pos;

void main() {
	x = position.x;

	t = fract((time + offset * 2.0) / 2.0);
	t += position.y * .08;
	float t2 = t * t;

	float elevation = texture2D(heightTex, vec2(x, 0.001)).g;

	vec4 p = vec4(
		(position.x - .5) * TERRAIN_WIDTH,
		mix(elevation * ELEVATION_AMP + .3, -TERRAIN_STEP, t2),
		t2 * WATERFALL_DEPTH,
		1.0);

	pos = (modelMatrix * p).xyz - cameraPosition + vec3(0., 80., 150.);

	gl_Position = projectionMatrix * modelViewMatrix * p;
	// gl_PointSize = 4.0;
}
