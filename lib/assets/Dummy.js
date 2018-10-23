'use strict';

const defaults = require('lodash.defaults');

const defaultParams = {
}

function Dummy (app, controller, params) {
  params = defaults(params, defaultParams);

  THREE.Object3D.call(this);

  this.app = app;

  controller.add(this.mesh,{
    over: function(bool){
      // console.log('over',bool);
    },
    active: function(bool){
      // console.log('active',bool);
      if(bool){
        
      }
    }
  });
  
  // Create a spline based ray
  var randomPoints = [];
  for ( var i = 0; i < 10; i ++ ) {
    randomPoints.push( new THREE.Vector3( 0,-0.5+i/10,0 ) );
  }
  console.log(randomPoints);
  var randomSpline =  new THREE.CatmullRomCurve3( randomPoints );

  var extrudeSettings = {
    steps			: 200,
    bevelEnabled	: false,
    extrudePath		: randomSpline
  };

  const RAY_RADIUS = 0.02;
  const ARC_SEGMENTS = 200;

  // ExtrudeGeometry
  var pts = [], numPts = 5;
  for ( var i = 0; i < numPts * 2; i ++ ) {
    var l = i % 2 == 1 ? RAY_RADIUS : RAY_RADIUS;
    var a = i / numPts * Math.PI;
    pts.push( new THREE.Vector2 ( Math.cos( a ) * l, Math.sin( a ) * l ) );
  }
  var shape = new THREE.Shape( pts );
  var geometryRay = new THREE.ExtrudeGeometry( shape, extrudeSettings );
  var materialRay = new THREE.MeshBasicMaterial({color:0xff0000});
  this.ray = new THREE.Mesh(geometryRay,materialRay);
  this.add(this.ray);
  this.ray.position.z = - 3;

  // Tube geometry
  var extrudePath = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3( 0, -0.5, 0 ),
      new THREE.Vector3( 0.5, 0.3, 0 ),
      new THREE.Vector3( 0, 0.5, 0 )
  );
  console.log(extrudePath);
  var tubeGeometry = new THREE.TubeBufferGeometry( extrudePath, ARC_SEGMENTS, RAY_RADIUS, 8, false );
  this.ray1 = new THREE.Mesh(tubeGeometry,materialRay);
  this.add(this.ray1);
  this.ray1.position.z = - 3;
  this.ray1.position.x = 1;

  // Original cylinder
  var geometryRayOrig = new THREE.CylinderGeometry(RAY_RADIUS, RAY_RADIUS, 1, 32,8,true);
  this.ray2 = new THREE.Mesh(geometryRayOrig,materialRay);
  this.add(this.ray2);
  this.ray2.position.z = - 3;
  this.ray2.position.x = - 1;

  // Line based on a spline
  var geometry3 = new THREE.Geometry();
  
  for ( var i = 0; i < ARC_SEGMENTS; i ++ ) {
    geometry3.vertices.push( new THREE.Vector3() );
  }
  extrudePath.type = 'catmullrom';
  this.ray3 = new THREE.Line( geometry3.clone(), new THREE.LineBasicMaterial( {
    color: 0xff0000,
    opacity: 1,
    linewidth: 1
    } ) );
  this.add(this.ray3);
  this.ray3.position.z = - 3;
  this.ray3.position.x = 2;
}

Dummy.prototype = Object.create(THREE.Object3D.prototype);

Dummy.prototype.update = function (dt, time) {
  this.ray.rotation.x += 0.1;
  this.ray2.rotation.x += 0.1;
}

module.exports = Dummy;
