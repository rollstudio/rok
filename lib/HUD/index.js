const TWEEN = require('tween.js');
const quartIn = require('eases/quart-in');
const quartOut = require('eases/quart-out');
const Tutorial = require('./Tutorial');
const PauseHint = require('./PauseHint');
const PauseButton = require('./PauseButton');
const InfoButton = require('./InfoButton');


class HUD {
  constructor(app, parentTarget) {
    this._app = app;
    this._distance = 5;

    this._calcSizeOfView();

    this._tutorial = new Tutorial(this._app, this._width, this._height);
    this._pauseHint = new PauseHint(this._app, this._width, this._height);
    this._pauseButton = new PauseButton(this._app, this._width, this._height);
    this._infoButton = new InfoButton(this._app, this._width, this._height);

    // move in camera frustum
    this._tutorial.position.set(0, 0, - this._distance);
    this._pauseHint.position.set(0, 0, - this._distance);
    this._pauseButton.position.set(0, 0, - this._distance);
    this._infoButton.position.set(0, 0, - this._distance);

    // add HUD elements to parent target
    parentTarget.add(this._tutorial);
    parentTarget.add(this._pauseHint);
    parentTarget.add(this._pauseButton);
    parentTarget.add(this._infoButton);

    this.update = this.update.bind(this);
    this.resize = this.resize.bind(this);
  }

  _calcSizeOfView() {
    const vFOV = THREE.Math.degToRad(this._app.camera.fov); // convert vertical fov to radians
    const isVR = this._app.vrEffect.isVRActive();

    this._height = 2 * Math.tan(vFOV / 2) * this._distance; // visible height
    this._width = this._height * this._app.camera.aspect;   // visible width

    if (isVR) {
      this._width /= 2;
    }

    this._isVR = isVR;
  }

  _updateCanvasState(time) {
    this._tutorial.update(time);
    this._pauseHint.update(time);
    this._pauseButton.update(time);
    this._infoButton.update(time);
  }
  _drawCanvas() {
    this._tutorial.draw();
    this._pauseHint.draw();
    this._pauseButton.draw();
    this._infoButton.draw();
  }

  resize() {
    this._calcSizeOfView();

    this._tutorial.updateViewSize(this._width, this._height, this._isVR);
    this._pauseHint.updateViewSize(this._width, this._height, this._isVR);
    this._pauseButton.updateViewSize(this._width, this._height, this._isVR);
    this._infoButton.updateViewSize(this._width, this._height, this._isVR);
  }
  addToRayController(controller) {
    controller.add(this._pauseButton, {
      over: (isOver) => {
        this._pauseButton.updateOver(isOver);
      },
      active: (isActive) => {
        this._pauseButton.updateActive(isActive);
      },
    });
    controller.add(this._infoButton, {
      over: (isOver) => {
        this._infoButton.updateOver(isOver);
      },
      active: (isActive) => {
        this._infoButton.updateActive(isActive);
      },
    });
  }

  update(dt, time) {
    this._updateCanvasState(time);
    this._drawCanvas();
  }
}


module.exports = HUD;
