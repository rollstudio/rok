const quartOut = require('eases/quart-out');
const quartIn = require('eases/quart-in');
const Dot = require('../assets/RuneGrid/Dot');
const Segment = require('../assets/RuneGrid/Segment');


class Tutorial extends (THREE.Object3D) {
  constructor(app, viewWidth, viewHeight) {
    super();

    this._app = app;
    this._viewWidth = viewWidth;
    this._viewHeight = viewHeight;
    this._scale = 1;

    this._meshWidth = 0.215 * this._viewHeight;
    this._meshHeight = 0.215 * this._viewHeight;
    this._canvasWidth = 256;
    this._canvasHeight = 256;
    this._contentWidth = 256;
    this._contentHeight = 80;
    this._contentX = (this._canvasWidth - this._contentWidth) / 2;
    this._contentY = (this._canvasHeight - this._contentHeight) / 2;

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

    this._dragLoopDots = [
      new Dot(this._contentX + 7, this._contentY + 10),
      new Dot(this._contentX + 7, this._contentY + 42),
      new Dot(this._contentX + 35, this._contentY + 32),
      new Dot(this._contentX + 35, this._contentY + 64),
    ];
    this._dragLoopSegments = [
      new Segment(this._dragLoopDots[0], this._dragLoopDots[1]),
      new Segment(this._dragLoopDots[1], this._dragLoopDots[2]),
      new Segment(this._dragLoopDots[2], this._dragLoopDots[3]),
    ];
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
    this._mesh.scale.set(this._scale, this._scale, 1);
  }
  updateViewSize(w, h) {
    this._viewWidth = w;
    this._viewHeight = h;
    this._scale = 1;

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

    this._dragLoopDots[0].activate();
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
        this._mesh.visible = false;
      }
    }

    if (!this.loopStartTime) {
      this.loopStartTime = time;
      this.loopStep = -1;
    }

    const loopDeltaTime = time - this.loopStartTime;

    if (this.loopStep === -1) {
      this._dragLoopDots[0].activate();
      this.loopStep = 0;
    } else if (this.loopStep === 0 && loopDeltaTime > 1) {
      this._dragLoopDots[0].complete();
      this._dragLoopDots[1].activate();
      this._dragLoopSegments[0].activate();
      this._dragLoopSegments[0].showLine();
      this.loopStep = 1;
    } else if (this.loopStep === 1) {
      const progress = Math.min(loopDeltaTime - 2, 1);
      this._dragLoopSegments[0].updateProgress(progress);
      if (progress === 1) {
        this._dragLoopSegments[0].complete();
        this.loopStep = 2;
      }
    } else if (this.loopStep === 2) {
      this._dragLoopDots[1].complete();
      this._dragLoopDots[2].activate();
      this._dragLoopSegments[1].activate();
      this._dragLoopSegments[1].showLine();
      this.loopStep = 3;
    } else if (this.loopStep === 3) {
      const progress = Math.min(loopDeltaTime - 3, 1);
      this._dragLoopSegments[1].updateProgress(progress);
      if (progress === 1) {
        this._dragLoopSegments[1].complete();
        this.loopStep = 4;
      }
    } else if (this.loopStep === 4) {
      this._dragLoopDots[2].complete();
      this._dragLoopDots[3].activate();
      this._dragLoopSegments[2].activate();
      this._dragLoopSegments[2].showLine();
      this.loopStep = 5;
    } else if (this.loopStep === 5) {
      const progress = Math.min(loopDeltaTime - 4, 1);
      this._dragLoopSegments[2].updateProgress(progress);
      if (progress === 1) {
        this._dragLoopSegments[2].complete();
        this.loopStep = 6;
      }
    } else if (this.loopStep === 6) {
      this._dragLoopDots[3].complete();
      this.loopStep = 7;
    } else if (this.loopStep === 7 && loopDeltaTime > 5) {
      this._dragLoopDots.forEach(d => {
        d.deactivate();
      });
      this._dragLoopSegments.forEach(s => {
        s.deactivate();
      });
      this.loopStep = 8;
    } else if (this.loopStep === 8 && loopDeltaTime > 6.5) {
      this.loopStartTime = null;
    }

    // update dots
    this._dragLoopDots.forEach(d => {
      d.update(time);
    });

    // update segments
    this._dragLoopSegments.forEach(s => {
      s.update(time);
    });

    return true;
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

    // draw vertical line
    this._ctx.beginPath();
    this._ctx.moveTo(this._contentX + 70, this._contentY);
    this._ctx.lineWidth = 1;
    this._ctx.strokeStyle = `rgba(255, 255, 255, ${this._opacity})`;
    this._ctx.lineTo(this._contentX + 70, this._contentY + this._contentHeight);
    this._ctx.stroke();

    // draw text
    this._ctx.font = '300 25px Teko, sans-serif';
    this._ctx.fillStyle = `rgba(255, 255, 255, ${this._opacity})`;
    this._ctx.textAlign = 'left';
    const cText = 'HOW TO PLAY'.split('').join(String.fromCharCode(8202));
    this._ctx.fillText(cText, this._contentX + 100, this._contentY + 35);
    this._ctx.font = '16px Karla, sans-serif';
    this._ctx.fillText('Drag to cast the rune', this._contentX + 100, this._contentY + this._contentHeight - 16);

    // draw dots
    this._dragLoopDots.forEach(d => {
      d.draw(this._ctx);
    });

    // draw segments
    this._dragLoopSegments.forEach(s => {
      s.draw(this._ctx);
    });
  }
}

module.exports = Tutorial;