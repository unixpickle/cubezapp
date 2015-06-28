(function() {

  function GraphSettings() {
    window.app.EventEmitter.call(this);
    new window.app.GraphStandardViewMode().on('change', function(type) {
      this.emit('settingChanged', 'graphStandardType', type);
    }.bind(this));
    new window.app.GraphModeDropdown().on('change', function(mode) {
      this.emit('settingChanged', 'graphMode', mode);
    }.bind(this));

    this._views = [
      $('#graph-settings-standard'),
      $('#graph-settings-mean'),
      $('#graph-settings-histogram'),
      $('#graph-settings-streak')
    ];

    this._updateFromModel();
    this._registerEvents();
  }

  GraphSettings.prototype = Object.create(window.app.EventEmitter.prototype);

  GraphSettings.prototype._registerEvents = function() {
    window.app.observe.activePuzzle('graphMode',
      this._updateFromModel.bind(this));
  };

  GraphSettings.prototype._updateFromModel = function() {
    var view = window.app.store.getActivePuzzle().graphMode;
    for (var i = 0; i < this._views.length; ++i) {
      if (i === view) {
        this._views[i].css({display: 'block'});
      } else {
        this._views[i].css({display: 'none'});
      }
    }
  };

  window.app.GraphSettings = GraphSettings;

})();
