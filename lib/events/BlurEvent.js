class BlurEvent {
  constructor(options) {
    this.experience = options.experience;

    this.id = options.id;
    this.type = 'blur';
    this.time = options.time;
    this.duration = options.duration;
    this.blurIntensity = options.blurIntensity;

    this.isRunning = false;
    this.isEnded = false;

    // binding methods
    this._end = this._end.bind(this);
  }

  _start(time) {
    this.isRunning = true;
    this.isEnded = false;

    this.startTime = time;
    this.initialBlurIntensity = this.experience.app.postProcessingOptions.blurIntensity;
    this.blurIntensityVariation = this.blurIntensity - this.initialBlurIntensity;

    console.log(`[BLUR-EVENT] "${this.id}" started at`, time);
  }
  _end(time) {
    this.isRunning = false;
    this.isEnded = true;

    this.startTime = null;
    this.initialBlurIntensity = null;
    this.blurIntensityVariation = null;

    this.experience.app.postProcessingOptions.blurIntensity = this.blurIntensity;

    console.log(`[BLUR-EVENT] "${this.id}" ended at`, time);
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
        const currentBlurIntensity = (this.initialBlurIntensity + (progress * this.blurIntensityVariation));

        this.experience.app.postProcessingOptions.blurIntensity = currentBlurIntensity;
      }
    }
  }
}


module.exports = BlurEvent;