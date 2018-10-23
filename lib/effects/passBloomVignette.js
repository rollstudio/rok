const glslify = require('glslify');
const vertexShader = glslify('../shaders/bloom-vignette.vert');
const fragmentShader = glslify('../shaders/bloom-vignette.frag');


module.exports = function () {
  let pass;

  const init = function(WIDTH, HEIGHT) {

    const uniforms = {
      tInput: {type: 't', value: null},
      vResolution: {type: 'v2', value: new THREE.Vector2(WIDTH, HEIGHT)},
      fTime: {type: 'f', value: 0},
      fVignetteIntensity: {type: 'f', value: 0},
      fBloomIntensity: {type: 'f', value: 0},
    };

    pass = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });

    pass._isActive = false;

    return pass;
  };

  const resize = function(WIDTH, HEIGHT) {
    pass.uniforms.vResolution.value.set(WIDTH, HEIGHT);
  };

  const update = function(delta, time, options) {
    pass.uniforms.fTime.value = time;

    if (options.vignetteIntensity >= 0) {
      pass.uniforms.fVignetteIntensity.value = options.vignetteIntensity;
    }
    if (options.bloomIntensity >= 0) {
      pass.uniforms.fBloomIntensity.value = options.bloomIntensity;
    }

    pass._isActive = options.vignetteIntensity > 0 || options.bloomIntensity > 0;
  };

  return {
    init: init,
    resize: resize,
    update: update,
  };
}