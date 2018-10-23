'use strict';

const glslify = require('glslify');
const vertexDisplacementShader = glslify('../shaders/displacement.vert');
const fragmentDisplacementShader = glslify('../shaders/displacement.frag');

const defaults = require('lodash.defaults');

const EndCredits = require('./EndCredits');


let displacementUniforms, displacementMaterial;

const defaultParams = {
}

function Sky (app, experience, params) {
  params = defaults(params, defaultParams);

  THREE.Object3D.call(this);

  this.app = app;
  this.experience = experience;
  this.name = 'sky';
  this.audioTime = 0;
  this.timeDiff = 0;

  this.finished = false;

  const geometry = new THREE.IcosahedronGeometry( 10, 4 );
  geometry.rotateY (-Math.PI/2);
  // const geometry = new THREE.SphereBufferGeometry(10,16,16);
  // geometry.rotateY (Math.PI/2);
  geometry.scale( - 1, 1, 1 );

  this.video = document.createElement( 'video' );
  this.video.loop = false;
  this.video.muted = true;
  this.video.src = 'textures/trailer-8-1440.mp4';
  this.video.setAttribute( 'webkit-playsinline', 'webkit-playsinline' );

  this.videoPlaybackRateTarget = null;

  this.videoTexture = new THREE.VideoTexture( this.video );
  this.videoTexture.minFilter = THREE.NearestFilter;
  this.videoTexture.maxFilter = THREE.NearestFilter;
  // this.videoTexture.format = THREE.RGBFormat;
  this.videoTexture.generateMipmaps = false;

  this.properties = {
		displacementScale: 3,
		displacementBias: -1,
    radius: 0.05,
    rayUV: new THREE.Vector2(0.5,0.5),
    fadeColor: new THREE.Vector3(0.0, 0.0, 0.0),
    fadeIntensity: 1,
    displacementEnabled: false,
  }

  displacementUniforms = {
		time:  { type: "f", value: 1.0 },
		uDisplacementBias: { type: "f", value: this.properties.displacementBias },
		uDisplacementScale: { type: "f", value: this.properties.displacementScale },
    uRadius: { type: "f", value: this.properties.radius },
    vFadeColor: { type: "v3", value: this.properties.fadeColor },
    fFadeIntensity: { type: "f", value: this.properties.fadeIntensity },
    tDiffuse: { type: "t", value: this.videoTexture },
    uRayUV: { type: "v2", value: this.properties.rayUV },
    bEnabled: { type: "b", value: this.properties.displacementEnabled}
	};

	displacementMaterial = new THREE.ShaderMaterial({
		transparent: false,
		uniforms: displacementUniforms,
		vertexShader: vertexDisplacementShader,
		fragmentShader: fragmentDisplacementShader,
		lights: false
  });

  this.mesh = new THREE.Mesh(geometry, displacementMaterial);
  this.mesh.name = 'skyMesh';
  this.add(this.mesh);

  this.app.emitter.on('enterVR', this.enterVR.bind(this));
  this.app.emitter.on('exitVR', this.exitVR.bind(this));
  this.app.emitter.on('rayUVUpdate', this.rayUVUpdate.bind(this));
  this.app.emitter.on('preplay', this.preplay.bind(this));
  this.app.emitter.on('syncVideo', this.syncVideo.bind(this));

  this.app.emitter.on('stopVideo', this.pauseVideo.bind(this));

  this.finalTexture = new THREE.TextureLoader().load('textures/black.png');

  // setup end credits
  this.endCredits = new EndCredits(this.app);
}

Sky.prototype = Object.create(THREE.Object3D.prototype);

Sky.prototype.addToRayController = function (controller) {
  var self = this;
  controller.add(this.mesh,{
    over: function(bool){
      // console.log('over',bool);
    },
    active: function(bool){
      // console.log('active',bool);
    }
  });
}

Sky.prototype.enterVR = function () {
  this.video.currentTime = 0;
  this.visible = true;
}

Sky.prototype.exitVR = function () {
  this.visible = false;
  this.video.pause();
  this.video.currentTime = 0;
  this.app.camera.quaternion.set(0,0,0,1);
}

Sky.prototype.restart = function() {
  this.visible = true;
  this.finished = false;
  this.video.currentTime = 0;

  this.properties.fadeColor = new THREE.Vector3(0.0, 0.0, 0.0);
  displacementUniforms.vFadeColor.value = this.properties.fadeColor;
  this.properties.fadeIntensity = 1;
  displacementUniforms.fFadeIntensity.value = this.properties.fadeIntensity;

  this.mesh.material.uniforms.tDiffuse.value = this.videoTexture;
  this.remove(this.endCredits);
  this.endCredits.fadeOut(0);

  if (this.video.paused) {
    this.video.play();
  }
}

