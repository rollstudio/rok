const quintOut = require('eases/quint-out');
const backOut = require('eases/back-out');


class Dot {
  constructor(x, y) {
    this.isVisible = false;
    this.isComplete = false;

    this.x = x;
    this.y = y;

    this.opacity = 0;
    this.minRadius = 2.5;
    this.maxRadius = 3.5;
    this.radius = 2.5;
    this.ringOpacity = 1;
    this.ringRadius = 0;
    this.ringMaxRadius = 15;

    // animations definition
    this.fadeInDuration = 1;
    this.fadeInEase = p => p;
    this.fadeOutDuration = 1;
    this.fadeOutEase = p => p;
    this.enlargingDuration = 1;
    this.enlargingEase = backOut;
    this.pulseDuration = 2;
    this.pulseEase = quintOut;
  }

  activate() {
    this.isVisible = true;
    this.isEnlarging = false;
    this.isFadingIn = true;
    this.isFadingOut = false;
    this.isPulsing = true;
  }
  deactivate() {
    this.isVisible = false;
    this.isComplete = false;
    this.isPulsing = false;
    this.isEnlarging = false;
    this.isFadingIn = false;
    this.isFadingOut = true;
  }
  complete() {
    this.isPulsing = false;
    this.isComplete = true;
    this.isEnlarging = true;
  }

  update(time) {
    if (!this.isVisible && !this.isFadingOut) {
      return false;
    }

    if (this.isFadingIn) {
      // fade in transition

      if (!this.fadeInStartTime) {
        this.fadeInStartTime = time;
      }

      const deltaTime = time - this.fadeInStartTime;
      const progress = this.fadeInEase(Math.min(deltaTime / this.fadeInDuration, 1));

      this.opacity = progress;

      if (progress >= 1) {
        this.isFadingIn = false;
        this.fadeInStartTime = null;
      }
    } else if (this.isFadingOut) {
      // fade out transition

      if (!this.fadeOutStartTime) {
        this.fadeOutStartTime = time;
        this.fadeOutInitialOpacity = this.opacity;
      }

      const deltaTime = time - this.fadeOutStartTime;
      const progress = this.fadeOutEase(Math.min(deltaTime / this.fadeOutDuration, 1));

      this.opacity = this.fadeOutInitialOpacity * (1 - progress);

      if (progress >= 1 || !this.opacity) {
        this.isFadingOut = false;
        this.fadeOutStartTime = null;
        this.radius = this.minRadius;
      }
    }

    if (this.isEnlarging) {
      if (!this.enlargingStartTime) {
        this.enlargingStartTime = time;
      }

      const deltaTime = time - this.enlargingStartTime;
      const progress = this.enlargingEase(Math.min(deltaTime / this.enlargingDuration, 1));

      this.radius = this.minRadius + ((this.maxRadius - this.minRadius) * progress);

      if (progress >= 1) {
        this.isEnlarging = false;
        this.enlargingStartTime = null;
      }
    }

    if (this.isPulsing || this.pulseStartTime) {
      // ring pulse animation

      if (!this.pulseStartTime) {
        this.pulseStartTime = time;
      }

      const deltaTime = time - this.pulseStartTime;
      const progress = this.pulseEase(Math.min(deltaTime / this.pulseDuration, 1));

      this.ringOpacity = 1 - progress;
      this.ringRadius = this.radius + ((this.ringMaxRadius - this.radius) * progress);

      if (progress >= 1) {
        // continue looping
        this.pulseStartTime = null;
      }
    }
  }

  draw(ctx) {
    if (!this.isVisible && !this.isFadingOut) {
      return false;
    }

    // inside circle
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    ctx.closePath();
    ctx.fill();

    // outer ring
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.ringRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(255, 255, 255, ${this.ringOpacity})`;
    ctx.lineWidth = 1;
    ctx.closePath();
    ctx.stroke();
  }
}

module.exports = Dot;