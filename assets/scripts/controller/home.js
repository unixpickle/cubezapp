(function() {
  
  function Home() {
    // Setup the global objects.
    window.app.windowSize = new window.app.WindowSize();
    window.app.store = new window.app.LocalStore();
    window.app.view = new window.app.AppView();
    window.app.timer = new window.app.Timer();
    
    // Setup the current puzzle.
    var puzzles = window.app.store.getPuzzles().slice(1);
    window.app.view.setPuzzles(puzzles);
    window.app.view.setActivePuzzle(window.app.store.getActivePuzzle());
    
    // Make sure that the timer is set to the correct setting for this puzzle.
    this._configureTimer();
  }
  
  // addPuzzle adds a puzzle and switches to it.
  Home.prototype.addPuzzle = function(puzzle) {
    window.app.store.addPuzzle(puzzle);
    window.app.view.setPuzzles(window.app.store.getPuzzles().slice(1));
    window.app.view.setActivePuzzle(window.app.store.getActivePuzzle());
    this._configureTimer();
  };
  
  // deletePuzzle verifies with the user that a puzzle should be deleted, then
  // deletes it.
  Home.prototype.deletePuzzle = function(puzzle) {
  };
  
  // switchPuzzle requests that the store switch puzzles. Once the store has
  // switched, this updates the UI to reflect the change.
  Home.prototype.switchPuzzle = function(puzzle) {
    window.app.store.switchPuzzle(puzzle, function(error) {
      if (error !== null) {
        return;
      }
      window.app.view.setPuzzles(window.app.store.getPuzzles().slice(1));
      window.app.view.setActivePuzzle(window.app.store.getActivePuzzle());
      this._configureTimer();
    }.bind(this));
  };
  
  Home.prototype._configureTimer = function() {
    var timer = window.app.timer;
    timer.onCancel = function() {
      window.app.view.setMemo(null);
      window.app.view.setTime('23.25');
      window.app.view.setTheaterMode(false);
    };
    timer.onDone = function(record) {
      window.app.view.setTheaterMode(false);
      console.log(record);
    };
    timer.onStart = function() {
      window.app.view.setMemo(null);
      window.app.view.setTheaterMode(true);
    };
    timer.setMode(window.app.Timer.MODE_BLD);
    timer.setAccuracy(window.app.Timer.ACCURACY_CENTISECONDS);
  };
  
  $(function() {
    window.app.home = new Home();
  });
  
})();