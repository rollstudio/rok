uniform sampler2D tInput;
uniform vec2 vResolution;
uniform float fVignetteIntensity;
uniform float fBloomIntensity;
varying vec2 vUv;

const float blurSize = 1.0 / 512.0;

void main()	{
  vec4 color = texture2D(tInput, vUv);

  // --- BLOOM ---
  vec4 bloomVariation = vec4(0);

  // blur on X axis
  // take nine samples, with the distance blurSize between them
  bloomVariation += texture2D(tInput, vec2(vUv.x - (4.0 * blurSize), vUv.y)) * 0.05;
  bloomVariation += texture2D(tInput, vec2(vUv.x - (3.0 * blurSize), vUv.y)) * 0.09;
  bloomVariation += texture2D(tInput, vec2(vUv.x - (2.0 * blurSize), vUv.y)) * 0.12;
  bloomVariation += texture2D(tInput, vec2(vUv.x - blurSize, vUv.y)) * 0.15;
  bloomVariation += texture2D(tInput, vec2(vUv.x, vUv.y)) * 0.16;
  bloomVariation += texture2D(tInput, vec2(vUv.x + blurSize, vUv.y)) * 0.15;
  bloomVariation += texture2D(tInput, vec2(vUv.x + 2.0 * blurSize, vUv.y)) * 0.12;
  bloomVariation += texture2D(tInput, vec2(vUv.x + 3.0 * blurSize, vUv.y)) * 0.09;
  bloomVariation += texture2D(tInput, vec2(vUv.x + 4.0 * blurSize, vUv.y)) * 0.05;

  // blur on Y axis
  // take nine samples, with the distance blurSize between them
  bloomVariation += texture2D(tInput, vec2(vUv.x, vUv.y - (4.0 * blurSize))) * 0.05;
  bloomVariation += texture2D(tInput, vec2(vUv.x, vUv.y - (3.0 * blurSize))) * 0.09;
  bloomVariation += texture2D(tInput, vec2(vUv.x, vUv.y - (2.0 * blurSize))) * 0.12;
  bloomVariation += texture2D(tInput, vec2(vUv.x, vUv.y - blurSize)) * 0.15;
  bloomVariation += texture2D(tInput, vec2(vUv.x, vUv.y)) * 0.16;
  bloomVariation += texture2D(tInput, vec2(vUv.x, vUv.y + blurSize)) * 0.15;
  bloomVariation += texture2D(tInput, vec2(vUv.x, vUv.y + (2.0 * blurSize))) * 0.12;
  bloomVariation += texture2D(tInput, vec2(vUv.x, vUv.y + (3.0 * blurSize))) * 0.09;
  bloomVariation += texture2D(tInput, vec2(vUv.x, vUv.y + (4.0 * blurSize))) * 0.05;

  bloomVariation *= fBloomIntensity;

  // --- VIGNETTE ---
  // vec2 uv = vUv.xy / vResolution.xy;
  vec2 uv = vUv * (1.0 - vUv.yx);
  float vig = uv.x * uv.y * 15.0;
  vec4 vignetteVariation = vec4(pow(vig, fVignetteIntensity));


  // set color
  gl_FragColor = (vec4(color.xyz, 1.0) + bloomVariation) * vignetteVariation;
}
