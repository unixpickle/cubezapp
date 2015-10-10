(function() {

  function TimesListController(view) {
    this._view = view;
    var events = ['delete', 'viewScramble', 'removePenalty',
      'plus2', 'dnf', 'moveTo'];
    for (var i = 0, len = events.length; i < len; ++i) {
      var event = events[i];
      view.on(event, this['_' + event]);
    }
  }

  TimesListController.prototype._delete = function(address) {
    address.cursor.deleteSolve(address.index);
  };

  TimesListController.prototype._dnf = function(address) {
    address.cursor.modifySolve(address.index, {plus2: false, dnf: true});
  };

  TimesListController.prototype._plus2 = function(address) {
    address.cursor.modifySolve(address.index, {plus2: true, dnf: false});
  };

  TimesListController.prototype._removePenalty = function(address) {
    address.cursor.modifySolve(address.index, {plus2: false, dnf: false});
  };

  TimesListController.prototype._viewScramble = function(address) {
    var solve = address.cursor.getSolve(address.index);
    new window.app.ScramblePopup(solve).show();
  };

  window.app.TimesListController = TimesListController;

})();
