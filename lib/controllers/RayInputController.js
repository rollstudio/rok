'use strict';

const defaults = require('lodash.defaults');
const DaydreamController = require ('./DaydreamController');

const defaultParams = {
}

import RayInput from '../ray/ray-input';

let rayInput;
let isMouseDown = false;
let somethingSelected = false;
let el;

let controllerObj;

function RayInputController (app, params) {
  params = defaults(params, defaultParams);

  this.app = app;

  this.reticlePosition = new THREE.Vector3();

  window.crowPos = [];

  rayInput = new RayInput(app);
  this.rayInput = rayInput;
  // Create 3D objects in scene.
  rayInput.setSize(app.renderer.getSize());
  rayInput.on('raydown', (opt_mesh) => { handleRayDown_(opt_mesh) });
  rayInput.on('rayup', (opt_mesh) => { handleRayUp_(opt_mesh) });
  rayInput.on('raycancel', (opt_mesh) => { handleRayCancel_(opt_mesh) });
  rayInput.on('rayover', (mesh) => { setSelected_(mesh, true) });
  rayInput.on('rayout', (mesh) => { setSelected_(mesh, false) });
  // For high end VR devices like Vive and Oculus, take into account the stage
  // parameters provided.
  app.scene.add(rayInput.getMesh());

  el = app.renderer.domElement;

  el.addEventListener('mousedown', onMouseDown);
  el.addEventListener('mousemove', onMouseMove);
  el.addEventListener('mouseup', onMouseUp);

  app.emitter.on('onWindowResize', this.onWindowResize.bind(this));

  this.isVideoPaused = false;
  app.emitter.on('videoPaused', this.videoPaused.bind(this));

  // if(rayInput.controller.gamepad){
  //   console.log(rayInput.controller.gamepad.id);
  // }

  function handleRayDown_(opt_mesh) {
    setAction_(opt_mesh, true);
  }

  function handleRayUp_(opt_mesh) {
    setAction_(opt_mesh, false);
  }

  function handleRayCancel_(opt_mesh) {
    setAction_(opt_mesh, false);
  }

  function setSelected_(opt_mesh, isSelected) {
    // console.log('setSelected_', isSelected);
    somethingSelected = isSelected;
    if (opt_mesh) {
      opt_mesh.over(isSelected);
    }
    if(isSelected){
      el.style.cursor = 'pointer';
    }else{
      if(isMouseDown){
        onMouseDown();
      }else{
        onMouseUp();
      }
    }
  }

  function setAction_(opt_mesh, isActive) {
    // console.log('setAction_', !!opt_mesh, isActive);
    if (opt_mesh) {
      opt_mesh.active(isActive);
    }
  }

  function onMouseDown(e){
    isMouseDown = true;
    el.style.cursor = '-webkit-grabbing';
    el.style.cursor = '-moz-grabbing';
    el.style.cursor = 'grabbing';
  }

  function onMouseMove(e){
    if(somethingSelected){
      el.style.cursor = 'pointer';
    }else{
      if(isMouseDown){
        onMouseDown();
      }else{
        onMouseUp();
      }
    }
  }

  function onMouseUp(e){
    isMouseDown = false;
    el.style.cursor = '-webkit-grab';
    el.style.cursor = '-moz-grab';
    el.style.cursor = 'grab';
  }

}

RayInputController.prototype = Object.create(Object.prototype);

RayInputController.prototype.checkGamepad = function() {
  const gamepad = rayInput.controller.gamepad;
  const gamepadId = gamepad && gamepad.id && gamepad.id.toLowerCase();

  if (gamepadId && (gamepadId.includes('daydream') || gamepadId.includes('gear vr'))) {
    if (!controllerObj) {

      controllerObj = new DaydreamController(rayInput);
      this.app.scene.add(controllerObj);
    } else {
      controllerObj.visible = true;
    }
  } else {
    if (controllerObj) {
      controllerObj.visible = false;
    }
  }
}

RayInputController.prototype.add = function(obj,options) {
  var options = options || {};

  obj.over = options.over || null;
  obj.active = options.active || null;
  rayInput.add(obj);
};

RayInputController.prototype.remove = function(obj) {
  rayInput.remove(obj);
};

RayInputController.prototype.update = function (dt, time) {
  rayInput.update(dt,time);
  this.reticlePosition = rayInput.renderer.reticle.position;
  this.checkGamepad();
  if(controllerObj){
    controllerObj.update(this.app,dt,time);
  }
  if(!this.isVideoPaused){
    var roundx = Math.round(this.reticlePosition.x * 100) / 100;
    var roundy = Math.round(this.reticlePosition.y * 100) / 100;
    var roundz = Math.round(this.reticlePosition.z * 100) / 100;
    window.crowPos.push(roundx,roundy,roundz);
  }
}

RayInputController.prototype.onWindowResize = function () {
  rayInput.setSize(this.app.renderer.getSize());
}

RayInputController.prototype.videoPaused = function (bool) {
  this.isVideoPaused = bool;
}

module.exports = RayInputController;