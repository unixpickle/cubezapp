(function() {

  function TimesController(view) {
    this._view = view;
    var events = ['delete', 'viewScramble', 'addComment'];
    for (var i = 0, len = events.length; i < len; ++i) {
      var event = events[i];
      view.on(event, this['_' + event]);
    }
  }
  
  TimesController.prototype._addComment = function(solve) {
    // TODO: this.
  };
  
  TimesController.prototype._delete = function(solve) {
    window.app.store.deleteSolve(solve.id);
  };
  
  TimesController.prototype._viewScramble = function(solve) {
    // TODO: this.
  };
  
  window.app.TimesController = TimesController;

})();
