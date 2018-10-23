'use strict';

require('webvr-polyfill');

const VREffect = require('./effects/VREffect');
const VRControls = require('./controls/VRControls');

const TWEEN = require('tween.js');

const EventEmitter = require('eventemitter3');
const emitter = new EventEmitter();

const PostProcessing = require('./utils/PostProcessing');
const passBloomVignette = require('./effects/passBloomVignette');
const passBlur = require('./effects/passBlur');

const Experience = require('./Experience');
let experience;

const HomeController = require('./HomeController');
let homeController;

// let isPortrait = null;
// let isPresenting = false;

var clock = new THREE.Clock();

window.isDev = window.location.port === '9966';

if (window.isDev) {
  var stats = new Stats();
  stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom);
}

const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 100);
const cameraGroup = new THREE.Group();
cameraGroup.name = "camera-group";
cameraGroup.add(camera);

const scene = new THREE.Scene();

let renderer;

const postProcessing = PostProcessing([
  passBloomVignette(),
  passBlur(),
]);
const postProcessingOptions = {
  vignetteIntensity: 0,
  bloomIntensity: 0,
  blurIntensity: 0,
};

let container, effect;

const controls = new THREE.VRControls(cameraGroup, emitter);

let vrDisplay;

let onVR;

function App(){

}

App.prototype = Object.create(Object.prototype);

App.prototype.init = function(){
    // WebVR Boilerplate.
    WebVRConfig.BUFFER_SCALE = 1.0;
    // WebVRConfig.CARDBOARD_UI_DISABLED = true;
    // WebVRConfig.ROTATE_INSTRUCTIONS_DISABLED = true;
    // WebVRConfig.TOUCH_PANNER_DISABLED = true;
    // WebVRConfig.MOUSE_KEYBOARD_CONTROLS_DISABLED = true;
    // WebVRConfig.YAW_ONLY = true;
    // ENABLE_DEPRECATED_API: false,
    // FORCE_ENABLE_VR: true,

    container = document.querySelector('#webgl-content');

    // Create the renderer.
    renderer = new THREE.WebGLRenderer({antialias: false});
    // Safari fix
    renderer.context.getShaderInfoLog = function () { return ''; };
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;

    postProcessing.init(window.innerWidth, window.innerHeight);

    container.appendChild(renderer.domElement);

    camera.layers.enable( 1 );

    scene.add(cameraGroup);
    // Apply VR headset positional data to camera.
    controls.standing = true;

    // Apply VR stereo rendering to renderer.
    effect = new THREE.VREffect(renderer);
    effect.setSize(window.innerWidth, window.innerHeight);

    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.cameraGroup = cameraGroup;
    this.emitter = emitter;
    this.postProcessingOptions = postProcessingOptions;
    this.vrEffect = effect;

    var light = new THREE.AmbientLight(0xf4f4f4, 1);
    scene.add(light);

    experience = new Experience(this);
    scene.add(experience);

    window.addEventListener('resize', onWindowResize, false);

    homeController = new HomeController(this);

    setupStage();

    window.addEventListener('vrdisplaypresentchange', function () {
      console.log('vrdisplaypresentchange')
      onWindowResize();
    }, false );

    // emitter.on('enterVR', () => {
    //   console.log('enterVR');
    //   isPresenting = true;

    //   // checkPortrait();
    // });
    // emitter.on('exitVR', () => {
    //   console.log('exitVR');
    //   isPresenting = false;
    // });

    // Get the HMD, and if we're dealing with something that specifies
    // stageParameters, rearrange the scene.
    function setupStage() {
      navigator.getVRDisplays().then(function(displays) {
        if (displays.length > 0) {
          vrDisplay = displays[0];
          if (vrDisplay.stageParameters) {
            setStageDimensions(vrDisplay.stageParameters);
          }
          vrDisplay.requestAnimationFrame(render);
        }
      });
    }

    function setStageDimensions(stage) {
      // Make the scene fit the stage.
    }

    // function checkPortrait() {
      // if (window.innerWidth <= 812 && isPortrait !== true && window.innerHeight > window.innerWidth) {
      //   // mobile and now portrait
      //   if (isPresenting) {
      //     emitter.emit('pauseExperience');
      //   }
      //   isPortrait = true;
      //   container.classList.add('portrait');
      // } else if (isPortrait !== false && (window.innerWidth > 812 || window.innerWidth > window.innerHeight)) {
      //   // now landscape
      //   isPortrait = false;
      //   container.classList.remove('portrait');
      //   if (isPresenting) {
      //     emitter.emit('playExperience');
      //   }
      // }
    // }

    function onWindowResize (event) {
      // checkPortrait();

      effect.setSize(window.innerWidth, window.innerHeight);

      const size = renderer.getSize();

      camera.aspect = size.width / size.height;
      camera.updateProjectionMatrix();

      postProcessing.resize(size.width, size.height);

      experience.hud.resize(size.width, size.height);

      emitter.emit('onWindowResize');

      console.log('[app][onWindowResize]', {
        renderer: {
          w: size.width,
          h: size.height,
          pixelRatio: renderer.getPixelRatio(),
        },
        window: {
          w: window.innerWidth,
          h: window.innerHeight,
        }
      });

      document.getElementById('home').style.height =  window.innerHeight + 'px';
    }

    function render() {
      if (window.isDev) {
        stats.begin();
      }

      var delta = clock.getDelta() * 60;
      var time = clock.getElapsedTime();
      // Only update controls if we're presenting.
      if (homeController.vrButton.isPresenting()) {
        controls.update();
        scene.visible = true;
      }else{
        scene.visible = false;
      }

      // Render the scene.
      renderer.clear();

      // we pass "effect" as last postprocessing pass renderer. So PostProcessing will render effect on update
      postProcessing.update(delta, time, renderer, effect, scene, camera, postProcessingOptions);
      vrDisplay.requestAnimationFrame(render);

      TWEEN.update();
      experience.update(delta, time);

      if (window.isDev) {
        stats.end();
      }
    }
}

module.exports = new App();
