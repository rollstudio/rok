const glslify = require('glslify');
const vertexShader = glslify('../shaders/blur.vert');
const fragmentShader = glslify('../shaders/blur.frag');


module.exports = function () {
  let pass;

  const init = function(WIDTH, HEIGHT) {

    const uniforms = {
      tInput: {type: 't', value: null},
      vResolution: {type: 'v2', value: new THREE.Vector2(WIDTH, HEIGHT)},
      fTime: {type: 'f', value: 0},
      fBlurIntensity: {type: 'f', value: 0},
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

    if (options.blurIntensity >= 0) {
      pass.uniforms.fBlurIntensity.value = options.blurIntensity;
    }

    pass._isActive = options.blurIntensity > 0;
  };

  return {
    init: init,
    resize: resize,
    update: update,
  };
}