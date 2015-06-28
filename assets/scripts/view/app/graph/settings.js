(function() {

  function GraphSettings() {
    window.app.EventEmitter.call(this);
    new window.app.GraphStandardViewMode().on('change', function(type) {
      this.emit('settingChanged', 'graphStandardType', type);
    }.bind(this));
    new window.app.GraphModeDropdown().on('change', function(mode) {
      this.emit('settingChanged', 'graphMode', mode);
    }.bind(this));
  }

  GraphSettings.prototype = Object.create(window.app.EventEmitter.prototype);

  window.app.GraphSettings = GraphSettings;

})();
