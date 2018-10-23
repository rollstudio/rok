/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import InteractionModes from './ray-interaction-modes'

import {base64} from './util'
import EventEmitter from 'eventemitter3'

const glslify = require('glslify');

const RETICLE_DISTANCE = 10;
const INNER_RADIUS = 0.01;
const OUTER_RADIUS = 0.02;
const RAY_RADIUS = 0.002;
/**
 * Handles ray input selection from frame of reference of an arbitrary object.
 *
 * The source of the ray is from various locations:
 *
 * Desktop: mouse.
 * Magic window: touch.
 * Cardboard: camera.
 * Daydream: 3DOF controller via gamepad (and show ray).
 * Vive: 6DOF controller via gamepad (and show ray).
 *
 * Emits selection events:
 *     rayover(mesh): This mesh was selected.
 *     rayout(mesh): This mesh was unselected.
 */
export default class RayRenderer extends EventEmitter {
  constructor(app, opt_params) {
    super();

    this.app = app;
    this.camera = app.camera;
    this.sceneRenderer = app.renderer;

    var params = opt_params || {};

    // Which objects are interactive (keyed on id).
    this.meshes = {};

    // Which objects are currently selected (keyed on id).
    this.selected = {};

    // The raycaster.
    this.raycaster = new THREE.Raycaster();

    // Position and orientation, in addition.
    this.position = new THREE.Vector3();
    this.orientation = new THREE.Quaternion();

    this.root = new THREE.Object3D();

    this.totalVertices = 64;

    // Add the reticle mesh to the root of the object.
    this.reticle = this.createReticle_();
    this.root.add(this.reticle);

    // Add the ray to the root of the object.
    this.ray = this.createRay_();
    this.root.add(this.ray);
    // How far the reticle is currently from the reticle origin.
    this.reticleDistance = RETICLE_DISTANCE;

    this.app.emitter.on('audioAnalyzed', this.updateAudioAnalyzed.bind(this));

    this.isPressed = false;
    this.app.emitter.on('pressed',this.pressed.bind(this));
  }

  /**
   * Register an object so that it can be interacted with.
   */
  add(object) {
    this.meshes[object.id] = object;
  }

  /**
   * Prevent an object from being interacted with.
   */
  remove(object) {
    var id = object.id;
    if (this.meshes[id]) {
      // If there's no existing mesh, we can't remove it.
      delete this.meshes[id];
    }
    // If the object is currently selected, remove it.
    if (this.selected[id]) {
      delete this.selected[object.id];
    }
  }

  update() {
    // Do the raycasting and issue various events as needed.
    for (let id in this.meshes) {
      let mesh = this.meshes[id];

      let intersects = this.raycaster.intersectObject(mesh, true);

      let isIntersected = (intersects.length > 0);
      let isSelected = this.selected[id];

      if (isIntersected) {
        this.ray.scale.x = 2;
        this.ray.scale.z = 2;
        // this.reticle.inner.material.color = new THREE.Color(0x000000);
        // this.reticle.outer.material.color = new THREE.Color(0x666666);
        // this.ray.material.uniforms.color.value = new THREE.Color(0x000000);
        this.reticle.inner.material.color =  new THREE.Color(0xdddddd);
        this.reticle.outer.material.color = new THREE.Color(0x333333);
        this.ray.material.uniforms.color.value = new THREE.Color(0xdddddd);
        this.reticle.outerWave.visible = false;

        if (mesh.name === 'runeMesh') {
          if (this.isPressed) {
            this.app.emitter.emit('runeGridRayUVUpdate', (intersects.find(i => i.object.name === 'runeMesh')).uv);
          }
        } else if (mesh.name === 'endCreditsArea') {
          this.app.emitter.emit('endCreditsRayUVUpdate', (intersects.find(i => i.object.name === 'endCreditsArea')).uv);
        }
      } else {
        // this.reticle.scale.set(4,4,4);
        this.ray.scale.x = 1;
        this.ray.scale.z = 1;
        this.reticle.inner.material.color =  new THREE.Color(0xdddddd);
        this.reticle.outer.material.color = new THREE.Color(0x333333);
        this.ray.material.uniforms.color.value = new THREE.Color(0xdddddd);
        this.reticle.outerWave.visible = false;
      }

      // If it's newly selected, send rayover.
      if (isIntersected && !isSelected) {
        this.selected[id] = true;
        if (this.isActive) {
          this.emit('rayover', mesh);
        }
      }

      // If it's no longer intersected, send rayout.
      if (!isIntersected && isSelected) {
        delete this.selected[id];
        this.moveReticle_(null);
        if (this.isActive) {
          this.emit('rayout', mesh);
        }
      }

      if (isIntersected) {
        this.moveReticle_(intersects);
      }
    }

    // this.reticle.outerWave.lookAt(this.app.camera.getWorldPosition());
  }

