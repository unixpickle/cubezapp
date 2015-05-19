(function() {

  function TimesController(view) {
    this._view = view;
    var events = ['delete', 'viewScramble', 'addComment', 'removePenalty',
      'plus2', 'dnf'];
    for (var i = 0, len = events.length; i < len; ++i) {
      var event = events[i];
      view.on(event, this['_' + event]);
    }
  }
  
  TimesController.prototype._addComment = function(solve) {
    // TODO: this.
    alert('i am very lazy.');
  };
  
  TimesController.prototype._delete = function(solve) {
    window.app.store.deleteSolve(solve.id);
  };
  
  TimesController.prototype._dnf = function(solve) {
    window.app.store.modifySolve(solve.id, {plus2: false, dnf: true});
  };
  
  TimesController.prototype._plus2 = function(solve) {
    window.app.store.modifySolve(solve.id, {plus2: true, dnf: false});
  };
  
  TimesController.prototype._removePenalty = function(solve) {
    window.app.store.modifySolve(solve.id, {plus2: false, dnf: false});
  };
  
  TimesController.prototype._viewScramble = function(solve) {
    console.log(solve);
    alert('Your scramble was: ' + solve.scramble + '. Sorry, I know this ' +
      'popup is hideous and will give you nightmares.');
  };
  
  window.app.TimesController = TimesController;

})();
