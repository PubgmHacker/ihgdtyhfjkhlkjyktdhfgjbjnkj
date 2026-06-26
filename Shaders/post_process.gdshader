shader_type canvas_item;
//
// Post-processing: vignette + chromatic aberration + subtle scanline.
// Applied as a full-screen CanvasItem shader on a ColorRect over the viewport.
//

uniform float vignette_intensity : hint_range(0.0, 2.0) = 0.8;
uniform float vignette_radius : hint_range(0.0, 2.0) = 0.75;
uniform float chromatic_amount : hint_range(0.0, 0.01) = 0.0015;
uniform float scanline_strength : hint_range(0.0, 1.0) = 0.06;
uniform float time_speed = 1.0;

void fragment() {
	vec2 uv = SCREEN_UV;
	float t = TIME * time_speed;

	// --- Chromatic aberration: offset RGB channels radially from center ---
	vec2 dir = uv - vec2(0.5);
	float r = texture(SCREEN_TEXTURE, uv + dir * chromatic_amount).r;
	float g = texture(SCREEN_TEXTURE, uv).g;
	float b = texture(SCREEN_TEXTURE, uv - dir * chromatic_amount).b;

	vec3 color = vec3(r, g, b);

	// --- Vignette: darken edges ---
	float dist = length(dir);
	float vig = smoothstep(vignette_radius, vignette_radius - 0.4, dist);
	vig = mix(1.0, clamp(vig, 0.0, 1.0), vignette_intensity);
	color *= vig;

	// --- Subtle scanlines (CRT feel) ---
	float scan = sin(uv.y * 800.0 + t * 2.0) * 0.5 + 0.5;
	color -= scan * scanline_strength * 0.5;

	// --- Slight saturation boost ---
	float lum = dot(color, vec3(0.299, 0.587, 0.114));
	color = mix(vec3(lum), color, 1.12);

	COLOR = vec4(color, 1.0);
}
