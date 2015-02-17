(function() {
  
  function Flow() {
    this.microwave = new window.app.Microwave();
    this.timer = new window.app.Timer();
    this.times = new window.app.Times($('#times'));
    this.puzzles = new window.app.Puzzles();
    this.stats = new window.app.Stats();
    this.footer = new window.app.Footer();
    
    // Setup puzzles.
    this.puzzles.onAdd = this.addPuzzle.bind(this);
    this.puzzles.onChoose = this.changePuzzle.bind(this);
    this.puzzles.onDelete = this.deletePuzzle.bind(this);
    
    // Setup times.
    this.times.onDelete = this.deleteSolve.bind(this);
    
    // Setup timer.
    this.timer.onChange = this.timerChanged.bind(this);
    this.timer.onStart = this.start.bind(this);
    this.timer.onStop = this.stop.bind(this);
    this.timer.enable();
    
    // Setup store events.
    window.app.store.onPuzzleChanged = this.puzzleChanged.bind(this);
    window.app.store.onPuzzlesChanged = this.puzzlesChanged.bind(this);
    window.app.store.onSolvesChanged = this.solvesChanged.bind(this);
    window.app.store.onStatsComputed = this.updateStats.bind(this);
    
    // Setup settings.
    this.footer.onIconChanged = this.changeIcon.bind(this);
    this.footer.onNameChanged = this.changeName.bind(this);
    
    // Setup microwave.
    this.microwave.disable();
    
    // Temporary scramble setup.
    this.showScramble();
    this.times.onSelect = function(solve) {
      $('#temp-last-scramble').text(solve.scramble);
    };
    this.times.onDeselect = function() {
      $('#temp-last-scramble').text('');
    };
    
    this.footer.updateSettings();
  }
  
  Flow.prototype.addPuzzle = function(info) {
    window.app.store.addPuzzle(info, function() {
      // TODO: here, handle error
      this.puzzles.update();
      this.times.reload();
      this.microwave.show(0);
      this.footer.updateSettings();
      $('#temp-last-scramble').text('');
    }.bind(this));
  }
  
  Flow.prototype.changeIcon = function(newIcon) {
    window.app.store.changePuzzle({icon: newIcon}, function() {
      // TODO: here, handle error
      this.puzzles.update();
      this.footer.updateSettings();
    }.bind(this));
  }
  
  Flow.prototype.changeName = function(newName) {
    window.app.store.changePuzzle({name: newName}, function() {
      // TODO: here, handle error
      this.puzzles.update();
      this.footer.updateSettings();
    }.bind(this));
  }
  
  Flow.prototype.changePuzzle = function(puzzle) {
    window.app.store.switchPuzzle(puzzle.id, function() {
      // TODO: here, handle error
      this.puzzles.update();
      this.times.reload();
      this.microwave.show(0);
      this.footer.updateSettings();
      this.showScramble();
      $('#temp-last-scramble').text('');
    }.bind(this));
  };
  
  Flow.prototype.deletePuzzle = function(id) {
    window.app.store.deletePuzzle(id, function() {
      // TODO: here, handle error
      this.puzzlesChanged();
    }.bind(this));
  };
  
  Flow.prototype.deleteSolve = function(solve) {
    this.times.deleteSolve(solve.id);
    window.app.store.deleteSolve(solve.id);
  };
  
  Flow.prototype.puzzleChanged = function() {
    this.puzzles.update();
    this.footer.updateSettings();
  };
  
  Flow.prototype.puzzlesChanged = function() {
    this.puzzles.update();
  };
  
  Flow.prototype.solvesChanged = function() {
    this.times.reload();
    $('#temp-last-scramble').text('');
  };
  
  Flow.prototype.showScramble = function() {
    var current = window.app.store.getActivePuzzle();
    if (current.scrambler === 'None') {
      $('#temp-scramble').text('');
      return;
    }
    var genFunc = window.puzzlejs.webscrambler.generateScramble;
    var a = current.scrambler;
    var b = current.scrambleType;
    var c = current.scrambleLength;
    var scramble = genFunc(a, b, c, function(scramble) {
      $('#temp-scramble').text(scramble);
    });
  };
  
  Flow.prototype.start = function() {
    this.microwave.show(0);
  };
  
  Flow.prototype.stop = function(time) {
    this.microwave.show(time);
    var solve = window.app.solveFromTime(time);
    solve.scramble = $('#temp-scramble').text();
    window.app.store.addSolve(solve);
    this.times.add(solve);
    this.showScramble();
  };
  
  Flow.prototype.timerChanged = function(time) {
    this.microwave.show(time);
  };
  
  Flow.prototype.updateStats = function(stats) {
    this.stats.update(stats);
  };
  
  $(function() {
    window.app.flow = new Flow();
  });
  
})();