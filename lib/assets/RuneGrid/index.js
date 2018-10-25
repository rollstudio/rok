const quartIn = require('eases/quart-in');
const quartOut = require('eases/quart-out');

const SideTexts = require('./SideTexts');
const TimeRing = require('./TimeRing');
const Dot = require('./Dot');
const Segment = require('./Segment');


class RuneGrid extends (THREE.Group) {
  constructor(app) {
    super();

    this.app = app;

    this.runeGridRayUVUpdateHandler = this.runeGridRayUVUpdateHandler.bind(this);

    this.app.emitter.on('runeGridRayUVUpdate', this.runeGridRayUVUpdateHandler);

    this.canvas = document.createElement('canvas');
    this.canvas.width = 512 * 2;
    this.canvas.height = 512;

    this.activeZ = -5;
    this.planesSize = 5;

    /* debugging
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = 0;
    this.canvas.style.left = 0;
    this.canvas.style.width = '512px';
    this.canvas.style.height = '256px';
    this.canvas.style.border = '1px solid magenta';
    this.canvas.style.zIndex = '99999999999999';
    document.body.appendChild(this.canvas);
    /* debugging */

    this.ctx = this.canvas.getContext('2d');

    this.isVisible = false;
    this.currentRuneDotIndex = null;
    this.collectedRunes = 0;
    this.isCompleted = false;

    this._setupLayers();

    this.runes = {
      eye: [16, 6, 20, 4, 16],
      time: [9, 11, 10, 8, 9],
      arrow: [5, 7, 9, 16, 8, 7],
      lands: [16, 10, 6, 4, 11, 16],
      lightening: [5, 25, 13, 7, 26, 15, 5],
      shield: [5, 9, 10, 7, 11, 8, 5],
      crown: [26, 9, 10, 6, 4, 11, 8, 26],
      rok: [5, 10, 6, 9, 7, 8, 4, 11, 5],
    };

    this._setupCanvasElements();
  }

