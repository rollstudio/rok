class Eye extends (THREE.Group) {
  constructor() {
    super();

    const eyeLidMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    // const eyeLidMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    eyeLidMaterial.side = THREE.DoubleSide;

    this.eyeLidRadius = 9;
    this.eyeLidHeight = 9;

    this.aperture = 1;
    this.transitionApertureVariation = null;
    this.transitionStartTime = null;
    this.transitionDuration = null;
    this.upperLidRotation = 0;
    this.lowerLidRotation = 0;
    this.lidTranslation = 0;

    const upperEyeLidGeometry = new THREE.SphereGeometry(this.eyeLidRadius, 16, 5, Math.PI, Math.PI, 0, Math.PI / 2);
    upperEyeLidGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2));
    upperEyeLidGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -this.eyeLidHeight / 4));
    this.upperEyeLid = new THREE.Mesh(upperEyeLidGeometry, eyeLidMaterial);
    this.add(this.upperEyeLid);

    const lowerEyeLidGeometry = new THREE.SphereGeometry(this.eyeLidRadius, 16, 5, Math.PI, Math.PI, Math.PI / 2, Math.PI / 2);
    lowerEyeLidGeometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    lowerEyeLidGeometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -this.eyeLidHeight / 4));
    this.lowerEyeLid = new THREE.Mesh(lowerEyeLidGeometry, eyeLidMaterial);
    this.add(this.lowerEyeLid);
  }

  open(duration, callback) {
    this.transitionApertureVariation = 1 - this.aperture;
    this.transitionStartTime = null;
    this.transitionDuration = duration || 0.15;
    this.transitionCallback = callback;
  }
  close(duration, callback) {
    this.transitionApertureVariation = -this.aperture;
    this.transitionStartTime = null;
    this.transitionDuration = duration || 0.075;
    this.transitionCallback = callback;
  }
  blink(callback) {
    this.transitionApertureVariation = -this.aperture;
    this.transitionStartTime = null;
    this.transitionDuration = 0.05;
    this.transitionCallback = callback;
    this.isBlinking = true;
  }

  update(dt, time) {
    if (this.transitionApertureVariation !== null) {
      if (this.transitionStartTime === null) {
        this.transitionStartTime = time;
      }

      const deltaTime = time - this.transitionStartTime;
      const progress = Math.min(deltaTime / this.transitionDuration, 1);
      const currentAperture = (this.aperture + (progress * this.transitionApertureVariation));

      const lidTranslation = (1 - currentAperture) * (this.eyeLidHeight / 4);

      const upperLidRotation = (1 - currentAperture) * (-Math.PI / 2);
      this.upperEyeLid.geometry.applyMatrix(new THREE.Matrix4()
        .makeTranslation(0, 0, lidTranslation - this.lidTranslation));
      this.upperEyeLid.applyMatrix(new THREE.Matrix4().makeRotationX(upperLidRotation - this.upperLidRotation));

      const lowerLidRotation = (1 - currentAperture) * (Math.PI / 2);
      this.lowerEyeLid.geometry.applyMatrix(new THREE.Matrix4()
        .makeTranslation(0, 0, lidTranslation - this.lidTranslation));
      this.lowerEyeLid.applyMatrix(new THREE.Matrix4().makeRotationX(lowerLidRotation - this.lowerLidRotation));

      this.upperLidRotation = upperLidRotation;
      this.lowerLidRotation = lowerLidRotation;
      this.lidTranslation = lidTranslation;

      if (progress === 1) {
        this.aperture = currentAperture;

        if (this.isBlinking) {
          this.isBlinking = false;

          this.transitionStartTime = null;
          this.transitionApertureVariation = 1;
          this.transitionDuration = 0.1;
        } else {
          this.transitionStartTime = null;
          this.transitionApertureVariation = null;
          this.transitionDuration = null;

          if (this.transitionCallback) {
            this.transitionCallback(time);
          }

          this.transitionCallback = null;
        }
      }
    }
  }
}

module.exports = Eye;