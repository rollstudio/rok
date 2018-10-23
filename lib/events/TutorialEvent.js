class TutorialEvent {
  constructor(options) {
    this.experience = options.experience;

    this.id = options.id;
    this.type = 'tutorial';
    this.time = options.time;
    this.duration = options.duration >= 0 ? options.duration : 10;

    this.isRunning = false;
    this.isEnded = false;
  }

  _start(time) {
    this.isRunning = true;
    this.isEnded = false;
    this.startTime = time;

    this.experience.app.emitter.emit('showTutorial');

    console.log(`[TUTORIAL-EVENT] "${this.id}" started at`, time);
  }
  _end() {
    this.isRunning = false;
    this.isEnded = true;

    this.experience.app.emitter.emit('hideTutorial');

    console.log(`[TUTORIAL-EVENT] "${this.id}" ended`);
  }

  update(time) {
    if (!this.isEnded && !this.isRunning) {
      // first execution

      this._start(time);
    } else if (this.isRunning) {
      const deltaTime = time - this.startTime;

      if (deltaTime >= this.duration) {
        this._end();
      }
    }
  }
}


module.exports = TutorialEvent;