  _setupCanvasElements() {
    this.timeRing = new TimeRing();

    this.sideTexts = new SideTexts();

    this.dots = [];
    // external square (starting from top left) [0]
    this.dots.push(new Dot(97 + 256, 97));
    this.dots.push(new Dot(415 + 256, 97));
    this.dots.push(new Dot(415 + 256, 415));
    this.dots.push(new Dot(97 + 256, 415));

    // external square rotated (starting from left) [4]
    this.dots.push(new Dot(31 + 256, 256));
    this.dots.push(new Dot(256 + 256, 31));
    this.dots.push(new Dot(481 + 256, 256));
    this.dots.push(new Dot(256 + 256, 481));

    // external star 0 (starting from top left) [8]
    this.dots.push(new Dot(143 + 256, 143));
    this.dots.push(new Dot(369 + 256, 143));
    this.dots.push(new Dot(369 + 256, 369));
    this.dots.push(new Dot(143 + 256, 369));

    // internal square (starting from top left) [12]
    this.dots.push(new Dot(211 + 256, 166));
    this.dots.push(new Dot(346 + 256, 211));
    this.dots.push(new Dot(301 + 256, 346));
    this.dots.push(new Dot(166 + 256, 301));

    // octagon (starting from top) [16]
    this.dots.push(new Dot(256 + 256, 181));
    this.dots.push(new Dot(312 + 256, 200));
    this.dots.push(new Dot(331 + 256, 256));
    this.dots.push(new Dot(312 + 256, 312));
    this.dots.push(new Dot(256 + 256, 331));
    this.dots.push(new Dot(200 + 256, 312));
    this.dots.push(new Dot(181 + 256, 256));
    this.dots.push(new Dot(200 + 256, 200));

    // internal v-stripe (starting from top) [24]
    this.dots.push(new Dot(256 + 256, 200));
    this.dots.push(new Dot(256 + 256, 228));
    this.dots.push(new Dot(256 + 256, 284));
    this.dots.push(new Dot(256 + 256, 312));
  }
  _prepareSegments() {
    this.segments = [];

    const dotsIndexes = this.runes[this.currentRune];

    const segmentsCount = dotsIndexes.length - 1;
    let i = 0;

    while (i < segmentsCount) {
      this.segments.push(new Segment(this.dots[dotsIndexes[i]], this.dots[dotsIndexes[i + 1]]));

      i++;
    }

    console.log(`[RuneGrid] created ${i} segments`);
  }
  _setupLayers() {
    this.gridObject = new THREE.Group();

    // Layer 0
    this.layer0Geometry = new THREE.PlaneBufferGeometry(this.planesSize, this.planesSize, 1, 1);
    this.layer0Texture = new THREE.TextureLoader().load('./textures/rune-grid.png');
    this.layer0 = new THREE.Mesh(this.layer0Geometry, new THREE.MeshBasicMaterial({
      transparent: true,
      map: this.layer0Texture,
    }));
    this.layer0.translateZ(0.2);
    this.gridObject.add(this.layer0);

    // Layer 1 (canvas)
    this.layer1Geometry = new THREE.PlaneBufferGeometry(this.planesSize * 2, this.planesSize, 1, 1);
    this.layer1Texture = new THREE.Texture(this.canvas);
    this.layer1 = new THREE.Mesh(this.layer1Geometry, new THREE.MeshBasicMaterial({
      transparent: true,
      map: this.layer1Texture,
    }));
    this.layer1.name = 'runeMesh';
    this.layer1.translateZ(0.2);
    this.gridObject.add(this.layer1);

    this.add(this.gridObject);
  }
  _updateCanvasState(time) {
    if (this.isVisible && this.currentRuneDotIndex !== null) {
      const x = this.latestRayCoords ? this.latestRayCoords.x : 0;
      const y = this.latestRayCoords ? this.latestRayCoords.y : 0;

      const currentSegment = (this.currentRuneDotIndex > 0 && this.currentRuneDotIndex < this.segments.length + 1)
        ? this.segments[this.currentRuneDotIndex - 1]
        : null;

      if (currentSegment && currentSegment.isVisible && !currentSegment.isComplete) {
        currentSegment.updateProgressByCoords(x, y);
      }

      // current active dot through rune dots list
      const dotsIndexes = this.runes[this.currentRune];
      const dot = this.dots[dotsIndexes[this.currentRuneDotIndex]];

      // calc distance from dot
      const xDistance = Math.abs(x - dot.x);
      const yDistance = Math.abs(y - dot.y);
      const dotRadius = dot.ringMaxRadius;

      if ((currentSegment && currentSegment.isComplete) || xDistance < dotRadius && yDistance < dotRadius) {
        // the segment is completed or the ray is overing dot (useful for first interaction)

        // set dot complete
        dot.complete();

        if (currentSegment && !currentSegment.isComplete) {
          currentSegment.complete();
        }

        // activate next dot or complete rune
        this.currentRuneDotIndex = this.currentRuneDotIndex + 1 < dotsIndexes.length ? this.currentRuneDotIndex + 1 : null;
        if (this.currentRuneDotIndex) {
          const nextDot = this.dots[dotsIndexes[this.currentRuneDotIndex]];
          nextDot.activate();

          this.segments[this.currentRuneDotIndex - 1].activate();
        } else {
          // rune complete
          this._runeComplete();
        }
      }
    }

    // update side texts
    this.sideTexts.update(time);

    // update time-ring
    this.timeRing.update(time);

    // update segments
    this.segments.forEach(s => {
      s.update(time);
    });

    // update dots
    this.dots.forEach(d => {
      d.update(time);
    });
  }
  _drawCanvas() {
    // clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // update side texts
    this.sideTexts.draw(this.ctx);

    // draw time-ring
    this.timeRing.draw(this.ctx);

    // draw segments
    this.segments.forEach(s => {
      s.draw(this.ctx);
    });

    // draw dots
    this.dots.forEach(d => {
      d.draw(this.ctx);
    });
  }
  _runeComplete() {
    this.collectedRunes++;

    this.isCompleted = true;

    if (!this.isTutorial) {
      this.sideTexts.slideIn({
        collectedRunes: this.collectedRunes,
        runesCount: 8,
        runeName: this.currentRune,
        isTutorial: false,
      });

      setTimeout(() => {
        this.hide();

        this.sideTexts.slideOut();

        this.endCompleteHandler && this.endCompleteHandler(true); // with success
      }, 1500);
    } else {
      this.hide();

      this.sideTexts.slideOut();

      this.endCompleteHandler && this.endCompleteHandler(true); // with success
    }
  }
  _timeRunOut() {
    this.hide();

    this.endCompleteHandler && this.endCompleteHandler(false); // without success
  }
  show(rune, duration, isTutorial, callback) {
    this.isCompleted = false;

    if (!this.isVisible) {
      this.runeGridStartTime = null;
      this.transitionStartTime = null;
      this.transitionZVariation = this.activeZ;
      this.isVisible = true;
      this.isTutorial = isTutorial || false;
      this.currentRune = rune;
      this.duration = duration;
      this.timeRing.setDuration(this.duration);
      this.endCompleteHandler = callback;

      if (rune && this.runes[rune]) {
        const dotsIndexes = this.runes[rune];
        this.currentRuneDotIndex = 0;

        this._prepareSegments();

        this.dots[dotsIndexes[this.currentRuneDotIndex]].activate();

        if (this.isTutorial) {
          this.sideTexts.slideIn({
            collectedRunes: this.collectedRunes,
            runesCount: 8,
            runeName: this.currentRune,
            isTutorial: true,
          });
        }
      }
    }
  }
  hide() {
    if (!this.isVisible) {
      return;
    }

    this.transitionStartTime = null;
    this.transitionZVariation = -this.activeZ;
    this.isVisible = false;

    if (this.currentRune && this.runes[this.currentRune]) {
      const dotsIndexes = this.runes[this.currentRune];
      dotsIndexes.forEach(i => this.dots[i].deactivate());
    }
  }

