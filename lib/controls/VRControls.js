/**
 * @author dmarcos / https://github.com/dmarcos
 * @author mrdoob / http://mrdoob.com
 */

THREE.VRControls = function ( object, emitter, onError ) {

	var scope = this;

	var vrDisplay, vrDisplays;

	var standingMatrix = new THREE.Matrix4();

	var frameData = null;

  this.emitter = emitter;

	if ( 'VRFrameData' in window ) {
		frameData = new VRFrameData();
	}

	function gotVRDisplays( displays ) {

		vrDisplays = displays;

		if ( displays.length > 0 ) {

			vrDisplay = displays[ 0 ];

      if (vrDisplay.displayName === 'Mouse and Keyboard VRDisplay (webvr-polyfill)') {
        // setting this flag we determine if drag to pan view can be disabled
        vrDisplay.isMouseKeyboardVRDisplay = true;
      }

		} else {

			if ( onError ) onError( 'VR input not available.' );

		}

	}

	if ( navigator.getVRDisplays ) {

		navigator.getVRDisplays().then( gotVRDisplays ).catch( function () {

			console.warn( 'THREE.VRControls: Unable to get VR Displays' );

		} );

	}

	// the Rift SDK returns the position in meters
	// this scale factor allows the user to define how meters
	// are converted to scene units.

	this.scale = 1;

	// If true will use "standing space" coordinate system where y=0 is the
	// floor and x=0, z=0 is the center of the room.
	this.standing = false;

	// Distance from the users eyes to the floor in meters. Used when
	// standing=true but the VRDisplay doesn't provide stageParameters.
	this.userHeight = 1.6;

	this.getVRDisplay = function () {

		return vrDisplay;

	};

	this.setVRDisplay = function ( value ) {

		vrDisplay = value;

	};

	this.getVRDisplays = function () {

		console.warn( 'THREE.VRControls: getVRDisplays() is being deprecated.' );
		return vrDisplays;

	};

	this.getStandingMatrix = function () {

		return standingMatrix;

	};

	this.update = function () {

		if ( vrDisplay ) {

			var pose;

      if (vrDisplay.isMouseKeyboardVRDisplay && this.isRuneInteractionActive) {
        /* mouse and keyboard vrDisplay and rune evente active (stop drag) */

        if (!this.cameraOldPhi) {
          this.cameraOldPhi = vrDisplay.phi_;
        }
        if (!this.cameraOldTheta) {
          this.cameraOldTheta = vrDisplay.theta_;
        }

        return;
      }

      if (vrDisplay.isMouseKeyboardVRDisplay && this.resetPose) {
        this.resetPose = false;

        vrDisplay.phi_ = this.cameraOldPhi;
        vrDisplay.theta_ = this.cameraOldTheta;
      }

			if ( vrDisplay.getFrameData ) {
				vrDisplay.getFrameData( frameData );
				pose = frameData.pose;

			} else if ( vrDisplay.getPose ) {

				pose = vrDisplay.getPose();

			}

			if ( pose.orientation !== null ) {
        object.quaternion.fromArray( pose.orientation );
			}

			if ( pose.position !== null ) {

				object.position.fromArray( pose.position );

			} else {

				object.position.set( 0, 0, 0 );

			}

			if ( this.standing ) {

				if ( vrDisplay.stageParameters ) {

					object.updateMatrix();

					standingMatrix.fromArray( vrDisplay.stageParameters.sittingToStandingTransform );
					object.applyMatrix( standingMatrix );

				} else {

					object.position.setY( object.position.y + this.userHeight );

				}

			}

			object.position.multiplyScalar( scope.scale );

		}

	};

	this.dispose = function () {

		vrDisplay = null;

	};

  this.startRuneInteractionHandler = function() {
    this.isRuneInteractionActive = true;

    this.cameraOldPhi = null;
    this.cameraOldTheta = null;
  };
  this.endRuneInteractionHandler = function() {
    this.isRuneInteractionActive = false;
    this.resetPose = true;
  };

  this.emitter.on('startRuneInteraction', this.startRuneInteractionHandler.bind(this));
  this.emitter.on('endRuneInteraction', this.endRuneInteractionHandler.bind(this));

};
