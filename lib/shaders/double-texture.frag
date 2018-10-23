uniform sampler2D t0;
uniform sampler2D t1;
uniform float fTime;
varying vec2 vUv;


void main()	{
  vec4 color0 = texture2D(t0, vUv);
  vec4 color1 = texture2D(t1, vUv);

  // set color
  gl_FragColor = mix(color0, color1, color1.a);
}