  addToRayController(controller) {
    controller.add(this.layer1, {
      over: function(bool){
        // console.log('RuneGrid - over', bool);
      },
      active: function(bool){
        // console.log('RuneGrid - active', bool);
      }
    });
  }

  runeGridRayUVUpdateHandler(uv) {
    // convert uv to canvas coords
    const x = uv.x * this.canvas.width;
    const y = (1 - uv.y) * this.canvas.height;

    this.latestRayCoords = { x, y };
  }

  update(dt, time) {
    if (!this.isVisible && !this.transitionZVariation) {
      return;
    }

    if (!this.runeGridStartTime) {
      this.runeGridStartTime = time;
    }

    if (this.transitionZVariation) {
      // show or hide transition is set
      if (!this.transitionStartTime) {
        // first update
        this.transitionStartTime = time;
      }

      const deltaTime = time - this.transitionStartTime;
      const layersZ = this.isVisible ? 0 : this.activeZ;
      const easing = this.isVisible ? quartOut : quartIn;

      const transitionProgress = easing(Math.min(deltaTime / 2, 1));

      const transitionCurrentZ = layersZ + (transitionProgress * this.transitionZVariation);

      const transitionCurrentOpacity = this.isVisible ? transitionProgress : 1 - transitionProgress;

      this.gridObject.applyMatrix(new THREE.Matrix4()
        .makeTranslation(0, 0, transitionCurrentZ - (this.gridObjectZ || 0)));
      this.gridObject.children.forEach(c => {
        c.material.opacity = transitionCurrentOpacity;
      });

      this.gridObjectZ = transitionCurrentZ;

      if (deltaTime >= 2) {
        // transition finished
        this.transitionZVariation = null;
        this.transitionZStartTime = null;
      }
    }

    if (this.isVisible && time - this.runeGridStartTime > this.duration && !this.isCompleted) {
      // time run out
      this._timeRunOut();
    }

    this._updateCanvasState(time);
    this._drawCanvas();
    this.layer1Texture.needsUpdate = true;
  }
}


module.exports = RuneGrid;