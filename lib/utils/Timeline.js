const RuneEvent = require('../events/RuneEvent');
const FadeEvent = require('../events/FadeEvent');
const EyeEvent = require('../events/EyeEvent');
const VignetteEvent = require('../events/VignetteEvent');
const BloomEvent = require('../events/BloomEvent');
const BlurEvent = require('../events/BlurEvent');


class Timeline {
  constructor(experience) {
    this.experience = experience;

    this.events = [
      new FadeEvent({
        id: 'fade-in--0',
        time: 1,
        duration: 4,
        intensity: 0,
        experience: this.experience,
      }),
      new RuneEvent({
        id: 'rune--0', // tutorial
        time: 9,
        rune: 'lightning',
        duration: 150,
        tutorial: true,
        experience: this.experience,
      }),
      new RuneEvent({
        id: 'rune--1',
        time: 21.5,
        rune: 'eye',
        duration: 7,
        experience: this.experience,
      }),
      new FadeEvent({
        id: 'blackout',
        time: 31.5,
        duration: 0.1,
        intensity: 1,
        experience: this.experience,
      }),
      new RuneEvent({
        id: 'rune--2',
        time: 32.3,
        rune: 'time',
        duration: 7,
        experience: this.experience,
      }),
      new FadeEvent({
        id: 'slow-fade-in',
        time: 35,
        duration: 2,
        intensity: 0,
        experience: this.experience,
      }),
      new EyeEvent({
        id: 'eye--1',
        action: 'close',
        duration: 0.2,
        time: 56,
        experience: this.experience,
      }),
      new VignetteEvent({
        id: 'vignette--1',
        time: 57,
        duration: 0,
        intensity: 1,
        experience: this.experience,
      }),
      new BloomEvent({
        id: 'bloom--1',
        time: 58,
        duration: 0.8,
        intensity: 0.6,
        experience: this.experience,
      }),
      new EyeEvent({
        id: 'eye--2',
        action: 'open',
        duration: 0.8,
        time: 58,
        experience: this.experience,
      }),
      new BloomEvent({
        id: 'bloom--1',
        time: 68.5,
        duration: 3,
        intensity: 0,
        experience: this.experience,
      }),
      new RuneEvent({
        id: 'rune--3',
        time: 69.5,
        rune: 'lands',
        duration: 10,
        experience: this.experience,
      }),
      new VignetteEvent({
        id: 'vignette--2',
        time: 70,
        duration: 2,
        intensity: 0,
        experience: this.experience,
      }),
      new BlurEvent({
        id: 'blur--1',
        time: 80,
        duration: 0.7,
        blurIntensity: 3,
        experience: this.experience,
      }),
      new EyeEvent({
        id: 'eye--3',
        action: 'close',
        duration: 0.2,
        time: 84.5,
        experience: this.experience,
      }),
      new BlurEvent({
        id: 'blur--1',
        time: 86,
        duration: 0.4,
        blurIntensity: 0,
        experience: this.experience,
      }),
      new RuneEvent({
        id: 'rune--4',
        time: 87,
        rune: 'shield',
        duration: 10,
        experience: this.experience,
      }),
      new EyeEvent({
        id: 'eye--4',
        action: 'open',
        duration: 0.4,
        time: 89,
        experience: this.experience,
      }),
      new RuneEvent({
        id: 'rune--5',
        time: 115.3,
        rune: 'arrow',
        duration: 10,
        experience: this.experience,
      }),
      new FadeEvent({
        id: 'flash-1',
        time: 117,
        color: new THREE.Vector3(1.0, 1.0, 1.0),
        duration: 0.1,
        intensity: 1,
        experience: this.experience,
      }),
      new FadeEvent({
        id: 'flash-1-gone',
        time: 117.5,
        color: new THREE.Vector3(1.0, 1.0, 1.0),
        duration: 2,
        intensity: 0,
        experience: this.experience,
      }),
      new RuneEvent({
        id: 'rune--6',
        time: 128,
        rune: 'crown',
        duration: 12,
        experience: this.experience,
      }),
      new RuneEvent({
        id: 'rune--7',
        time: 144,
        rune: 'rok',
        duration: 12,
        experience: this.experience,
      }),
    ];
  }

  restart() {
    this.events.forEach(e => {
      if (e.type !== 'tutorial') {
        e.isRunning = false;
        e.isEnded = false;
      }
    });
  }

  getActiveEvents(t) {
    return this.events.filter(e => (e.time <= t && !e.isEnded));
  }
}


module.exports = Timeline;