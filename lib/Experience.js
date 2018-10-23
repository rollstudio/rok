'use strict';

const defaults = require('lodash.defaults');


const defaultParams = {
}

const RayInputController = require('./controllers/RayInputController');
let rayInputController;

const screenfull = require('screenfull');

const Sky = require('./assets/Sky');
const Crow = require('./assets/Crow');
const Eye = require('./assets/Eye');
const RuneGrid = require('./assets/RuneGrid');
const HUD = require('./HUD/index.js');

let sky;
let /* music,  */voiceover, noise;
let dummy;
let crow;
let eye;
let hud;
let runeGrid;

const AudioManager = require('./utils/AudioManager');

const RuneMaster = require('./utils/RuneMaster');
const Timeline = require('./utils/Timeline');


function Experience (app, params) {
  params = defaults(params, defaultParams);

  THREE.Object3D.call(this);

  this.isAudioConfigured = false;

  sky = new Sky(app, this);
  sky.name = 'sky';
  this.add(sky);
  sky.visible = false;
  this.sky = sky;

  crow = new Crow(app);
  this.add(crow);

  eye = new Eye();
  app.cameraGroup.add(eye);
  this.eye = eye;

  hud = new HUD(app, app.cameraGroup);
  this.hud = hud;

  if(!rayInputController){
    rayInputController = new RayInputController(app);
  }

  this.audioBuffersReady = 0;
  this.audioSoundsReady = 0;
  this.totalAudios = 2;

  voiceover = new AudioManager(app, 'voiceover.mp3',  true, crow.mesh, false);
  noise = new AudioManager(app, 'noise.wav', false, this, true);

  app.emitter.on('enterVR', enterVR.bind(this));
  app.emitter.on('audioLoaded', this.audioBuffersLoaded.bind(this));
  app.emitter.on('audioSoundLoaded', this.audioSoundLoaded.bind(this));
  app.emitter.on('pauseExperience', this.pauseExperience.bind(this));
  app.emitter.on('playExperience', this.playExperience.bind(this));
  app.emitter.on('showTutorial', this.showTutorial.bind(this));
  app.emitter.on('hideTutorial', this.hideTutorial.bind(this));
  app.emitter.on('startRuneInteraction', this.startRuneInteraction.bind(this));
  app.emitter.on('endRuneInteraction', this.endRuneInteraction.bind(this));
  app.emitter.on('restartExperience', this.restartExperience.bind(this));

  this.app = app;
  this.voiceover = voiceover;

  runeGrid = new RuneGrid(app);
  app.cameraGroup.add(runeGrid);
  this.runeGrid = runeGrid;

  this.runeMaster = new RuneMaster(app, sky, voiceover, runeGrid);

  this.timeline = new Timeline(this);
  this.activeEvents = [];
  this.previousInteractionDuration = 0;
  this.isExperienceStopped = true;
  this.playExperienceOnAudioSoundsReady = false;

  function enterVR() {
    sky.endCredits.addToRayController(rayInputController);
    runeGrid.addToRayController(rayInputController);
    hud.addToRayController(rayInputController);

    if (this.playingState) {
      this.playingState = {
        sky: true,
        voiceover: true,
        // music: true,
        noise: true,
      };
    }

    if (!this.isAudioConfigured) {
      this.isAudioConfigured = true;
      this.configureAudio();
    }

    if (this.audioSoundsReady === this.totalAudios) {
      this.playExperience();
    } else {
      this.playExperienceOnAudioSoundsReady = true;
    }
  }

  if (window.isDev) {
    // setup time display
    this.timeDisplay = document.createElement( 'div' );
    this.timeDisplay.setAttribute('id', 'time-display');
    this.timeDisplay.innerText = 'timeDisplay';
    document.body.appendChild(this.timeDisplay);
  }

  // set pause detector
  document.addEventListener('keydown', this.keydownHandler.bind(this));
}

Experience.prototype = Object.create(THREE.Object3D.prototype);

Experience.prototype.configureAudio = function() {
  const listener = new THREE.AudioListener();
  this.app.cameraGroup.add(listener);
  this.app.listener = listener;

  voiceover.init();
  noise.init();
}

Experience.prototype.restartExperience = function() {
  this.isRestarted = true;
  this.restartTime = voiceover.getCurrentTime();

  // restart sky
  sky.restart();
  // restart voiceover
  voiceover.restart();
  // restart music
  // music.restart();

  // restart runemaster
  this.runeMaster.restart();
}

