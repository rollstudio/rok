'use strict';


class RuneMaster {
  constructor(app, sky, voiceover, runeGrid) {
    console.log('[RuneMaster] init');

    this._runes = [
      'eye',
      'time',
      'arrow',
      'lands',
      'lightning',
      'shield',
      'crown',
      'rok',
    ];

    this._collectedRunes = [];
    this._app = app;
    this._sky = sky;
    this._voiceover = voiceover;
    this._runeGrid = runeGrid;
    this._duration = 10; // this is for timeout and is passed to runeGrid

    this._hide = this._hide.bind(this);
    this.update = this.update.bind(this);
    this._enableDistortion = this._enableDistortion.bind(this);
    this._disableDistortion = this._disableDistortion.bind(this);
  }

  _collectRune(rune, withSuccess) {
    if (!rune) {
      return false;
    }

    this._collectedRunes.push({
      name: rune,
      withSuccess: withSuccess,
    });

    this._sky.setCollectedRunes(this._collectedRunes.filter(r => r.withSuccess).map(r => r.name));

    console.log('Collected runes', this._collectedRunes);
  };
  _enableDistortion() {
    this._isDistortionEnabled = true;
  }
  _disableDistortion() {
    this._isDistortionEnabled = false;
    this._isDistortionDisabling = true;
    this._distortionDisabledTime = null;
  }
  _show(time) {
    console.log('[RuneMaster] show');

    // if on mause+keyboard, this disable dragging to move camera
    // disable play/pause events
    this._app.emitter.emit('startRuneInteraction');

    // slow down sky video
    this._sky.pauseVideo(true);
    // pause voiceover
    this._voiceover.stopAudio(true);

    // Syncing video
    this._app.emitter.emit('syncVideo');

    // show rune grid
    this._runeGrid.show(this._currentRune, this._duration, this._isTutorial, this._hide);

    this._enableDistortion();
  };
  _hide(completedWithSuccess) {
    console.log('[RuneMaster] hide');
    this._isActive = false;

    this._collectRune(this._currentRune, completedWithSuccess);

    // speed up sky video
    this._sky.startVideo(true);
    // play voiceover
    this._voiceover.play(true);
    // hide rune grid
    this._runeGrid.hide();

    // if on mouse+keyboard vr display, this re-enable dragging to move camera
    // enable play/pause events
    this._app.emitter.emit('endRuneInteraction');

    // disable music distortion
    this._disableDistortion();

  };

  restart() {
    this._collectedRunes = [];
    this._runeGrid.collectedRunes = 0;
  }

  activate(options, callback) {
    if (!this._isActive) {
      this._isActive = true;
      this._startTime = options.time;
      this._currentRune = options.rune;
      this._duration = options.duration;
      this._isTutorial = options.isTutorial;

      console.log('[RuneMaster] activated for', options.rune);

      this._doneHandler = options.onComplete;
      this._show(options.time);
    } else {
      options.onComplete();
    }
  }
  update(time) {
    if (this._isDistortionEnabled) {
      const deltaTime = time - this._startTime;
      const progress = Math.min(deltaTime / this._duration, 1);

      // set music distortion
      this._app.emitter.emit('makeDistortion', 'music', null, progress * 50);
    } else if (this._isDistortionDisabling) {
      if (!this._distortionDisabledTime) {
        this._distortionDisabledTime = time;
      }

      const deltaTime = time - this._distortionDisabledTime;
      const progress = Math.min(deltaTime / 2, 1);

      // set music distortion
      this._app.emitter.emit('makeDistortion', 'music', null, (1 - progress) * 50);

      if (progress >= 1) {
        this._isDistortionDisabling = false;

        if (this._doneHandler) {
          this._doneHandler();
        }
      }
    }
  }
  getCollectedRunes() {
    return this._collectedRunes;
  };
}


module.exports = RuneMaster;