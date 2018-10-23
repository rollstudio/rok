uniform sampler2D tInput;
uniform vec2 vResolution;
uniform float fBlurIntensity;
uniform float fTime;
varying vec2 vUv;


void main()	{
  vec4 color = texture2D(tInput, vUv);

  // --- BLUR ---
  vec4 blurredColor = vec4(0);

  float rotation = fTime / 5.0;

  vec2 off1 = vec2(1.411764705882353) * vec2(sin(rotation), cos(rotation)) / vResolution;
  vec2 off2 = vec2(3.2941176470588234) * vec2(sin(rotation), cos(rotation)) / vResolution;
  vec2 off3 = vec2(5.176470588235294) * vec2(sin(rotation), cos(rotation)) / vResolution;

  // take nine samples, with the distance blurSize between them
  blurredColor += texture2D(tInput, vec2(vUv - (off3 * fBlurIntensity))) * 0.010381362401148057;
  blurredColor += texture2D(tInput, vec2(vUv - (off2 * fBlurIntensity))) * 0.09447039785044732;
  blurredColor += texture2D(tInput, vec2(vUv - (off1 * fBlurIntensity))) * 0.2969069646728344;
  blurredColor += texture2D(tInput, vec2(vUv)) * 0.1964825501511404;
  blurredColor += texture2D(tInput, vec2(vUv + (off1 * fBlurIntensity))) * 0.2969069646728344;
  blurredColor += texture2D(tInput, vec2(vUv + (off2 * fBlurIntensity))) * 0.09447039785044732;
  blurredColor += texture2D(tInput, vec2(vUv + (off3 * fBlurIntensity))) * 0.010381362401148057;

  // set color
  gl_FragColor = blurredColor;
}
