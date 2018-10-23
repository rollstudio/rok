class EyeEvent {
  constructor(options) {
    this.experience = options.experience;

    this.id = options.id;
    this.type = 'eye';
    this.time = options.time;
    this.action = options.action || 'blink';
    this.duration = options.duration;

    this.isRunning = false;
    this.isEnded = false;

    // binding methods
    this._end = this._end.bind(this);
  }

  _start(time) {
    this.isRunning = true;
    this.isEnded = false;

    switch (this.action) {
      case 'open':
        this.experience.eye.open(this.duration, this._end);
        break;
      case 'close':
        this.experience.eye.close(this.duration, this._end);
        break;
      default:
      case 'blink':
        this.experience.eye.blink(this._end);
    }

    console.log(`[EYE-EVENT] "${this.id}" started at`, time);
  }
  _end(time) {
    this.isRunning = false;
    this.isEnded = true;

    console.log(`[EYE-EVENT] "${this.id}" ended at`, time);
  }

  update(time) {
    if (!this.isEnded && !this.isRunning) {
      // first execution

      this._start(time);
    }
  }
}


module.exports = EyeEvent;