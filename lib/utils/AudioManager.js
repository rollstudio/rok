'use strict';

var context;

var AudioContext = {
  getContext: function () {
    if ( context === undefined ) {
      context = new ( window.AudioContext || window.webkitAudioContext )();
    }
    return context;
  },
  setContext: function ( value ) {
    context = value;
  }
};

function AudioManager (app, id, isPositional, owner, loop) {
  this.playOnEnterVR = true;
  this.videoTime = 0;
  this.timeDiff = 0;

  this.id = id;
  this.app = app;
  this.owner = owner;
  this.loop = loop;

  this.finished = false;
  this.isInitialized = false;

  this.isPositional = isPositional;
  this.trackAtPauseIsplaying = false;

  var self = this;

  var loader = new THREE.FileLoader( THREE.DefaultLoadingManager );
  loader.setResponseType('arraybuffer');
  loader.load('audio/' + this.id, function (buffer) {
    self.arrayBuffer = buffer;

    self.app.emitter.emit('audioLoaded');
  });
}

AudioManager.prototype.init = function () {
  if (this.isInitialized) {
    return false;
  }

  this.isInitialized = true;

  if (this.isPositional) {
    this.sound = new THREE.PositionalAudio(this.app.listener);
  } else {
    this.sound = new THREE.Audio(this.app.listener);
  }

  var self = this;

  console.log(`${this.id} is initializing`);

  var context = AudioContext.getContext();

  context.decodeAudioData(this.arrayBuffer, function (audioBuffer) {

    self.buffer = audioBuffer;

    self.sound.setBuffer(self.buffer);

    console.log(`${self.id} is initialized`);

    if (self.loop) {
      self.sound.setLoop(true);
    }

    // A reference distance for reducing volume as source move further from the listener.
    // TODO Ad-hoc code for The Composer
    if (self.isPositional) {
      // TODO - 19 METERS distance customized for ROK unit9 experience
      self.sound.setRefDistance(19);
    }

    // NOTE: volume tuning
    if (self.id === 'noise.wav') {
      self.sound.setVolume(0.6);
    }

    self.app.emitter.on('exitVR', self.exitVR.bind(self));
    self.app.emitter.on('preplay', self.preplay.bind(self));

    if (self.id === 'voiceover') {
      self.app.emitter.on('stopAudio', self.stopAudio.bind(self));
    }

    self.app.emitter.emit('audioSoundLoaded');
  });

  this.owner.add(this.sound);
}

// AudioManager.prototype.makeDistortion = function (name, bool, amount){
//   if (this.id === name) {
//       if (bool === true) {
//         this.amountDist += 1;
//       } else if (bool === false) {
//         this.amountDist = 0;
//       } else if (amount >= 0) {
//         this.amountDist = amount;
//       }
//       this.distortion.curve = this.makeDistortionCurve(this.amountDist);
//   }
// }

AudioManager.prototype.setVolume = function (i) {
  this.maxVolume = i;
  this.sound.setVolume(i);
};

AudioManager.prototype.setRefDistance = function (i) {
  this.sound.setRefDistance(i);
};

AudioManager.prototype.getVolume = function () {
  return this.sound.getVolume();
};

AudioManager.prototype.preplay = function() {
  if (!this.preplayed && this.sound) {
    if (!this.sound.isPlaying) {
      this.sound.play();
      this.sound.stop();
      this.sound.startTime = this.sound.context.currentTime;
    }
    this.preplayed = true;
  }
}
AudioManager.prototype.stopAudio = function (withGain){
  this.playOnEnterVR = false;

  if (this.sound.isPlaying) {
    if (withGain) {
      const pausingOldPlayTime = this.getCurrentTime();
      this.sound.gain.gain.cancelScheduledValues(this.sound.context.currentTime);
      this.sound.gain.gain.setValueAtTime(this.sound.gain.gain.value, this.sound.context.currentTime);
      this.sound.gain.gain.linearRampToValueAtTime(0.0, this.sound.context.currentTime + 0.3);
      setTimeout(() => {
        this.sound.pause();
        this.sound.offset -= this.getCurrentTime() - pausingOldPlayTime;
      }, 300);
    } else {
      this.sound.pause();
    }
  }
}

AudioManager.prototype.restart = function() {
  this.sound.stop();

  setTimeout(() => {
    // start time is set by play()
    this.sound.play();
  }, 100);
}

AudioManager.prototype.exitVR = function () {
  // CHECK: Is this obsolete?
  if (this.sound.isPlaying) {
    this.sound.stop();
    this.sound.startTime = this.sound.context.currentTime;
  }
}

AudioManager.prototype.getCurrentTime = function () {
  if (this.sound.buffer) {
    if(this.sound.isPlaying){
      return (this.sound.offset + (this.sound.context.currentTime - this.sound.startTime));
    }else{
      return this.sound.offset;
    }
  } else {
    return 0;
  }
};

AudioManager.prototype.play = function (withGain) {
  if (this.sound.isPlaying) {
    // If the sound is already in play stop it
    this.sound.stop(); // CHECK: Where is this needed?
  } else {
    if (this.sound.buffer) {
      if (withGain) {
        this.sound.gain.gain.cancelScheduledValues(this.sound.context.currentTime);
        this.sound.gain.gain.setValueAtTime(0.0, this.sound.context.currentTime);
        this.sound.gain.gain.linearRampToValueAtTime(this.maxVolume || 1.0, this.sound.context.currentTime + 0.3);
      } else {
        this.sound.gain.gain.setValueAtTime(this.maxVolume || 1.0, this.sound.context.currentTime);
      }

      this.sound.play();
    }
  }
};

// AudioManager.prototype.pauseAll = function (bool) {
//   console.log('---');
//   if (bool) {
//     this.trackAtPauseIsplaying = this.sound.isPlaying;
//     if (this.sound.isPlaying) {
//       this.sound.pause();
//     }
//   } else {
//     if (this.trackAtPauseIsplaying) {
//       this.sound.play();
//     }
//   }
// };

// AudioManager.prototype.makeDistortionCurve = function (amount){
//     var k = typeof amount === 'number' ? amount : 50,
//       n_samples = 44100,
//       curve = new Float32Array(n_samples),
//       deg = Math.PI / 180,
//       i = 0,
//       x;
//     for ( ; i < n_samples; ++i ) {
//       x = i * 2 / n_samples - 1;
//       curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
//     }
//     return curve;
// }

AudioManager.prototype.update = function (delta, time) {
  if (this.id !== 'noise.wav' && this.sound && this.sound.buffer) {
    if(this.getCurrentTime()+0.5 >= this.sound.buffer.duration){
      this.sound.stop();
      this.finished = true;
      return;
    }
  }
};

module.exports = AudioManager;
