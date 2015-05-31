(function() {

  // ViewEvents is used to distribute events between various views.
  function ViewEvents() {
    window.app.EventEmitter.call(this);
  }

  ViewEvents.prototype = Object.create(window.app.EventEmitter.prototype);

  ViewEvents.prototype.emitAppLoad = function() {
    this.emit('app.load');
  };

  ViewEvents.prototype.emitFlavorColor = function(color) {
    this.emit('flavor.color', color);
  };

  ViewEvents.prototype.emitFooterFullyVisible = function() {
    this.emit('footer.fullyVisible');
  };

  ViewEvents.prototype.emitFooterHidden = function() {
    this.emit('footer.hidden');
  };

  ViewEvents.prototype.emitFooterPartlyVisible = function() {
    this.emit('footer.partlyVisible');
  };

  window.app.viewEvents = new ViewEvents();

})();
