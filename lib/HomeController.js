'use strict';

const webvrui = require('webvr-ui');

const defaults = require('lodash.defaults');

const screenfull = require('screenfull');

const isMobile = require('ismobilejs');

const defaultParams = {
}

let enterVRBtn;

function HUD (app,params) {
  params = defaults(params, defaultParams);

  // Initialize the WebVR UI.
  var uiOptions = {
    color: 'white',
    background: '#bbbbbb',
    corners: 'square',
    disabledOpacity: 0.25
  };

  enterVRBtn = document.getElementById('vr-button')
  enterVRBtn.addEventListener('click', buttonVRClicked);

  var self = this;

  this.vrButton = new webvrui.EnterVRButton(app.renderer.domElement, uiOptions)
    .on("enter", function(){
        // console.log("enter VR");
        app.emitter.emit('enterVR',true);
        document.getElementById('webgl-content').style.display = 'block';
    })
    .on("exit", function(){
        // console.log("exit VR");
        app.emitter.emit('exitVR',true);
        document.getElementById('webgl-content').style.display = 'none';
    })
    .on("error", function(error){
        // console.log(error)
    })
    .on("hide", function(){
        document.getElementById("ui").style.display = "none";
        // On iOS there is no button to close fullscreen mode, so we need to provide one
        if(self.vrButton.state == webvrui.State.PRESENTING_FULLSCREEN) document.getElementById("exit").style.display = "initial";
    })
    .on("show", function(){
        document.getElementById("ui").style.display = "inherit";
        document.getElementById("exit").style.display = "none";
    });

  document.getElementById('magic-window').addEventListener('click', function() {
    if (screenfull.enabled) {
      screenfull.request(app.renderer.domElement);
      // app.scene.children[3].children[0].video.play();
    } else {
      // iOS
      // webvrui.state  = webvrui.State.PRESENTING_FULLSCREEN;
      self.vrButton.requestEnterFullscreen();
      // app.scene.children[3].children[0].video.play();
    }
  });

  document.getElementById('exit').addEventListener('click', function() {
      self.vrButton.requestExit();
  });

  function dismissShare() {
    document.getElementById('share').classList.remove('share--active');
    window.removeEventListener('click', dismissShare);
    document.getElementById('share-fb').removeEventListener('click', shareViaFacebook);
    document.getElementById('share-tw').removeEventListener('click', shareViaTwitter);
  }
  function shareViaFacebook() {
    console.log('share with facebook');

    const shortUrl = encodeURIComponent('https://rok-vr.com');
    const url = `https://www.facebook.com/sharer/sharer.php?u=${shortUrl}`;
    const opts = `status=1,width=575,height=400,top=${(window.clientHeight - 400) / 2},left=${(window.clientWidth - 575) / 2}`;

    window.open(url, 'Facebook', opts);

    dismissShare();
  }
  function shareViaTwitter() {
    console.log('share with twitter');

    const text = encodeURIComponent('https://rok-vr.com');
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    const opts = `status=1,width=575,height=400,top=${(window.clientHeight - 400) / 2},left=${(window.clientWidth - 575) / 2}`;

    window.open(url, 'Twitter', opts);

    dismissShare();
  }

  document.querySelector('.share-label').addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();

    document.getElementById('share').classList.add('share--active');
    window.addEventListener('click', dismissShare);
    document.getElementById('share-fb').addEventListener('click', shareViaFacebook);
    document.getElementById('share-tw').addEventListener('click', shareViaTwitter);
  });

  document.getElementById('credits').addEventListener('click', function() {
    document.getElementById('settings').classList.add('show');
    document.body.classList.add('credits-visible');
  });

  document.getElementById('closeButton').addEventListener('click', function() {
    document.getElementById('settings').classList.add('faded');
    document.body.classList.remove('credits-visible');
    setTimeout(function(){
      document.getElementById('settings').classList.remove('show');
      document.getElementById('settings').classList.remove('faded');
    }, 1000);
  });

  document.getElementById("vr-button").appendChild(this.vrButton.domElement);

  function buttonVRClicked(event) {
    if (isMobile.any) {
      app.emitter.emit('preplay');
    }
  }
}

HUD.prototype = Object.create(Object.prototype);

module.exports = HUD;
