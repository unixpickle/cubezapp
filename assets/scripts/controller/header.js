(function() {

  function HeaderController() {
    this._view = window.app.view.header;
    var events = ['addPuzzle', 'deletePuzzle', 'switchPuzzle'];
    for (var i = 0; i < events.length; ++i) {
      var func = this['_' + events[i]];
      this._view.on(events[i], func);
    }
  }
  
  HeaderController.prototype._addPuzzle = function() {
    
  };
  
  HeaderController.prototype._deletePuzzle = function(id) {
    
  };
  
  HeaderController.prototype._switchPuzzle = function(id) {
    
  };
  
  window.app.HeaderController = HeaderController;

})();