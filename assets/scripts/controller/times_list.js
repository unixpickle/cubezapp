(function() {

  function TimesListController(view) {
    this._view = view;
    var events = ['delete', 'viewScramble', 'addComment', 'removePenalty',
      'plus2', 'dnf'];
    for (var i = 0, len = events.length; i < len; ++i) {
      var event = events[i];
      view.on(event, this['_' + event]);
    }
  }

  TimesListController.prototype._addComment = function(solve) {
    var popup = new window.app.CommentPopup(solve);
    popup.on('save', function(msg) {
      window.app.store.modifySolve(solve.id, {notes: msg});
    }.bind(this));
    popup.show();
  };

  TimesListController.prototype._delete = function(solve) {
    window.app.store.deleteSolve(solve.id);
  };

  TimesListController.prototype._dnf = function(solve) {
    window.app.store.modifySolve(solve.id, {plus2: false, dnf: true});
  };

  TimesListController.prototype._plus2 = function(solve) {
    window.app.store.modifySolve(solve.id, {plus2: true, dnf: false});
  };

  TimesListController.prototype._removePenalty = function(solve) {
    window.app.store.modifySolve(solve.id, {plus2: false, dnf: false});
  };

  TimesListController.prototype._viewScramble = function(solve) {
    new window.app.ScramblePopup(solve).show();
  };

  window.app.TimesListController = TimesListController;

})();