Experience.prototype.pauseExperience = function() {
  console.log('pauseExperience');
  if (this.isPauseDisabled) {
    return false;
  }

  if (this.playExperienceOnAudioSoundsReady) {
    this.playExperienceOnAudioSoundsReady = false;
  }

  if (!this.playingState && !this.isExperienceStopped) {
    // set playing state useful for play restore
    this.playingState = {
      sky: !sky.video.paused,
      voiceover: voiceover.sound.isPlaying,
      // music: music.sound.isPlaying,
    };

    // pause sky video
    sky.pauseVideo();
    // pause voiceover
    voiceover.stopAudio(true);
    // pause music
    // music.stopAudio();

    this.app.emitter.emit('syncVideo');
  }
}
Experience.prototype.playExperience = function() {
  console.log('playExperience');
  if (this.isPauseDisabled) {
    return false;
  }

  if (this.isExperienceStopped) {
    this.playingState = {
      sky: true,
      voiceover: true,
      // music: true,
      noise: true,
    };
  }

  if (this.playingState) {
    if (this.playingState.sky) {
      // play sky video
      sky.startVideo();
    }

    if (this.playingState.voiceover) {
      // play voiceover
      voiceover.play(!this.isExperienceStopped);
    }

    // if (this.playingState.music) {
    //   // play music
    //   music.play();
    // }

    if (this.playingState.noise) {
      // play noise
      noise.play();
    }

    // reset playing state for future pauses
    this.playingState = false;
  }

  if (this.isExperienceStopped) {
    this.isExperienceStopped = false;
  }
}

Experience.prototype.showTutorial = function() {
  this.pauseExperience();

  this.isPauseDisabled = true;
}
Experience.prototype.hideTutorial = function() {
  this.isPauseDisabled = false;

  this.playExperience();
}

Experience.prototype.startRuneInteraction = function() {
  this.isPauseDisabled = true;
}
Experience.prototype.endRuneInteraction = function() {
  this.isPauseDisabled = false;
}

Experience.prototype.keydownHandler = function(e) {
  if (e.which === 32 || e.which === 80) {
    // spacebar or "p" pressed

    if (this.isPauseDisabled) {
      return false;
    }

    if (!this.isPaused) {
      this.isPaused = true;
      this.app.emitter.emit('pauseExperience');
    } else {
      this.isPaused = false;
      this.app.emitter.emit('playExperience');
    }
  }
}

Experience.prototype.audioBuffersLoaded = function () {
  this.audioBuffersReady ++;
  if(this.audioBuffersReady === this.totalAudios){
    document.getElementById('preloading').style.display= 'none';
    document.getElementById('vr-button').style.display= 'block';
    document.getElementById('magic-window').style.display= 'flex';
  }
}
Experience.prototype.audioSoundLoaded = function () {
  this.audioSoundsReady ++;
  if(this.audioSoundsReady === this.totalAudios){
    if (this.playExperienceOnAudioSoundsReady) {
      this.playExperience();
    }
  }
}

Experience.prototype.update = function (dt, t) {
  // if (!this.isAudioConfigured) {
  //   return false;
  // }

  let time = t;

  if (rayInputController && !this.isExperienceStopped) {
    rayInputController.update(dt, time);
  }

  if (this.isRestarted) {
    // clear pause and timeshift on restart
    this.timeShift = time;
    this.pauseTime = null;

    this.isRestarted = false;
  }

  if (this.isPaused) {
    if (!this.pauseTime) {
      this.pauseTime = time;
    }

    return;
  } else if (this.pauseTime) {
    this.timeShift = (this.timeShift || 0) + (time - this.pauseTime);

    this.pauseTime = null;
  }

  time -= (this.timeShift || 0);

  // - "voiceCurrentTime" will be used to check which events are active
  // - the progress of an event will follow "time"
  // - "videoCurrentTime" should be in sync with "voiceCurrentTime"

  const videoCurrentTime = sky.getVideoCurrentTime();
  const voiceCurrentTime = this.isAudioConfigured ? voiceover.getCurrentTime() : 0;

  if (voiceCurrentTime > 0) {
    // the experience is started
    sky.update(dt, time);
    crow.update(dt, time);

    eye.update(dt, time);
    hud.update(dt, time);

    runeGrid.update(dt, time);

    if (this.restartTime > voiceCurrentTime) {
      // restart timeline events on voiceover restarted
      this.timeline.restart();

      this.restartTime = null;
    }

    let timeDisplayText;

    if (window.isDev) {
      timeDisplayText = `video: ${videoCurrentTime.toFixed(2)}s\
  \nvoice: ${voiceCurrentTime.toFixed(2)}s\
  \ntime: ${time.toFixed(2)}s`;
    }

    // get active events if any
    const activeEvents = this.timeline.getActiveEvents(voiceCurrentTime);

    if (activeEvents.length > 0) {
      if (window.isDev) {
        timeDisplayText = '!\n' + timeDisplayText;
      }

      activeEvents.forEach(e => {
        e.update(time);
      });
    }
    if (window.isDev) {
      this.timeDisplay.innerText = timeDisplayText;
    }
  }


  if (voiceover) {
    // music.update(dt,time);
    voiceover.update(dt,time);
    noise.update(dt,time);
  }
}

module.exports = Experience;
