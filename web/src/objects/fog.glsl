vec3 fog(vec3 c, sampler2D fogTex, vec3 pos) {
	float bri =  (c.r + c.g + c.b) / 3.0;
 	vec3 fogColor = texture2D(fogTex, vec2(bri, .5)).rgb;

	float t = length(vec2(pos.z / 3., pos.y - 20.)) / 40.;
	return mix(c, fogColor, smoothstep(0., 1., t));
}

#pragma glslify: export(fog)
