uniform float time;
uniform float terrainWidth;
uniform float height;
uniform float depth;

attribute float offset;

varying float x;
varying float t;
varying vec3 pos;

void main() {
	x = position.x;

	t = fract((time + offset * 2.0) / 2.0);
	t += position.y * .08;
	float t2 = t * t;

	vec4 p = vec4(
		(position.x - .5) * terrainWidth,
		t2 * -height,
		t2 * depth,
		1.0);

	pos = (modelMatrix * p).xyz - cameraPosition + vec3(0., 80., 150.);

	gl_Position = projectionMatrix * modelViewMatrix * p;
	// gl_PointSize = 4.0;
}
