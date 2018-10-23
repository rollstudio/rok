'use strict';

const defaults = require('lodash.defaults');

const defaultParams = {
}

let currentTime = 0;

let currentAngle = 0;
let distanceToCamera = 1;

function BlackHoleSun (app, controller, params) {
  params = defaults(params, defaultParams);

  THREE.Object3D.call(this);

  this.app = app;
  this.controller = controller;
  const geometry = new THREE.SphereBufferGeometry(0.1, 16, 16);
  const material   = new THREE.MeshBasicMaterial( { color: 0x34cd54 } );

  this.catched = false;
  this.speed = 0;

  this.mesh = new THREE.Mesh(geometry,material);
  this.mesh.position.set(0,1.4,-distanceToCamera);
  this.add(this.mesh);

  this.addMeshToRayInput();

  this.app.emitter.on('updateVideoTime', this.updateVideoTime.bind(this));
}

BlackHoleSun.prototype = Object.create(THREE.Object3D.prototype);


BlackHoleSun.prototype.addMeshToRayInput = function () {
  let self = this;
  this.controller.add(this.mesh,{
    over: function(bool){
      // console.log('over',bool);
    },
    active: function(bool){
      // console.log('active',bool);
      if(bool){
        self.catched = !self.catched;
        if(self.catched){
          self.controller.remove(self.mesh);
        }else{
          self.addMeshToRayInput();
        }
      }
    }
  });
}
BlackHoleSun.prototype.updateVideoTime = function (time) {
    currentTime = time;
}

BlackHoleSun.prototype.update = function (dt, time) {
  if (this.catched) {
    // this.mesh.position.set(this.controller.reticlePosition.x,this.controller.reticlePosition.y,this.controller.reticlePosition.z);
    this.mesh.position.copy(this.controller.reticlePosition);
  }
  // currentAngle = THREE.Math.degToRad(currentTime);
  // this.mesh.position.x = Math.sin(currentAngle*3)*distanceToCamera;
  // this.mesh.position.z = -Math.cos(currentAngle*4)*distanceToCamera;
  // this.mesh.position.y = Math.sin(currentAngle*10)*1.5;
}

module.exports = BlackHoleSun;
