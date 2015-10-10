(function() {

  var SPIN_RATE = 0.3;

  var requestAnimationFrame = window.requestAnimationFrame || function(cb) {
    return setTimeout(function() {
      cb(new Date().getTime());
    }, 1000/60);
  };

  var cancelAnimationFrame = window.cancelAnimationFrame || clearTimeout;

  // TimesListLoader presents the user with a loading animation at the end of
  // their times list. It also presents a reload button if the load fails.
  //
  // This emits the following events:
  // - reload: the user wants to try loading more solves again.
  function TimesListLoader() {
    window.app.EventEmitter.call(this);

    this._$element = $('<div class="times-list-loader"></div>').css({
      display: 'none'
    });
    this._$reloadButton = $(RELOAD_BUTTON_SVG).addClass('times-list-reload');
    this._$spinner = $(SPINNER_SVG).addClass('times-list-spinner')
    this._$element.append(this._$reloadButton, this._$spinner);

    this._$reloadButton.click(this.emit.bind(this, 'reload'));

    this._startTime = null;
    this._state = TimesListLoader.STATE_HIDDEN;
    this._frameRequest = null;
  }

  TimesListLoader.prototype = Object.create(window.app.EventEmitter.prototype);

  TimesListLoader.STATE_HIDDEN = 0;
  TimesListLoader.STATE_LOADING = 1;
  TimesListLoader.STATE_MANUAL_RELOAD = 2;

  TimesListLoader.prototype.element = function() {
    return this._$element;
  };

  TimesListLoader.prototype.switchState = function(newState) {
    if (newState === this._state) {
      return;
    }

    if (this._frameRequest !== null) {
      cancelAnimationFrame(this._frameRequest);
      this._frameRequest = null;
    }

    switch (newState) {
    case TimesListLoader.STATE_HIDDEN:
      this._$element.css({display: 'none'});
      break;
    case TimesListLoader.STATE_LOADING:
      this._$element.css({display: 'block'});
      this._$reloadButton.css({display: 'none'});
      this._$spinner.css({display: 'block'});
      this._startSpinning();
      break;
    case TimesListLoader.STATE_MANUAL_RELOAD:
      this._$element.css({display: 'block'});
      this._$reloadButton.css({display: 'block'});
      this._$spinner.css({display: 'none'});
      break;
    }

    this._state = newState;
  };

  TimesListLoader.prototype._animationFrame = function(time) {
    this._frameRequest = requestAnimationFrame(this._animationFrame.bind(this));

    if (this._startTime === null) {
      this._startTime = time;
      return;
    }

    var angle = (time - this._startTime) * SPIN_RATE;
    this._setSpinnerAngle(angle % 360);
  };

  TimesListLoader.prototype._setSpinnerAngle = function(angle) {
    var transform = 'rotate(' + angle.toFixed(2) + 'deg)';
    this._$spinner.css({
      transform: transform,
      webkitTransform: transform,
      MozTransform: transform,
      msTransform: transform
    });
  };

  TimesListLoader.prototype._startSpinning = function() {
    this._setSpinnerAngle(0);
    this._startTime = null;
    this._frameRequest = requestAnimationFrame(this._animationFrame.bind(this));
  };

  var RELOAD_BUTTON_SVG = '<svg viewBox="12 12 26 26" version="1.1" ' +
    'class="flavor-text times-list-reload">' +
    '<path d="M33.660254038,30 a10,10 0 1 1 0,-10' +
    'm-7.372666366,0 l7.372666366,0 l0,-7.372666366" ' +
    'stroke="currentColor" fill="none" stroke-width="2" />' +
    '</svg>';

  var SPINNER_SVG = '<svg viewBox="0 0 1 1" version="1.1" '+
    'class="flavor-text times-list-spinner">' +
    '<g fill="currentColor"><rect fill="inherit" x="0.000000" y="0.000000" ' +
    'width="0.306931" height="0.306931" /><rect fill="inherit" x="0.000000" ' +
    'y="0.346535" width="0.306931" height="0.306931" /><rect fill="inherit" ' +
    'x="0.000000" y="0.693069" width="0.306931" height="0.306931" />' +
    '<rect fill="inherit" x="0.346535" y="0.000000" width="0.306931" ' +
    'height="0.306931" /><rect fill="inherit" x="0.346535" y="0.346535" ' +
    'width="0.306931" height="0.306931" /><rect fill="inherit" x="0.346535" ' +
    'y="0.693069" width="0.306931" height="0.306931" /><rect fill="inherit" ' +
    'x="0.693069" y="0.000000" width="0.306931" height="0.306931" />' +
    '<rect fill="inherit" x="0.693069" y="0.346535" width="0.306931" ' +
    'height="0.306931" /><rect fill="inherit" x="0.693069" y="0.693069" ' +
    'width="0.306931" height="0.306931" /></g></svg>';

  window.app.TimesListLoader = TimesListLoader;

})();
