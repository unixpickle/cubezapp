(function() {

  // Title automatically updates the title to include the puzzle name and the
  // latest time.
  function Title() {
    this._update();
    this._registerModelEvents();
  }

  Title.prototype._generateTitle = function() {
    var puzzleName = window.app.store.getActivePuzzle().name;
    var solve = window.app.store.getLatestSolve();
    if (solve === null) {
      return puzzleName;
    }

    var solveStr;
    if (solve.dnf) {
      solveStr = 'DNF';
    } else {
      var time = window.app.solveTime(solve);
      solveStr = window.app.formatTime(time);
      if (solve.plus2) {
        solveStr += '+';
      }
    }

    return puzzleName + ' - ' + solveStr;
  };

  Title.prototype._registerModelEvents = function() {
    window.app.observe.latestSolve(['time', 'dnf', 'plus2'],
      this._update.bind(this));
    window.app.observe.activePuzzle('name', this._update.bind(this));
  };

  Title.prototype._update = function() {
    document.title = this._generateTitle();
  };

  window.app.Title = Title;

})();
