class BloomEvent {
  constructor(options) {
    this.experience = options.experience;

    this.id = options.id;
    this.type = 'bloom';
    this.time = options.time;
    this.duration = options.duration;
    this.intensity = options.intensity;

    this.isRunning = false;
    this.isEnded = false;

    // binding methods
    this._end = this._end.bind(this);
  }

  _start(time) {
    this.isRunning = true;
    this.isEnded = false;

    this.startTime = time;
    this.initialIntensity = this.experience.app.postProcessingOptions.bloomIntensity;
    this.intensityVariation = this.intensity - this.initialIntensity;

    console.log(`[BLOOM-EVENT] "${this.id}" started at`, time);
  }
  _end(time) {
    this.isRunning = false;
    this.isEnded = true;

    this.startTime = null;
    this.initialIntensity = null;
    this.intensityVariation = null;

    this.experience.app.postProcessingOptions.bloomIntensity = this.intensity;

    console.log(`[BLOOM-EVENT] "${this.id}" ended at`, time);
  }

  update(time) {
    if (!this.isEnded && !this.isRunning) {
      // first execution

      this._start(time);
    } else if (this.isRunning) {
      if (time - this.startTime > this.duration) {
        this._end(time);
      } else {
        const deltaTime = time - this.startTime;
        const progress = Math.min(deltaTime / this.duration, 1);
        const currentIntensity = (this.initialIntensity + (progress * this.intensityVariation));

        this.experience.app.postProcessingOptions.bloomIntensity = currentIntensity;
      }
    }
  }
}


module.exports = BloomEvent;