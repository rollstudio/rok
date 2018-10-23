'use strict';

const defaults = require('lodash.defaults');

const defaultParams = {
}

function CrowVideo (app, params) {
  params = defaults(params, defaultParams);

  THREE.Object3D.call(this);

  this.app = app;

  this.otherVideoTime = 0;

  this.timeDiff = 0;

  this.video = document.createElement( 'video' );
  this.video.loop = false;
  this.video.muted = true;
  this.video.src = "textures/crow-all.webm";
  this.video.setAttribute( 'webkit-playsinline', 'webkit-playsinline' );

  const texture = new THREE.VideoTexture( this.video );
  texture.minFilter = THREE.NearestFilter;
  texture.maxFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;

  // Left
  let geometry = new THREE.SphereGeometry( 500, 60, 40 );
  geometry.scale( - 1, 1, 1 );

  var uvs = geometry.faceVertexUvs[ 0 ];

  for ( var i = 0; i < uvs.length; i ++ ) {

        for ( var j = 0; j < 3; j ++ ) {

          uvs[ i ][ j ].y *= 0.5;

        }

      }


  let material   = new THREE.MeshBasicMaterial( { map : texture, transparent: true } );

  this.eyeL = new THREE.Mesh(geometry,material);
  this.eyeL.rotation.y = - Math.PI / 2;
  this.eyeL.layers.set( 1 ); // display in left eye only
  this.add(this.eyeL);

  this.currentShot = 1;
  this.nextShot = 1;

  this.rotFactor = 0.0007;

  // Right
  let geometryR = new THREE.SphereGeometry( 500, 60, 40 );
  geometryR.scale( - 1, 1, 1 );

  var uvs = geometryR.faceVertexUvs[ 0 ];

      for ( var i = 0; i < uvs.length; i ++ ) {
        for ( var j = 0; j < 3; j ++ ) {
          uvs[ i ][ j ].y *= 0.5;
          uvs[ i ][ j ].y += 0.5;
        }
      }
  let materialR   = new THREE.MeshBasicMaterial( { map : texture, transparent:true } );

  this.eyeR = new THREE.Mesh(geometryR,materialR);
  this.eyeR.rotation.y = - Math.PI / 2;
  this.eyeR.layers.set( 2 ); // display in right eye only
  this.add(this.eyeR);

  this.app.emitter.on('enterVR', this.enterVR.bind(this));
  this.app.emitter.on('exitVR', this.exitVR.bind(this));

  this.app.emitter.on('updateVideoTime', this.updateVideoTime.bind(this));
  this.app.emitter.on('stopCrow', this.pauseVideo.bind(this));

}

CrowVideo.prototype = Object.create(THREE.Object3D.prototype);

CrowVideo.prototype.enterVR = function () {
  this.video.currentTime = 0;
  this.visible = true;
  this.video.play();
  this.eyeL.rotation.y = - Math.PI / 2;
  this.eyeR.rotation.y = - Math.PI / 2;
}

CrowVideo.prototype.exitVR = function () {
  this.visible = false;
  this.video.pause();
  this.video.currentTime = 0;
  this.app.camera.quaternion.set(0,0,0,1);
}

CrowVideo.prototype.startVideo = function () {
  this.video.play();
}

CrowVideo.prototype.pauseVideo = function () {
  this.video.pause();
}

CrowVideo.prototype.updateVideoTime = function (time) {
  this.otherVideoTime = time;
  this.timeDiff = this.otherVideoTime-this.video.currentTime;
  // console.log('--',this.timeDiff);
  if(this.timeDiff > 0.1){
    this.app.emitter.emit('stopSky');
  }else if(this.timeDiff < -0.1){
    this.video.pause();
  }else{
    if(this.video.paused){
      this.video.play();
    }
  }
}


CrowVideo.prototype.getShot = function (currentTime) {
  if(currentTime < 38){
    return 1;
  }else if(currentTime >= 38 && currentTime < 48){
    return 2;
  }else if(currentTime >= 48 && currentTime < 81){
    return 3;
  }else if(currentTime >= 81 && currentTime < 114.5){
    return 4;
  }else if(currentTime >= 114.5){
    return 5;
  }
}

CrowVideo.prototype.update = function (dt, time) {
  // this.app.emitter.emit('updateCrowTime',this.video.currentTime);
  this.eyeL.rotation.y += this.rotFactor;
  this.eyeR.rotation.y += this.rotFactor;
  this.nextShot = this.getShot(this.video.currentTime);
  if(this.nextShot !== this.currentShot){
    console.log('---',this.nextShot,this.video.currentTime);
    this.currentShot = this.nextShot;
    switch (this.nextShot) {
      case 2:
        this.eyeR.rotation.y = -3*Math.PI/4;
        this.eyeL.rotation.y = -3*Math.PI/4;
        this.rotFactor = 0.002;
        break;
      case 3:
        this.eyeR.rotation.y = 3*Math.PI/2;
        this.eyeL.rotation.y = 3*Math.PI/2;
        this.rotFactor = - 0.0005;
      break;
      case 4:
        this.eyeR.rotation.y = 3*Math.PI/2;
        this.eyeL.rotation.y = 3*Math.PI/2;
        this.rotFactor = 0.0005;
      break;
      case 5:
        this.eyeR.rotation.y = -Math.PI/3;
        this.eyeL.rotation.y = -Math.PI/3;
        this.rotFactor = 0.001;
      break;
    }
  }
}

module.exports = CrowVideo;
