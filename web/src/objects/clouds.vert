varying vec2 vUv;

void main() {
	vUv = uv;

	vec2 pos = position.xy;

	vec4 finalPosition;

	finalPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
	finalPosition.xy += pos;
	finalPosition = projectionMatrix * finalPosition;

	gl_Position =  finalPosition;
}