Sky.prototype.preplay = function() {
  if (!this.preplayed) {
    if (this.video.paused) {
      const promise = this.video.play();
      if (promise.then) {
        promise.then(() => {
          this.video.pause();
        })
      } else {
        this.video.pause();
      }
    }
    this.preplayed = true;
  }
}
Sky.prototype.startVideo = function (speedUp) {
  if (this.video.paused) {
    this.video.play();
  }

  // if (speedUp) {
  //   this.videoPlaybackRate = this.video.playbackRate;
  //   this.videoPlaybackRateTarget = 1;
  //   this.videoPlaybackRateChangeStartTime = null;
  // }
}

Sky.prototype.pauseVideo = function (slowDown) {
  if (!this.video.paused) {
    // if (slowDown) {
    //   this.videoPlaybackRate = this.video.playbackRate;
    //   this.videoPlaybackRateTarget = 0;
    //   this.videoPlaybackRateChangeStartTime = null;
    // } else {
      this.video.pause();
    // }
  }
}

Sky.prototype.syncVideo = function () {
  // Syncing video
  const voiceoverTime = this.experience.voiceover.getCurrentTime();
  console.group('Syncing video');
  console.log('video time:', this.video.currentTime);
  console.log('voiceover time:', voiceoverTime);
  console.log('Δ:', this.video.currentTime - voiceoverTime);
  console.groupEnd('Syncing video');
  this.video.currentTime = voiceoverTime;
}

Sky.prototype.getVideoCurrentTime = function () {
  return this.video.currentTime;
}

Sky.prototype.rayUVUpdate = function (vec2) {
  displacementUniforms.uRayUV.value = vec2;
}
Sky.prototype.fadeColorUpdate = function (vec3) {
  this.properties.fadeColor = vec3;
  displacementUniforms.vFadeColor.value = vec3;
}
Sky.prototype.fadeIntensityUpdate = function (f) {
  this.properties.fadeIntensity = f;
  displacementUniforms.fFadeIntensity.value = f;
}
Sky.prototype.enableDisplacement = function () {
  displacementUniforms.bEnabled.value = true;
}
Sky.prototype.disableDisplacement = function () {
  displacementUniforms.bEnabled.value = false;
}

Sky.prototype.setCollectedRunes = function(collectedRunes) {
  this.endCredits.setCollectedRunes(collectedRunes);
}

Sky.prototype.fadeToBlack = function () {
  this.app.emitter.emit('end');
  this.mesh.material.uniforms.tDiffuse.value = this.finalTexture;
  this.add(this.endCredits);
  this.endCredits.fadeIn();
}

Sky.prototype.update = function (dt, time) {
  // if (this.video.currentTime >= 3) {
  //   if (!this.finished) {
  //     this.finished = true;
  //     this.fadeToBlack();
  //   } else {
  //     this.endCredits.update(dt, time);
  //   }
  //   return;
  // }

  if(this.video.currentTime >= this.video.duration){
    if(!this.finished){
      this.finished = true;
      this.fadeToBlack();
    } else {
      this.endCredits.update(dt, time);
    }
    return;
  }

  if (this.videoPlaybackRateChangeStartTime === null) {
    this.videoPlaybackRateChangeStartTime = time;
  }

  if (this.videoPlaybackRateTarget !== null) {
    const deltaTime = time - this.videoPlaybackRateChangeStartTime;
    const progress = Math.min(deltaTime / 0.5, 1);

    if (this.videoPlaybackRateTarget === 0 && this.video.playbackRate > 0) {
      try {
        this.video.playbackRate = Math.max(0, this.videoPlaybackRate - progress);
      } catch (e) {
        this.video.playbackRate = 0;
      }
    } else if (this.videoPlaybackRateTarget === 1 && this.video.playbackRate < 1) {
      try {
        this.video.playbackRate = Math.min(this.videoPlaybackRate + progress, 1);
      } catch (e) {
        this.video.playbackRate = 1;
      }
    } else {
      if (this.video.playbackRate === 0) {
        this.video.pause();
      }

      this.videoPlaybackRateTarget = null;
    }
  }

  displacementUniforms.time.value += dt/7;
  this.app.emitter.emit('updateVideoTime',this.video.currentTime);

  this.videoTexture.needsUpdate = true;
}

module.exports = Sky;
