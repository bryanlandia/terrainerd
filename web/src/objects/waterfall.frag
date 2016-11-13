uniform sampler2D terrainTex;
uniform sampler2D riverTex;
uniform sampler2D nextTerrainTex;
uniform sampler2D nextRiverTex;
uniform float nextTerrainOffset;


varying float x;
varying float t;

void main() {
	vec2 uv = vec2(x, .001);

	vec4 topColor = texture2D(terrainTex, uv);
	topColor.a = texture2D(riverTex, uv).r;

	uv = vec2(x - nextTerrainOffset, .999);

	vec4 bottomColor = texture2D(nextTerrainTex, uv);
	bottomColor.a = texture2D(nextRiverTex, uv).r * topColor.a;

	gl_FragColor = mix(topColor, bottomColor, t);
}