  pressed(bool){
    this.isPressed = bool;
  }

  updateAudioAnalyzed(id,arrayAnalyzer,average){
    switch (id) {
      case 'voiceover':
        var p;
        for ( var i = 0; i<this.totalVertices/2; i++ ){
          p = this.reticle.outerWave.geometry.vertices[i];
          p.y = ( arrayAnalyzer[i] - average )/500;
        }
        for ( var i = this.totalVertices; i>this.totalVertices/2; i-- ){
          p = this.reticle.outerWave.geometry.vertices[ i ];
          p.y = ( arrayAnalyzer[ this.totalVertices - i ] - average )/500;
        }
        break;
      // case 'music':
      //   var p;
      //   for ( var i = 0; i<this.totalVertices/2; i++ ){
      //     p = this.reticle.outerWaveMusic.geometry.vertices[i];
      //     p.y = ( arrayAnalyzer[i] - average )/2000;
      //   }
      //   for ( var i = this.totalVertices; i>this.totalVertices/2; i-- ){
      //     p = this.reticle.outerWaveMusic.geometry  .vertices[ i ];
      //     p.y = ( arrayAnalyzer[ this.totalVertices - i ] - average )/2000;
      //   }
      //   break;
      default:
        break;
    }
    this.reticle.outerWave.geometry.verticesNeedUpdate = true;
    // this.reticle.outerWaveMusic.geometry.verticesNeedUpdate = true;
  }

  setMode(mode) {
    this.mode = mode;
  }

  /**
   * Sets the origin of the ray.
   * @param {Vector} vector Position of the origin of the picking ray.
   */
  setPosition(vector) {
    this.position.copy(vector);
    this.raycaster.ray.origin.copy(vector);
    this.updateRaycaster_();
  }

  getOrigin() {
    return this.raycaster.ray.origin;
  }

  /**
   * Sets the direction of the ray.
   * @param {Vector} vector Unit vector corresponding to direction.
   */
  setOrientation(quaternion) {
    this.orientation.copy(quaternion);

    var pointAt = new THREE.Vector3(0, 0, -1).applyQuaternion(quaternion);
    this.raycaster.ray.direction.copy(pointAt)
    this.updateRaycaster_();
  }

  getDirection() {
    return this.raycaster.ray.direction;
  }

  /**
   * Sets the pointer on the screen for camera + pointer based picking. This
   * superscedes origin and direction.
   *
   * @param {Vector2} vector The position of the pointer (screen coords).
   */
  setPointer(vector) {
    this.raycaster.setFromCamera(vector, this.camera);
    this.updateRaycaster_();
  }

  /**
   * Gets the mesh, which includes reticle and/or ray. This mesh is then added
   * to the scene.
   */
  getReticleRayMesh() {
    return this.root;
  }

  /**
   * Gets the currently selected object in the scene.
   */
  getSelectedMesh() {
    let count = 0;
    let mesh = null;
    for (var id in this.selected) {
      count += 1;
      mesh = this.meshes[id];
    }
    if (count > 1) {
      // console.warn('More than one mesh selected.');
    }
    return mesh;
  }

  /**
   * Hides and shows the reticle.
   */
  setReticleVisibility(isVisible) {
    this.reticle.visible = isVisible;
  }

  /**
   * Enables or disables the raycasting ray which gradually fades out from
   * the origin.
   */
  setRayVisibility(isVisible) {
    this.ray.visible = isVisible;
  }

