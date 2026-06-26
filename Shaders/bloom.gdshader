shader_type canvas_item;
//
// Bloom-ish additive glow pass. Rendered as a fullscreen ColorRect and
// added on top of the scene. Controlled by PostProcessManager for intensity
// pulses on events (hit, level-up, boss phase).
//
// Lightweight approximation: extracts bright pixels and adds them back.
// A full bloom would use a downscaled blur chain, but this gives a punchy
// neon glow for the survivors aesthetic at minimal cost.
//

uniform float intensity : hint_range(0.0, 4.0) = 1.0;
uniform float threshold : hint_range(0.0, 4.0) = 1.2;
uniform float time_speed = 1.0;

void fragment() {
	vec3 col = texture(SCREEN_TEXTURE, SCREEN_UV).rgb;

	// Extract bright areas above threshold.
	float lum = max(col.r, max(col.g, col.b));
	float bright = smoothstep(threshold, threshold + 0.5, lum);

	vec3 glow = col * bright * intensity;

	COLOR = vec4(glow, 1.0);
}
