module.exports = function(passes) {

  let postScene;
  let mshPost;

  const parameters = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    stencilBuffer: false
  };
  let rttScene;
  let rttPass1;
  let rttPass2;
  let postSceneCamera;

  let toggleRtt = true;

  const init = function(w, h) {
    const ww = w * window.devicePixelRatio;
    const hh = h * window.devicePixelRatio;

    postScene = new THREE.Scene();
    rttScene = new THREE.WebGLRenderTarget(ww, hh, parameters);
    rttPass1 = new THREE.WebGLRenderTarget(ww, hh, parameters);
    rttPass2 = new THREE.WebGLRenderTarget(ww, hh, parameters);
    postSceneCamera = new THREE.OrthographicCamera(-w/2, w/2, h/2, -h/2, 0, 10);
    postScene.add(postSceneCamera);

    passes.forEach(function(e) {
      // Initialise each and store material
      e.material = e.init(ww, hh);
    });

    // Create a meshes upon which we display the post processing.
    var geoPass = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
    mshPost = new THREE.Mesh(geoPass, passes[0].material);
    mshPost.scale.set(w, h, 1);
    postScene.add(mshPost);
  };

  var resize = function(w, h) {
    // update render targets size
    rttScene = new THREE.WebGLRenderTarget(w, h, parameters);
    rttPass1 = new THREE.WebGLRenderTarget(w, h, parameters);
    rttPass2 = new THREE.WebGLRenderTarget(w, h, parameters);

    // update camera
    postSceneCamera.left = -w / 2;
    postSceneCamera.right = w / 2;
    postSceneCamera.top = h / 2;
    postSceneCamera.bottom = -h / 2;
    postSceneCamera.updateProjectionMatrix();

    // update mesh
    mshPost.scale.set(w, h, 1);

    // update passes resize params
    passes.forEach(function(e) {
      e.resize(w, h);
    });
  };

  var update = function(delta, time, renderer, vrEffect, scene, camera, options) {

    // Debug mode, uncomment to bypass all post processing
    // vrEffect.render(scene, camera);
    // if (vrEffect.isVRActive()) {
    //   vrEffect.submitFrame();
    // }
    // return;

    passes.forEach(function(e) {
      e.update(delta, time, options);
    });

    const activePasses = passes.filter(p => p.material && p.material._isActive);

    if (activePasses.length) {
      // render initial scene on rttScene (clearing renderer)
      vrEffect.render(scene, camera, rttScene, true);

      // Loop each pass except for last
      toggleRtt = true;
      for (var i = 0; i < activePasses.length - 1; i++) {
        mshPost.material = activePasses[i].material;

        // use as texture rttScene on first iteration, and rttPass1/rttPass2 in the others
        mshPost.material.uniforms.tInput.value = i === 0 ? rttScene.texture : toggleRtt ? rttPass1.texture : rttPass2.texture;
        renderer.render(postScene, postSceneCamera, toggleRtt ? rttPass2 : rttPass1, true);

        toggleRtt = !toggleRtt;
      }

      // Render last pass to canvas using vrEffect
      mshPost.material = activePasses[activePasses.length - 1].material;
      mshPost.material.uniforms.tInput.value = activePasses.length == 1 ? rttScene.texture : toggleRtt ? rttPass1.texture : rttPass2.texture;
      renderer.render(postScene, postSceneCamera);
    } else {
      vrEffect.render(scene, camera);
    }

    if (vrEffect.isVRActive()) {
      vrEffect.submitFrame();
    }
  };

  return {
    init: init,
    resize: resize,
    update: update,
  };
};