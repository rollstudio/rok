
const cubicInOut = require('eases/cubic-in-out');

class TimeRing {
  constructor() {
    this.startTime = null;
    this.progress = 0;
    this.duration = -1;

    this.isFillingUp = true;
    this.fillingUpDuration = 1;
    this.fillingUpDelay = 0.6;
    this.fillingUpEase = cubicInOut;
  }
  setDuration(duration) {
    this.startTime = null;
    this.duration = duration;
    this.isFillingUp = true;
  }
  update(time) {
    if (this.duration < 0) {
      return;
    }

    if (!this.startTime) {
      this.startTime = time;
    }

    const deltaTime = time - this.startTime;

    if (this.isFillingUp) {
      const baseProgress = (deltaTime - this.fillingUpDelay) / this.fillingUpDuration;
      this.progress = this.fillingUpEase(Math.max(Math.min(baseProgress, 1), 0));

      if (this.progress >= 1) {
        this.isFillingUp = false;
        this.startTime = null;
        this.duration -= this.fillingUpDuration + this.fillingUpDelay;
      }
    } else {
      this.progress = 1 - Math.min(deltaTime / this.duration, 1);

      if (this.progress <= 0) {
        this.startTime = null;
        this.duration = -1;
      }
    }
  }
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(256 + 256, 256, 245, - (Math.PI / 2), -(Math.PI / 2) + ((2 * Math.PI) * this.progress));
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
}

module.exports = TimeRing;