const quartOut = require('eases/quart-out');
const quartIn = require('eases/quart-in');


class PauseButton extends (THREE.Object3D) {
  constructor(app, viewWidth, viewHeight) {
    super();

    this._app = app;
    this._viewWidth = viewWidth;
    this._viewHeight = viewHeight;
    this._scale = 1;

    this._meshWidth = 0.027 * this._viewHeight;
    this._meshHeight = 0.027 * this._viewHeight;
    this._canvasWidth = 32;
    this._canvasHeight = 32;
    this._contentWidth = 30;
    this._contentHeight = 30;
    this._contentX = (this._canvasWidth - this._contentWidth) / 2;
    this._contentY = (this._canvasHeight - this._contentHeight) / 2;

    this._isPlaying = true;

    this._app.emitter.on('end', this.fadeOut.bind(this));
    this._app.emitter.on('pauseExperience', this._pauseExperienceHandler.bind(this));
    this._app.emitter.on('playExperience', this._playExperienceHandler.bind(this));

    this._initCanvas();
    this._initMesh();
  }

  _initCanvas() {
    this._canvas = document.createElement('canvas');
    this._canvas.width = this._canvasWidth;
    this._canvas.height = this._canvasHeight;
    this._ctx = this._canvas.getContext('2d');

    this._isVisible = true;
    this._isHovered = false;
    this._opacity = 1;
    this._intensity = 0.4;
    this._minIntensity = 0.4;
    this._maxIntensity = 1;

    // transitions definition
    this._fadeInDuration = 0.5;
    this._fadeInEase = quartOut;
    this._fadeOutDuration = 0.5;
    this._fadeOutEase = quartIn;
    this._hoveringDuration = 0.3;
    this._hoveringEase = quartIn;
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
    this._mesh.name = 'pauseButton';
    this._updateMesh();

    this.add(this._mesh);
  }

  _pauseExperienceHandler() {
    this._isPlaying = false;
  }
  _playExperienceHandler() {
    this._isPlaying = true;
  }

  _updateMesh() {
    this._mesh.scale.set(this._scale, this._scale, 1);

    if (this._isVR) {
      this._meshX = -(0.0285 * this._viewHeight) - (this._meshWidth * this._scale * 0.5);
      this._meshY = - ((this._viewHeight / 2) - (0.20 * this._viewHeight) - (this._meshHeight * this._scale * 0.5));
      this._mesh.position.set(this._meshX, this._meshY, 0);
    } else {
      this._meshX = (this._viewWidth / 2) - (0.074 * this._viewHeight) - (this._meshWidth * this._scale * 1.5); // ✨
      this._meshY = - ((this._viewHeight / 2) - (0.057 * this._viewHeight) - (this._meshHeight * this._scale * 0.5));
      this._mesh.position.set(this._meshX, this._meshY, 0);
    }
  }

  _inBoundingBox(x, y) {
    const isHorizontallyIn = (x > this._contentX) && (x <= this._contentX + this._contentWidth);
    const isVerticallyIn = (y > this._contentY) && (y <= this._contentY + this._contentHeight);

    return isHorizontallyIn && isVerticallyIn;
  }

  updateOver(isOver) {
    if (this._isVisible && isOver && !this._isHovered) {
      this.hoverIn();
    } else if (!isOver && this._isHovered) {
      this.hoverOut();
    }
  }
  updateActive(isActive) {
    if (this._isVisible && this._isHovered && this._rayIsActive && !isActive) {
      // it's a click!
      if (this._isPlaying) {
        this._app.emitter.emit('pauseExperience');
      } else {
        this._app.emitter.emit('playExperience');
      }
    }

    this._rayIsActive = isActive;
  }

  updateViewSize(w, h, isVR) {
    this._viewWidth = w;
    this._viewHeight = h;
    this._scale = isVR ? 1.5 : 1;
    this._isVR = isVR;

    this._updateMesh();
  }

  hoverIn() {
    this._isHovered = true;
    this._isHoveringIn = true;
    this._isHoveringOut = false;
    this._hoverInStartTime = null;
  }
  hoverOut() {
    this._isHovered = false;
    this._isHoveringIn = false;
    this._isHoveringOut = true;
    this._hoverOutStartTime = null;
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

      if (progress >= 1 || !this._opacity) {
        this._isFadingOut = false;
        this._mesh.visible = false;
      }

      needsUpdate = true;
    }

    if (this._isHoveringIn) {
      // hover in transition

      if (!this._hoverInStartTime) {
        this._hoverInStartTime = time;
      }

      const deltaTime = time - this._hoverInStartTime;
      const progress = this._hoveringEase(Math.min(deltaTime / this._hoveringDuration, 1));

      this._intensity = this._minIntensity + ((this._maxIntensity - this._minIntensity) * progress);

      if (progress >= 1) {
        this._isHoveringIn = false;
      }

      needsUpdate = true;
    } else if (this._isHoveringOut) {
      // hover out transition

      if (!this._hoverOutStartTime) {
        this._hoverOutStartTime = time;
        this._hoverOutInitialIntensity = this._intensity;
      }

      const deltaTime = time - this._hoverOutStartTime;
      const progress = this._hoveringEase(Math.min(deltaTime / this._hoveringDuration, 1));

      this._intensity = Math.max(
        this._minIntensity + (
          ((this._maxIntensity - this._minIntensity) * (1 - progress)) - (this._maxIntensity - this._hoverOutInitialIntensity)
        ),
        this._minIntensity
      );

      if (progress >= 1 || this._intensity === this._minIntensity) {
        this._isHoveringOut = false;
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

    // draw border
    this._ctx.strokeStyle = `rgba(255, 255, 255, ${this._opacity * this._intensity})`;
    this._ctx.lineWidth = 1;
    this._ctx.strokeRect(this._contentX, this._contentY, this._contentWidth, this._contentHeight);

    if (this._isPlaying) {
      // draw pause bars
      this._ctx.fillStyle = `rgba(255, 255, 255, ${this._opacity * this._intensity})`;
      this._ctx.fillRect(this._contentX + 12, this._contentY + 10, 2, 10);
      this._ctx.fillRect(this._contentX + 16, this._contentY + 10, 2, 10);
    } else {
      // draw play triangle
      this._ctx.fillStyle = `rgba(255, 255, 255, ${this._opacity * this._intensity})`;
      this._ctx.beginPath();
      this._ctx.moveTo(this._contentX + 11, this._contentY + 10);
      this._ctx.lineTo(this._contentX + 20, this._contentY + 15);
      this._ctx.lineTo(this._contentX + 11, this._contentY + 20);
      this._ctx.closePath();
      this._ctx.fill();
    }

    this._texture.needsUpdate = true;
  }
}

module.exports = PauseButton;