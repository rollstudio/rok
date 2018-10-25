const quartIn = require('eases/quart-in');
const quartOut = require('eases/quart-out');


class SideTexts {
  constructor() {
    this.startTime = null;
    this.opacity = 0;

    this.collectedRunes = null;
    this.runesCount = null;
    this.runeName = null;

    this.isSlidingIn = false;
    this.slideInDuration = 1;
    this.slideInEase = quartOut;

    this.isSlidingOut = false;
    this.slideOutDuration = 0.75;
    this.slideOutEase = quartIn;
  }

  slideIn({collectedRunes, runesCount, runeName, isTutorial}) {
    this.collectedRunes = collectedRunes;
    this.runesCount = runesCount;
    this.runeName = runeName;
    this.isTutorial = isTutorial;

    this.isSlidingOut = false;
    this.isSlidingIn = true;
    this.startTime = null;
  }
  slideOut() {
    this.isSlidingOut = true;
    this.isSlidingIn = false;
    this.startTime = null;
  }
  update(time) {
    if (this.isSlidingIn) {
      if (!this.startTime) {
        this.startTime = time;
      }

      const deltaTime = time - this.startTime;
      const progress = this.slideInEase(Math.min(deltaTime / this.slideInDuration, 1));

      this.opacity = progress;
      this.xShift = (1 - progress) * 128;

      if (progress === 1) {
        this.isSlidingIn = false;
      }
    } else if (this.isSlidingOut) {
      if (!this.startTime) {
        this.startTime = time;
      }

      const deltaTime = time - this.startTime;
      const progress = this.slideOutEase(Math.min(deltaTime / this.slideInDuration, 1));

      this.opacity = 1 - progress;
      this.xShift = progress * 128;

      if (progress === 1) {
        this.isSlidingOut = false;
        this.collectedRunes = null;
        this.runesCount = null;
        this.runeName = null;
      }
    }
  }
  draw(ctx) {
    // draw counter text
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;

    if (this.isTutorial) {
      ctx.font = '300 37px Teko, sans-serif';
      // left side
      if (this.collectedRunes !== null && this.runesCount !== null && this.runeName !== null) {
        ctx.textAlign = 'right';
        ctx.fillText(`${this.collectedRunes}/${this.runesCount}`, 256 - 24 + this.xShift, 256 + 12 - 30);
        ctx.textAlign = 'right';
        ctx.fillText(this.runeName.toUpperCase(), 256 - 24 + this.xShift, 256 + 12 + 30);
        ctx.clearRect(256 - 16, 0, 256, 512);
      }
      // right side
      ctx.textAlign = 'left';
      ctx.fillText("DRAG TO CAST THE RUNE", 768 + 24 - this.xShift, 256 + 12 + 30);
      ctx.clearRect(256 - 16, 0, 256, 512);

    } else {
      ctx.font = '300 51px Teko, sans-serif';
      if (this.collectedRunes !== null && this.runesCount !== null) {
        ctx.textAlign = 'right';
        ctx.fillText(`${this.collectedRunes}/${this.runesCount}`, 256 - 32 + this.xShift, 256 + 12);

        ctx.clearRect(256 - 16, 0, 256, 512);
      }

      if (this.runeName !== null) {
        ctx.textAlign = 'left';
        ctx.fillText(this.runeName.toUpperCase(), 768 + 32 - this.xShift, 256 + 12);

        ctx.clearRect(512, 0, 256 + 16, 512);
      }
    }
  }
}

module.exports = SideTexts;