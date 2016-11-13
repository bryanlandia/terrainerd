uniform float time;
uniform float terrainWidth;
uniform float height;

attribute float offset;

varying float x;
varying float t;
varying vec3 pos;

void main() {
	x = position.x;

	t = fract((time + offset * 2.0) / 2.0);
	float t2 = t * t;

	vec4 p = vec4(
		(position.x - .5) * terrainWidth,
		t2 * -height,
		t2 * 1.0,
		1.0);

	pos = (modelMatrix * p).xyz - cameraPosition + vec3(0., 80., 150.);

	gl_Position = projectionMatrix * modelViewMatrix * p;
}
