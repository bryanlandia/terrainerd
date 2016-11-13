#pragma glslify: fog = require(./fog.glsl)

uniform sampler2D terrainTex;
uniform sampler2D riverTex;
uniform sampler2D nextTerrainTex;
uniform sampler2D nextRiverTex;
uniform sampler2D fogTex;
uniform float nextTerrainOffset;

varying float x;
varying float t;
varying vec3 pos;

void main() {
	vec2 uv = vec2(x, .001);

	vec4 topColor = texture2D(terrainTex, uv);
	topColor.a = texture2D(riverTex, uv).r;

	uv = vec2(x - nextTerrainOffset, .999);

	vec4 bottomColor = texture2D(nextTerrainTex, uv);
	bottomColor.a = texture2D(nextRiverTex, uv).r * topColor.a;

	vec4 color = mix(topColor, bottomColor, t);

	color.rgb = fog(color.rgb, fogTex, pos);

	gl_FragColor = color;
}
