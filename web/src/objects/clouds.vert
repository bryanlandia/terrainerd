varying vec2 vUv;

void main() {
	vUv = uv;

	// vec4 finalPosition;
	// finalPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
	// finalPosition.xy += position.xy
	// finalPosition = projectionMatrix * finalPosition;
	//
	// gl_Position =  finalPosition;
	gl_Position =  projectionMatrix * modelViewMatrix * vec4(position, 1.);
}
