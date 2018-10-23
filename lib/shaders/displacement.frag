uniform sampler2D   tDiffuse;
uniform float uRadius;
uniform vec2 uRayUV;
uniform float fFadeIntensity;
uniform vec3 vFadeColor;

varying vec2  vUv;

void main()	{

  vec4 color = texture2D( tDiffuse, vUv );
  // center
  // float x0 = uRayUV.x;
  // float y0 = uRayUV.y;
  // // point to detect if is inside a circle
  // float x1 = vUv.x;
  // float y1 = vUv.y;

  // float circleArea = sqrt((x1-x0)*(x1-x0) + (y1-y0)*(y1-y0));
  // if( circleArea < uRadius && circleArea > uRadius*0.98){
  //   color = color + vec4(0.1, 0.1, 0.1, 1.0);
  // }

  // float x0b = uRayUV.x - 1.0;
  // float circleAreab = sqrt((x1-x0b)*(x1-x0b) + (y1-y0)*(y1-y0));

  // if( circleAreab < uRadius && circleAreab > uRadius*0.98){
  //   color = color + vec4(0.1, 0.1, 0.1, 1.0);
  // }

  // float x0c = uRayUV.x + 1.0;
  // float circleAreac = sqrt((x1-x0c)*(x1-x0c) + (y1-y0)*(y1-y0));

  // if( circleAreac < uRadius && circleAreac > uRadius*0.98){
  //   color = color + vec4(0.1, 0.1, 0.1, 1.0);
  // }

  // --- BLACK (fade) ---
  // vec4 blackVariation = vec4(1.0 - fBlackIntensity);

  // gl_FragColor = vec4(color.xyz, 1.0) * blackVariation;

  gl_FragColor = vec4(color.xyz + ((vFadeColor - color.xyz) * fFadeIntensity), 1.0);
}