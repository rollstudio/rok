const quartOut = require('eases/quart-out');
const quartIn = require('eases/quart-in');


class PauseHint extends (THREE.Object3D) {
  constructor(app, viewWidth, viewHeight) {
    super();

    this._app = app;
    this._viewWidth = viewWidth;
    this._viewHeight = viewHeight;
    this._scale = 1;

    this._meshWidth = 0.426 * this._viewHeight;
    this._meshHeight = 0.426 * this._viewHeight / 4;
    this._canvasWidth = 1024;
    this._canvasHeight = 256;

    this._app.emitter.on('end', this.fadeOut.bind(this));
    this._app.emitter.on('showTutorial', this._showTutorialHandler.bind(this));
    this._app.emitter.on('hideTutorial', this._hideTutorialHandler.bind(this));

    this._initCanvas();
    this._initMesh();
  }

  _initCanvas() {
    this._canvas = document.createElement('canvas');
    this._canvas.width = this._canvasWidth;
    this._canvas.height = this._canvasHeight;
    this._ctx = this._canvas.getContext('2d');

    this._isVisible = false;
    this._opacity = 0;

    // transitions definition
    this._fadeInDuration = 1;
    this._fadeInEase = quartOut;
    this._fadeOutDuration = 1;
    this._fadeOutEase = quartIn;
  }
  _initMesh() {
    this._plane = new THREE.PlaneGeometry(this._meshWidth, this._meshHeight);

    // Create texture from rendered graphics
    this._texture = new THREE.Texture(this._canvas);

    // Create HUD material
    this._material = new THREE.MeshBasicMaterial({
      map: this._texture,
      transparent: true,
    });

    this._mesh = new THREE.Mesh(this._plane, this._material);
    this._updateMesh();

    this.add(this._mesh);
  }

  _updateMesh() {
    const vMargin = this._isVR ? 0.32 : 0.08;

    this._mesh.scale.set(this._scale, this._scale, 1);
    this._meshY = - this._viewHeight / 2 + (vMargin * this._viewHeight);
    this._mesh.position.set(0, this._meshY, 0);
  }
  updateViewSize(w, h, isVR) {
    this._viewWidth = w;
    this._viewHeight = h;
    this._scale = 1;
    this._isVR = isVR;

    this._updateMesh();
  }

  _showTutorialHandler() {
    this.fadeIn();
  }
  _hideTutorialHandler() {
    this.fadeOut();
  }

  fadeIn() {
    this._isVisible = true;
    this._isFadingIn = true;
    this._isFadingOut = false;
    this._fadeInStartTime = null;
    this._mesh.visible = true;
  }
  fadeOut() {
    this._isVisible = false;
    this._isFadingIn = false;
    this._isFadingOut = true;
    this._fadeOutStartTime = null;
  }

  update(time) {
    if (!this._isVisible && !this._isFadingOut) {
      return false;
    }

    let needsUpdate = false;

    if (this._isFadingIn) {
      // fade in transition

      if (!this._fadeInStartTime) {
        this._fadeInStartTime = time;
      }

      const deltaTime = time - this._fadeInStartTime;
      const progress = this._fadeInEase(Math.min(deltaTime / this._fadeInDuration, 1));

      this._opacity = progress;

      if (progress >= 1) {
        this._isFadingIn = false;
      }

      needsUpdate = true;
    } else if (this._isFadingOut) {
      // fade out transition

      if (!this._fadeOutStartTime) {
        this._fadeOutStartTime = time;
        this._fadeOutInitialOpacity = this._opacity;
      }

      const deltaTime = time - this._fadeOutStartTime;
      const progress = this._fadeOutEase(Math.min(deltaTime / this._fadeOutDuration, 1));

      this._opacity = this._fadeOutInitialOpacity * (1 - progress);

      if (progress >= 1) {
        this._mesh.visible = false;
      }

      needsUpdate = true;
    }

    return needsUpdate;
  }

  draw() {
    if (!this._isVisible && !this._isFadingOut) {
      return false;
    }

    this._ctx.clearRect(0, 0, this._canvasWidth, this._canvasHeight);

    this._texture.needsUpdate = true;

    if (this._isFadingOut && !this._opacity) {
      // last render for fading out
      this._isFadingOut = false;
      return true;
    }

    // draw text
    this._ctx.font = '42px Karla, sans-serif';
    this._ctx.fillStyle = `rgba(255, 255, 255, ${this._opacity})`;
    this._ctx.textAlign = 'center';
    const cText = 'PRESS SPACE / APP BUTTON TO PAUSE'.split('').join(String.fromCharCode(8201));
    this._ctx.fillText(cText, this._canvasWidth / 2, this._canvasHeight / 2);

    this._texture.needsUpdate = true;
  }
}

module.exports = PauseHint;