var registerComponent = require('../../core/component').registerComponent;
var utils = require('../../utils/');

var ENTER_VR_CLASS = 'a-enter-vr';
var ENTER_VR_BTN_CLASS = 'a-enter-vr-button';
var HIDDEN_CLASS = 'a-hidden';
var ORIENTATION_MODAL_CLASS = 'a-orientation-modal';

var checkHeadsetConnected = utils.checkHeadsetConnected;
var isMobile = utils.isMobile();

/**
 * UI for entering VR mode.
 */
module.exports.Component = registerComponent('vr-mode-ui', {
  dependencies: ['canvas'],

  schema: {
    enabled: {default: true}
  },

  init: function () {
    var self = this;
    var sceneEl = this.el;

    if (utils.getUrlParameter('ui') === 'false') { return; }

    this.enterVR = sceneEl.enterVR.bind(sceneEl);
    this.exitVR = sceneEl.exitVR.bind(sceneEl);
    this.insideLoader = false;
    this.enterVREl = null;
    this.orientationModalEl = null;

    // Hide/show VR UI when entering/exiting VR mode.
    sceneEl.addEventListener('enter-vr', this.updateEnterVRInterface.bind(this));
    sceneEl.addEventListener('exit-vr', this.updateEnterVRInterface.bind(this));

    window.addEventListener('message', function (event) {
      if (event.data.type === 'loaderReady') {
        self.insideLoader = true;
        self.remove();
      }
    });

    // Modal that tells the user to change orientation if in portrait.
    window.addEventListener('orientationchange', this.toggleOrientationModalIfNeeded.bind(this));
  },

  update: function () {
    var sceneEl = this.el;

    if (!this.data.enabled || this.insideLoader || utils.getUrlParameter('ui') === 'false') {
      return this.remove();
    }
    if (this.enterVREl || this.orientationModalEl) { return; }

    // Add UI if enabled and not already present.
    this.enterVREl = createEnterVRButton(this.enterVR);
    sceneEl.appendChild(this.enterVREl);

    this.orientationModalEl = createOrientationModal(this.exitVR);
    sceneEl.appendChild(this.orientationModalEl);

    this.updateEnterVRInterface();
  },

  remove: function () {
    [this.enterVREl, this.orientationModalEl].forEach(function (uiElement) {
      if (uiElement) {
        uiElement.parentNode.removeChild(uiElement);
      }
    });
  },

  updateEnterVRInterface: function () {
    this.toggleEnterVRButtonIfNeeded();
    this.toggleOrientationModalIfNeeded();
  },

  toggleEnterVRButtonIfNeeded: function () {
    var sceneEl = this.el;
    if (!this.enterVREl) { return; }
    if (sceneEl.is('vr-mode')) {
      this.enterVREl.classList.add(HIDDEN_CLASS);
    } else {
      this.enterVREl.classList.remove(HIDDEN_CLASS);
    }
  },

  toggleOrientationModalIfNeeded: function () {
    var sceneEl = this.el;
    var orientationModalEl = this.orientationModalEl;
    if (!orientationModalEl || !sceneEl.isMobile) { return; }
    if (!utils.isLandscape() && sceneEl.is('vr-mode')) {
      // Show if in VR mode on portrait.
      orientationModalEl.classList.remove(HIDDEN_CLASS);
    } else {
      orientationModalEl.classList.add(HIDDEN_CLASS);
    }
  }
});

/**
 * Creates a button that when clicked will enter into stereo-rendering mode for VR.
 *
 * Structure: <div><button></div>
 *
 * @returns {Element} Wrapper <div>.
 */
function createEnterVRButton (enterVRHandler) {
  var vrButton;
  var wrapper;
  var VRAvailable = window.hasNativeWebVRImplementation && checkHeadsetConnected();

  // Create elements.
  wrapper = document.createElement('div');
  wrapper.classList.add(ENTER_VR_CLASS);
  vrButton = document.createElement('button');
  vrButton.classList.add(ENTER_VR_BTN_CLASS);
  if (!isMobile && !VRAvailable) { vrButton.classList.add('fullscreen'); }

  // Insert elements.
  wrapper.appendChild(vrButton);
  vrButton.addEventListener('click', enterVRHandler);
  return wrapper;
}

/**
 * Create a modal that tells mobile users to orient the phone to landscape.
 * Add a close button that if clicked, exits VR and closes the modal.
 */
function createOrientationModal (exitVRHandler) {
  var modal = document.createElement('div');
  modal.className = ORIENTATION_MODAL_CLASS;
  modal.classList.add(HIDDEN_CLASS);

  var exit = document.createElement('button');
  exit.innerHTML = 'Exit VR';

  // Exit VR on close.
  exit.addEventListener('click', exitVRHandler);

  modal.appendChild(exit);

  return modal;
}