  /**
   * Enables and disables the raycaster. For touch, where finger up means we
   * shouldn't be raycasting.
   */
  setActive(isActive) {
    // If nothing changed, do nothing.
    if (this.isActive == isActive) {
      return;
    }
    // TODO(smus): Show the ray or reticle adjust in response.
    this.isActive = isActive;

    if (!isActive) {
      this.moveReticle_(null);
      for (let id in this.selected) {
        let mesh = this.meshes[id];
        delete this.selected[id];
        this.emit('rayout', mesh);
      }
    }
  }

  updateRaycaster_() {
    var ray = this.raycaster.ray;

    // Position the reticle at a distance, as calculated from the origin and
    // direction.
    var position = this.reticle.position;
    // position.copy (new THREE.Vector3(0,0,-4));
    // console.log(ray.direction);
    position.copy(ray.direction);
    position.multiplyScalar(this.reticleDistance);
    position.add(ray.origin);

    // Set position and orientation of the ray so that it goes from origin to
    // reticle.
    var delta = new THREE.Vector3().copy(ray.direction);
    delta.multiplyScalar(this.reticleDistance);

    var distanceToCamera = this.reticle.position.distanceTo(this.camera.position);

    // var scaleReticle = THREE.Math.clamp(distanceToCamera/2,1,5);
    // this.reticle.scale.set(scaleReticle,scaleReticle,scaleReticle);

    this.ray.scale.y = delta.length();
    this.ray.geometry.verticesNeedUpdate = true;
    var arrow = new THREE.ArrowHelper(ray.direction, ray.origin);
    this.ray.rotation.copy(arrow.rotation);

    if(this.mode === InteractionModes.VR_3DOF || this.mode === InteractionModes.VR_6DOF){
      this.ray.position.addVectors(ray.origin, delta.multiplyScalar(0.5));
    }else{
      this.originDisplaced = new THREE.Vector3(0.2,0.2,0.1);
      this.originDisplaced.applyQuaternion( this.camera.quaternion );
      this.ray.position.addVectors(ray.origin.clone().sub(this.originDisplaced), delta.multiplyScalar(0.5));
    }

    this.reticle.outerWave.rotation.y += 0.003;
    // this.reticle.outerWaveMusic.rotation.y -= 0.0025;
  }
  /**
   * Creates the geometry of the reticle.
   */
  createReticle_() {
    let self = this;
    // Create a spherical reticle.
    let innerGeometry = new THREE.SphereGeometry(INNER_RADIUS, 32, 32);
    let innerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      depthTest: false
    });
    let inner = new THREE.Mesh(innerGeometry, innerMaterial);
    inner.renderOrder = 1100;
    inner.onBeforeRender = function() { self.sceneRenderer.clearDepth(); };

    let outerGeometry = new THREE.SphereGeometry(OUTER_RADIUS, 32, 32);
    let outerMaterial = new THREE.MeshBasicMaterial({
      color: 0x333333,
      transparent: true,
      opacity: 0.3,
      depthTest: false
    });
    let outer = new THREE.Mesh(outerGeometry, outerMaterial);
    outer.renderOrder = 1099;
    outer.onBeforeRender = function() { self.sceneRenderer.clearDepth(); };

    // Outer wave (voiceover)
    var geoLine = new THREE.Geometry();
    var radius = 0.15;
    for (var i = 0; i<=self.totalVertices; i++ ){
      geoLine.vertices.push ( new THREE.Vector3 ( Math.sin ( i* Math.PI/ (this.totalVertices/2) )*radius, 0 , Math.cos ( i* Math.PI/ (this.totalVertices/2) )*radius  ) );
    }
    geoLine.verticesNeedUpdate = true;

    var matLine = new THREE.LineBasicMaterial({
      linewidth: 1,
      color: 0xffffff,
      transparent:true,
      opacity: 0.5,
      blending: THREE.NormalBlending
    });

    let outerWave = new THREE.Line(geoLine,matLine);
    outerWave.renderOrder = 1101;
    outerWave.onBeforeRender = function() { self.sceneRenderer.clearDepth(); };

    // Outer wave (music)
    // var geoLine2 = new THREE.Geometry();
    // var radius2 = 0.1;
    // for (var i = 0; i<=self.totalVertices; i++ ){
    //   geoLine2.vertices.push ( new THREE.Vector3 ( Math.sin ( i* Math.PI/ (this.totalVertices/2) )*radius2, 0 , Math.cos ( i* Math.PI/ (this.totalVertices/2) )*radius2  ) );
    // }
    // geoLine2.verticesNeedUpdate = true;

    // var matLine2 = new THREE.LineBasicMaterial({
    //   linewidth: 1,
    //   color: 0xffffff,
    //   transparent:true,
    //   opacity: 0.2,
    //   blending: THREE.NormalBlending
    // });

    // let outerWaveMusic = new THREE.Line(geoLine2,matLine2);
    // outerWaveMusic.renderOrder = 1102;
    // outerWaveMusic.onBeforeRender = function() { self.sceneRenderer.clearDepth(); };

    // Add all elements
    let reticle = new THREE.Group();
    reticle.inner = inner;
    reticle.outer = outer;
    reticle.outerWave = outerWave;
    // reticle.outerWaveMusic = outerWaveMusic;

    reticle.add(inner);
    reticle.add(outer);
    reticle.add(outerWave);
    // reticle.add(outerWaveMusic);

    reticle.scale.set(4, 4, 4);
    return reticle;
  }

  /**
   * Moves the reticle to a position so that it's just in front of the mesh that
   * it intersected with.
   */
  moveReticle_(intersections) {
    // If no intersection, return the reticle to the default position.
    let distance = RETICLE_DISTANCE;
    if (intersections) {
      // Otherwise, determine the correct distance.
      let inter = intersections[0];
      distance = inter.distance;
    }

    this.reticleDistance = distance;
    this.updateRaycaster_();
    return;
  }

  createRay_() {
    let self = this;
    // Create a spline based ray
    var randomPoints = [];
    for ( var i = 0; i <= 10; i ++ ) {
      randomPoints.push( new THREE.Vector3( 0,-0.5+i/10,0 ) );
    }
    // console.log(randomPoints);
    var randomSpline =  new THREE.CatmullRomCurve3( randomPoints );

    var extrudeSettings = {
      steps			: 200,
      bevelEnabled	: false,
      extrudePath		: randomSpline
    };

    var pts = [], numPts = 5;
    for ( var i = 0; i < numPts * 2; i ++ ) {
      var l = i % 2 == 1 ? RAY_RADIUS : RAY_RADIUS;
      var a = i / numPts * Math.PI;
      pts.push( new THREE.Vector2 ( Math.cos( a ) * l, Math.sin( a ) * l ) );
    }
    var shape = new THREE.Shape( pts );
    var geometry = new THREE.ExtrudeGeometry( shape, extrudeSettings );

    // var geometry = new THREE.Geometry();
    // for ( var i = 0; i<=this.totalVertices; i++ ){
    //   geometry.vertices.push (new THREE.Vector3 (0,-i/this.totalVertices,0));
    // }

    // geometry.verticesNeedUpdate = true;


    // var material = new THREE.LineBasicMaterial({
    //   linewidth: 1,
    //   color: 0xffffff,
    //   transparent:true,
    //   opacity: 0.3,
    //   blending: THREE.NormalBlending
    // });

    // var mesh = new THREE.Line(geometry, material);

    // Create a cylindrical ray.
    // lenght from 1 to 100 on mode without controller visible
    var geometryRay = new THREE.CylinderGeometry(RAY_RADIUS*10, RAY_RADIUS, 1, 32,8,true);

    var materialRay = new THREE.ShaderMaterial(
      {
        transparent: true,
        uniforms: {
          color: { type: 'c', value: new THREE.Color(0xffffff) },
        },
        vertexShader: glslify('../shaders/ray.vert'),
        fragmentShader: glslify('../shaders/ray.frag')
      }
    );
    // var materialRay = new THREE.MeshBasicMaterial({color:0xffffff, depthTest:false});
    var mesh = new THREE.Mesh(geometryRay, materialRay);

    mesh.renderOrder = 1200;
    mesh.onBeforeRender = function() { self.sceneRenderer.clearDepth(); };
    return mesh;
  }
}
