class FadeEvent {
  constructor(options) {
    this.experience = options.experience;

    this.id = options.id;
    this.type = 'fade';
    this.time = options.time;
    this.duration = options.duration;
    this.color = options.color || new THREE.Vector3(0.0, 0.0, 0.0);
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
    this.initialIntensity = this.experience.sky.properties.fadeIntensity;
    this.intensityVariation = this.intensity - this.initialIntensity;

    this.experience.sky.fadeColorUpdate(this.color);

    console.log(`[FADE-EVENT] "${this.id}" started at`, time);
  }
  _end(time) {
    this.isRunning = false;
    this.isEnded = true;

    this.startTime = null;
    this.initialIntensity = null;
    this.intensityVariation = null;

    this.experience.sky.fadeIntensityUpdate(this.intensity);

    console.log(`[FADE-EVENT] "${this.id}" ended at`, time);
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

        this.experience.sky.fadeIntensityUpdate(currentIntensity);
      }
    }
  }
}


module.exports = FadeEvent;
