const TWEEN = require('tween.js');
const glslify = require('glslify');
const quartIn = require('eases/quart-in');
const quartOut = require('eases/quart-out');

const vertexShader = glslify('../shaders/double-texture.vert');
const fragmentShader = glslify('../shaders/double-texture.frag');


class EndCredits extends (THREE.Object3D) {
  constructor(app) {
    super();

    this.app = app;

    // binding methods
    this.update = this.update.bind(this);
    this._endCreditsRayUVUpdateHandler = this._endCreditsRayUVUpdateHandler.bind(this);
    this._clickHandler = this._clickHandler.bind(this);

    this._initArea();
    this._initRunes();

    // setup handlers
    this.app.renderer.domElement.addEventListener('click', this._clickHandler);
    this.app.emitter.on('endCreditsRayUVUpdate', this._endCreditsRayUVUpdateHandler);
  }

  _initArea() {
    const phiLength = Math.PI * 0.577148438;
    const thetaLength = Math.PI * 0.5;
    const thetaStart = (Math.PI - thetaLength) / 2;

    const areaGeometry = new THREE.SphereGeometry(
      8,
      24,
      24,
      Math.PI,
      phiLength,
      thetaStart,
      thetaLength,
    );

    this.canvas = document.createElement('canvas');
    this.canvas.width = 1182;
    this.canvas.height = 1024;
    this.ctx = this.canvas.getContext('2d');

    this._shareOpacity = 0.5;
    this._isShareHovered = false;
    this._replayOpacity = 0.5;
    this._isReplayHovered = false;
    this._shareOpenProgress = 0;

    const baseTexture = new THREE.TextureLoader().load('textures/rok-finalscreen-half.jpg');
    this.canvasTexture = new THREE.Texture(this.canvas);

    this.uniforms = {
      t0: { type: "t", value: baseTexture },
      t1: { type: "t", value: this.canvasTexture },
    };

    const areaMaterial = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      lights: false,
      opacity: 0,
      side: THREE.DoubleSide, // needed for raycaster intersection
    });

    this.areaMesh = new THREE.Mesh(areaGeometry, areaMaterial);
    this.areaMesh.name = 'endCreditsArea';
    this.areaMesh.position.set(0, 1, 2);
    this.areaMesh.scale.x = -1;
    this.areaMesh.rotateY(-Math.PI / 4);

    this.add(this.areaMesh);
  }

  _initRunes() {
    this._runes = {
      eye: [[593, 450], [780, 512], [593, 575], [407, 512], [593, 450]],
      time: [[686, 419], [500, 606], [686, 606], [500, 419], [686, 419]],
      shield: [[593, 326], [686, 419], [686, 606], [593, 700], [500, 606], [500, 419], [593, 326]],
      lands: [[593, 450], [686, 606], [780, 512], [407, 512], [500, 606], [593, 450]],
      arrow: [[593, 326], [593, 700], [686, 419], [593, 450], [500, 419], [593, 700]],
      crown: [[593, 553], [686, 419], [686, 606], [780, 512], [407, 512], [500, 606], [500, 419], [593, 553]],
      rok: [[593, 326], [686, 606], [780, 512], [686, 419], [593, 700], [500, 419], [407, 512], [500, 606], [593, 326]],
    };

    this._runesCount = Object.keys(this._runes).length;

    this._collectedRunes = [];

    this._currentRuneIndex = 0;
    this._currentRuneOpacity = 0;

    this._runeTransitionStartTime = null;
    this._runeFadeInDuration = 1;
    this._runeFadeInEase = quartOut;
    this._runeStayDuration = 1.5;
    this._runeFadeOutDuration = 0.75;
    this._runeFadeOutEase = quartIn;

    this._runeTransition = 'fade-in';
  }

  _endCreditsRayUVUpdateHandler(uv) {
    // convert uv to canvas coords
    const x = uv.x * this.canvas.width;
    const y = (1 - uv.y) * this.canvas.height;

    this._latestRayCoords = { x, y };

    this._isShareHovered = this._rayInBoundingBox(87, 566, 183, 598);
    this._isReplayHovered = this._isShareHovered ? false : this._rayInBoundingBox(224, 568, 268, 596);

    this._isShareLeftHovered = this._isShareHovered ? this._rayInBoundingBox(87, 566, 135, 598) : false;
    this._isShareRightHovered = this._isShareHovered ? !this._isShareLeftHovered : false;
  }

  _rayInBoundingBox(x1, y1, x2, y2) {
    if (!this._latestRayCoords) {
      return false;
    }

    const x = this._latestRayCoords.x;
    const y = this._latestRayCoords.y;

    const isHorizontallyIn = (x > x1) && (x <= x2);
    const isVerticallyIn = (y > y1) && (y <= y2);

    return isHorizontallyIn && isVerticallyIn;
  }

  _clickHandler(e) {
    e.preventDefault();

    if (this._isShareHovered) {
      if (this._isShareOpen) {
        if (this._isShareLeftHovered) {
          // is in first half
          this._shareWithFacebook();
        } else {
          // is in second half
          this._shareWithTwitter();
        }
      } else {
        this._isShareOpen = true;
      }
    } else if (this._isReplayHovered) {
      this._replayHandler();
    }
  }

  _updateCanvasState(time) {
    if (!this._runeTransitionStartTime) {
      this._runeTransitionStartTime = time;
    }

    const deltaTime = time - this._runeTransitionStartTime;

    if (this._runeTransition === 'fade-in') {
      const progress = this._runeFadeInEase(Math.min(deltaTime / this._runeFadeInDuration, 1));

      this._currentRuneOpacity = progress;

      if (progress === 1) {
        this._runeTransition = 'stay';
        this._runeTransitionStartTime = null;
      }
    } else if (this._runeTransition === 'fade-out') {
      const progress = this._runeFadeOutEase(Math.min(deltaTime / this._runeFadeOutDuration, 1));

      this._currentRuneOpacity = 1 - progress;

      if (progress === 1) {
        this._currentRuneIndex = (this._currentRuneIndex + 1) % this._collectedRunes.length;
        this._runeTransition = 'fade-in';
        this._runeTransitionStartTime = null;
      }
    } else {
      const progress = Math.min(deltaTime / this._runeStayDuration, 1);

      if (progress === 1) {
        this._runeTransition = 'fade-out';
        this._runeTransitionStartTime = null;
      }
    }

    if (this._isShareHovered) {
      // ray is hovering share button
      this._shareOpacity = Math.min(this._shareOpacity + 0.02, 1);
      this._replayOpacity = Math.max(this._replayOpacity - 0.02, 0.5);

      if (this._isShareOpen) {
        this._shareOpenProgress = Math.min(this._shareOpenProgress + 0.04, 1);
      }
    } else if (this._isReplayHovered) {
      // ray is hovering replay button
      this._isShareOpen = false;
      this._replayOpacity = Math.min(this._replayOpacity + 0.02, 1);
      this._shareOpacity = Math.max(this._shareOpacity - 0.02, 0.5);

      this._shareOpenProgress = Math.max(this._shareOpenProgress - 0.04, 0);
    } else {
      this._isShareOpen = false;
      this._shareOpacity = Math.max(this._shareOpacity - 0.02, 0.5);
      this._replayOpacity = Math.max(this._replayOpacity - 0.02, 0.5);

      this._shareOpenProgress = Math.max(this._shareOpenProgress - 0.04, 0);
    }
  }
  _drawCanvas() {
    // draw runes
    const runeName = this._collectedRunes[this._currentRuneIndex];
    const rune = this._runes[runeName];

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    if (rune && rune.length) {
      this.ctx.beginPath();
      this.ctx.moveTo(rune[0][0], rune[0][1]);

      for (let i = 1; i < rune.length; i++) {
        this.ctx.lineTo(rune[i][0], rune[i][1]);
      }

      this.ctx.strokeStyle = `rgba(255, 255, 255, ${this._currentRuneOpacity})`;
      this.ctx.lineWidth = 3;

      this.ctx.stroke();
    }

    // draw counter text
    this.ctx.font = '300 68px Teko, sans-serif';
    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`${this._collectedRunes.length}/${this._runesCount}`, 81, 464);
    this.ctx.fillText('RUNES CAST', 81, 534);

    // draw buttons
    this.ctx.font = '300 14px Teko, sans-serif';
    this.ctx.textAlign = 'center';
    const buttonsY = 586;

    // draw share button
    const shareX = 135;
    const shareText = 'SHARE'.split('').join(String.fromCharCode(8201));
    const fbText = 'FB'.split('').join(String.fromCharCode(8201));
    const twText = 'TW'.split('').join(String.fromCharCode(8201));
    this.ctx.fillStyle = `rgba(255, 255, 255, ${this._shareOpacity * (1 - this._shareOpenProgress)})`;
    this.ctx.fillText(shareText, shareX, buttonsY);
    this.ctx.fillStyle = `rgba(255, 255, 255, ${this._shareOpacity * (this._shareOpenProgress)})`;
    this.ctx.fillText(fbText, shareX - 24, buttonsY);
    this.ctx.fillText(twText, shareX + 24, buttonsY);

    this.ctx.beginPath();
    this.ctx.moveTo(shareX - 48, buttonsY - 20);
    this.ctx.lineTo(shareX + 48, buttonsY - 20);
    this.ctx.lineTo(shareX + 48, buttonsY + 12);
    this.ctx.lineTo(shareX - 48, buttonsY + 12);
    this.ctx.closePath();
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${this._shareOpacity})`;
    this.ctx.stroke();
    this.ctx.beginPath();
    const initShareVLineY = buttonsY - 19;
    this.ctx.moveTo(shareX, initShareVLineY);
    this.ctx.lineTo(shareX, initShareVLineY + ((buttonsY + 11 - initShareVLineY) * this._shareOpenProgress));
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // draw replay
    const replayX = 246;
    const replayText = 'REPLAY'.split('').join(String.fromCharCode(8201));
    this.ctx.fillStyle = `rgba(255, 255, 255, ${this._replayOpacity})`;
    this.ctx.fillText(replayText, replayX, buttonsY);
    this.ctx.beginPath();
    this.ctx.moveTo(replayX - 22, buttonsY + 10);
    this.ctx.lineTo(replayX + 22, buttonsY + 10);
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${this._replayOpacity})`;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    if (runeName) {
      // draw rune name text
      this.ctx.font = '300 16px Teko, sans-serif';
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this._currentRuneOpacity})`;
      this.ctx.textAlign = 'left';
      const ctext = `${this._currentRuneIndex + 1}. ${runeName.toUpperCase()}`.split('').join(String.fromCharCode(8201));
      this.ctx.fillText(ctext, 81, 666); // 🤘 the number of the beast
    }
  }

  _replayHandler() {
    this.app.emitter.emit('restartExperience');
  }

  _shareWithFacebook() {
    console.log('share with facebook');

    const shortUrl = encodeURIComponent('https://rok-vr.com');
    const url = `https://www.facebook.com/sharer/sharer.php?u=${shortUrl}`;
    const opts = `status=1,width=575,height=400,top=${(window.clientHeight - 400) / 2},left=${(window.clientWidth - 575) / 2}`;

    window.open(url, 'Facebook', opts);
  }
  _shareWithTwitter() {
    console.log('share with twitter');

    const text = encodeURIComponent('https://rok-vr.com');
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    const opts = `status=1,width=575,height=400,top=${(window.clientHeight - 400) / 2},left=${(window.clientWidth - 575) / 2}`;

    window.open(url, 'Twitter', opts);
  }

  addToRayController(controller) {
    controller.add(this.areaMesh, {
      over: function(bool) {
        // console.log('EndCreditsArea - over', bool);
      },
      active: function(bool) {
        // console.log('EndCreditsArea - active', bool);
      }
    });
  }

  setCollectedRunes(collectedRunes) {
    this._collectedRunes = collectedRunes;
    this._currentRuneIndex = 0;
    this._runeTransitionStartTime = null;
  }

  fadeIn() {
    new TWEEN.Tween(this.areaMesh.material)
      .to({ opacity: 1 }, 3000)
      .easing(TWEEN.Easing.Quadratic.Out)
      .start();
  }
  fadeOut(duration) {
    if (duration > 0) {
      new TWEEN.Tween(this.areaMesh.material)
        .to({ opacity: 0 }, duration)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
    } else {
      this.areaMesh.material.opacity = 0;
    }
  }

  update(dt, time) {
    this._updateCanvasState(time);
    this._drawCanvas();

    this.canvasTexture.needsUpdate = true;
  }
}


module.exports = EndCredits;