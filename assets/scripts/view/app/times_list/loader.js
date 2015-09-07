(function() {

  function TimesListLoader() {
    this._$element = $('<div class="times-list-loader"></div>');
    this._$reloadButton = $(RELOAD_BUTTON_SVG).addClass('times-list-reload');
    this._$spinner = $(SPINNER_SVG).addClass('times-list-spinner')
    this._$element.append(this._$reloadButton, this._$spinner);
  }

  TimesListLoader.prototype.element = function() {
    return this._$element;
  };

  var RELOAD_BUTTON_SVG = '<svg viewBox="12 12 26 26" version="1.1" ' +
    'class="flavor-text">' +
    '<path d="M33.660254038,30 a10,10 0 1 1 0,-10'
    'm-7.372666366,0 l7.372666366,0 l0,-7.372666366" ' +
    'stroke="currentColor" fill="none" stroke-width="2" />' +
    '</svg>';

  var SPINNER_SVG = '<svg viewBox="0 0 1 1" class="flavor-text">' +
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

})();
