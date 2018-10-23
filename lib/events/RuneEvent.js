class RuneEvent {
  constructor(options) {
    this.experience = options.experience;

    this.id = options.id;
    this.type = 'rune';
    this.time = options.time;
    this.rune = options.rune;
    this.duration = options.duration >= 0 ? options.duration : 15;

    this.isRunning = false;
    this.isEnded = false;

    // binding methods
    this._end = this._end.bind(this);
  }

  _start(time) {
    this.isRunning = true;
    this.isEnded = false;

    this.experience.runeMaster.activate(time, this.rune, this.duration, this._end);

    console.log(`[RUNE-EVENT] "${this.id}" started at`, time);
  }
  _end() {
    this.isRunning = false;
    this.isEnded = true;

    console.log(`[RUNE-EVENT] "${this.id}" ended`);
  }

  update(time) {
    if (!this.isEnded && !this.isRunning) {
      // first execution

      this._start(time);
    } else if (this.isRunning) {
      this.experience.runeMaster.update(time);
    }
  }
}


module.exports = RuneEvent;