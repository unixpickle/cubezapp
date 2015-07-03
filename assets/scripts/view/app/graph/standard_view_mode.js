(function() {

  var UNSELECTED_COLOR = '#c1c1c1';

  function GraphStandardViewMode() {
    window.app.EventEmitter.call(this);

    this._currentMode = -1;

    this._colorables = [];
    for (var i = 0; i < 3; ++i) {
      this._colorables[i] =
        document.getElementById('graph-standard-view-mode-color-' + i);
    }

    this._registerEvents();
    this._updateFromModel();
  }

  GraphStandardViewMode.prototype =
    Object.create(window.app.EventEmitter.prototype);

  GraphStandardViewMode.prototype._registerEvents = function() {
    for (var i = 0; i < 3; ++i) {
      $('#graph-standard-view-mode-' + i).click(this.emit.bind(this, 'change',
        i));
    }
    window.app.observe.activePuzzle('graphStandardType',
      this._updateFromModel.bind(this));
    window.app.viewEvents.on('flavor.color', function() {
      this._setCurrentMode(this._currentMode);
    }.bind(this));
  };

  GraphStandardViewMode.prototype._setCurrentMode = function(index) {
    this._currentMode = index;
    for (var i = 0; i < 3; ++i) {
      if (i === index) {
        this._colorables[i].setAttribute('color',
          window.app.flavors.getLastEmittedColor());
      } else {
        this._colorables[i].setAttribute('color', UNSELECTED_COLOR);
      }
    }
  };

  GraphStandardViewMode.prototype._updateFromModel = function() {
    this._setCurrentMode(
      window.app.store.getActivePuzzle().graphStandardType
    );
  };

  window.app.GraphStandardViewMode = GraphStandardViewMode;

})();
