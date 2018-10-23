class Segment {
  constructor(a, b) {
    this.isVisible = false;
    this.isComplete = false;

    this.a = a;
    this.b = b;

    this.antsOpacity = 0;
    this.opacity = 0;
    this.lineProgress = 0;
    this.lineDashOffset = 0;
    this.lineDashLength = 6;
    this.lineGapLength = 3;

    // animations definition
    this.fadeInDuration = 1;
    this.fadeInEase = p => p;
    this.fadeOutDuration = 1;
    this.fadeOutEase = p => p;
    this.marchingInDuration = 1;
    this.marchingInEase = p => p;
    this.marchingOutDuration = 1;
    this.marchingOutEase = p => p;
  }

  activate() {
    this.isVisible = true;
    this.isFadingIn = false;
    this.isFadingOut = false;
    this.isMarching = true;
    this.isMarchingIn = true;
    this.isMarchingOut = false;
  }
  deactivate() {
    this.isVisible = true;
    this.isFadingIn = false;
    this.isFadingOut = true;
    this.isMarching = false;
    this.isMarchingIn = false;
    this.isMarchingOut = false;
  }
  showLine() {
    if (!this.isFadingIn && this.opacity < 1) {
      this.isFadingIn = true;
      this.isFadingOut = false;
      this.isMarchingIn = false;
      this.isMarchingOut = true;
    }
  }
  complete() {
    this.isComplete = true;
    this.lineProgress = 1;

    if (!this.opacity) {
      this.showLine();
    }
  }

  updateProgressByCoords(x, y) {
    const deltaX = this.b.x - this.a.x;
    const deltaY = this.b.y - this.a.y;
    const k = (deltaY * (x - this.a.x) - deltaX * (y - this.a.y)) / ((deltaY * deltaY) + (deltaX * deltaX));
    const currentX = x - k * deltaY;
    const currentY = y + k * deltaX;

    const progress = Math.abs(deltaX) > 0 ? Math.min((currentX - this.a.x) / deltaX, 1) : Math.min((currentY - this.a.y) / deltaY, 1);

    this.updateProgress(progress);
  }

  updateProgress(progress) {
    this.lineProgress = Math.max(this.lineProgress, progress);

    if (this.lineProgress === 1) {
      this.complete();
    }
    if (this.lineProgress > 0.1) {
      this.showLine();
    }
  }

  update(time) {
    if (!this.isVisible) {
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
      }

      const deltaTime = time - this.fadeOutStartTime;
      const progress = this.fadeOutEase(Math.min(deltaTime / this.fadeOutDuration, 1));

      this.opacity = 1 - progress;

      if (progress >= 1) {
        this.isFadingOut = false;
        this.fadeOutStartTime = null;
        this.lineProgress = 0;
      }
    }

    if (this.isMarching) {
      // set movement
      if (!this.lastUpdateTime) {
        this.lastUpdateTime = time;
      }
      const deltaTime = time - this.lastUpdateTime;

      if (this.lineDashOffset > this.lineDashLength + this.lineGapLength) {
        this.lineDashOffset = 0;
      } else {
        this.lineDashOffset += deltaTime * ((this.lineDashLength + this.lineGapLength) / 2);
      }
      this.lastUpdateTime = time;

      if (this.isMarchingIn) {
        // marching in transition

        if (!this.marchingInStartTime) {
          this.marchingInStartTime = time;
        }

        const deltaTime = time - this.marchingInStartTime;
        const progress = this.marchingInEase(Math.min(deltaTime / this.marchingInDuration, 1));

        this.antsOpacity = progress;

        if (progress >= 1) {
          this.isMarchingIn = false;
        }
      } else if (this.isMarchingOut) {
        // marching out transition

        if (!this.marchingOutStartTime) {
          this.marchingOutStartTime = time;
          this.marchingOutInitialOpacity = this.antsOpacity;
        }

        const deltaTime = time - this.marchingOutStartTime;
        const progress = this.marchingOutEase(Math.min(deltaTime / this.marchingOutDuration, 1));

        this.antsOpacity = this.marchingOutInitialOpacity * (1 - progress);

        if (progress >= 1) {
          this.isMarchingOut = false;
          this.isMarching = false;
        }
      }
    }
  }

  draw(ctx) {
    if (!this.isVisible) {
      return false;
    }

    if (this.isMarching) {
      // marching ants
      ctx.beginPath();
      ctx.moveTo(this.a.x, this.a.y);
      ctx.lineTo(this.b.x, this.b.y);
      ctx.setLineDash([this.lineDashLength, this.lineGapLength]);
      ctx.lineDashOffset = -this.lineDashOffset;
      ctx.strokeStyle = `rgba(255, 255, 255, ${this.antsOpacity})`;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
    }

    // solid line
    const currentX = this.a.x + ((this.b.x - this.a.x) * this.lineProgress);
    const currentY = this.a.y + ((this.b.y - this.a.y) * this.lineProgress);

    ctx.beginPath();
    ctx.moveTo(this.a.x, this.a.y);
    ctx.lineTo(currentX, currentY);
    ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
    ctx.lineWidth = 3;
    ctx.closePath();
    ctx.stroke();
  }
}

module.exports = Segment;