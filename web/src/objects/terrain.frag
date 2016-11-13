#pragma glslify: fog = require(./fog.glsl)

uniform sampler2D terrainTex;
uniform sampler2D fogTex;

varying vec3 pos;
varying vec2 vUv;

void main() {

	vec3 texColor = texture2D(terrainTex, vUv).rgb;

	vec3 color = fog(texColor, fogTex, pos);

	gl_FragColor = vec4(color, 1.0);
}
