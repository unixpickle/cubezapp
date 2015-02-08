(function() {
  
  function Flow() {
    this.microwave = new window.app.Microwave();
    this.timer = new window.app.Timer();
    this.times = new window.app.Times($('#times'));
    this.puzzles = new window.app.Puzzles();
    this.stats = new window.app.Stats();
    
    // Setup puzzles.
    this.puzzles.onChoose = this.changePuzzle.bind(this);
    
    // Setup times.
    this.times.onDelete = this.deleteSolve.bind(this);
    
    // Setup timer.
    this.timer.onChange = this.timerChanged.bind(this);
    this.timer.onStart = this.start.bind(this);
    this.timer.onStop = this.stop.bind(this);
    this.timer.enable();
    
    // Setup store events.
    window.app.store.onPuzzleChanged = this.puzzleChanged.bind(this);
    window.app.store.onSolvesChanged = this.solvesChanged.bind(this);
    window.app.store.onStatsComputed = this.updateStats.bind(this);
    
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
  }
  
  Flow.prototype.changePuzzle = function(puzzle) {
    window.app.store.switchPuzzle(puzzle.id);
    this.puzzles.update();
    this.times.reload();
    this.microwave.show(0);
  };
  
  Flow.prototype.deleteSolve = function(solve) {
    this.times.deleteSolve(solve.id);
    window.app.store.deleteSolve(solve.id);
  };
  
  Flow.prototype.puzzleChanged = function() {
    this.puzzles.update();
  };
  
  Flow.prototype.solvesChanged = function() {
    this.times.reload();
  };
  
  Flow.prototype.showScramble = function() {
    $('#temp-scramble').text(window.app.scramble('3x3x3', 'moves'));
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