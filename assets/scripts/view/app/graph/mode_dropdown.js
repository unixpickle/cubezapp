(function() {
  
  var FADE_IN_DURATION = 0;
  var FADE_OUT_DURATION = 200;

  function GraphModeDropdown() {
    window.app.EventEmitter.call(this);
    this._$element = $('#graph-mode-dropdown');
    this._$items = $('.graph-mode-dropdown-item');
    this._$label = $('#graph-mode-label');
    
    this._modeNames = [];
    for (var i = 0; i < this._$items.length; ++i) {
      this._modeNames[i] = this._$items.eq(i).text();
    }
    
    this._showing = false;
    this._boundClickThru = this._clickThru.bind(this);
    
    this._updateFromModel();
    this._registerEvents();
  }

  GraphModeDropdown.prototype =
    Object.create(window.app.EventEmitter.prototype);

  GraphModeDropdown.prototype._clickThru = function(e) {
    if (!e.inElement(this._$element[0]) &&
        !e.inElement(this._$label[0])) {
      this._toggle();
    }
  };

  GraphModeDropdown.prototype._registerEvents = function() {
    window.app.observe.activePuzzle('graphMode',
      this._updateFromModel.bind(this));
    this._$label.click(this._toggle.bind(this));
    for (var i = 0; i < this._$items.length; ++i) {
      this._$items.eq(i).click(function(index) {
        this.emit('change', index);
        this._toggle();
      }.bind(this, i));
    }
  };

  GraphModeDropdown.prototype._toggle = function() {
    if (this._showing) {
      this._$element.fadeOut(FADE_OUT_DURATION);
      window.clickthru.removeListener(this._boundClickThru);
    } else {
      this._$element.css({display: 'block', opacity: 1});
      window.clickthru.addListener(this._boundClickThru);
    }
    this._showing = !this._showing;
  };

  GraphModeDropdown.prototype._updateFromModel = function() {
    var index = window.app.store.getActivePuzzle().graphMode;
    for (var i = 0; i < this._modeNames.length; ++i) {
      if (i === index) {
        this._$items.eq(i).addClass('graph-mode-dropdown-item-selected');
      } else {
        this._$items.eq(i).removeClass('graph-mode-dropdown-item-selected');
      }
    }
    this._$label.text(this._modeNames[index]);
  };

  window.app.GraphModeDropdown = GraphModeDropdown;

})();
