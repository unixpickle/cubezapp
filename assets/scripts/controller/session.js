(function() {
  
  function Session() {
    this.microwave = new window.app.Microwave();
    this.times = new window.app.Times($('#session-times'));
    this.stats = new window.app.SessionStats();
    
    $('#temp-scramble').text(window.app.scramble());
    
    window.app.timer.onChange = function(time) {
      this.microwave.show(time);
    }.bind(this);
    
    window.app.timer.onStop = function(time) {
      this.microwave.show(time);
      var solve = window.app.solveFromTime(time);
      solve.scramble = $('#temp-scramble').text();
      this.times.add(solve);
      window.app.store.addSolve(solve);
      this.stats.update();
      $('#temp-scramble').text(window.app.scramble());
    }.bind(this);
    
    this.times.onDelete = function(idx) {
      var solves = window.app.store.getActiveSession().solves;
      if (idx < 0 || idx >= solves.length) {
        // This "could" happen in some sort of race condition, I suppose.
        return;
      }
      window.app.store.deleteSolve(solves[solves.length - (idx+1)].id);
      this.stats.update();
    }.bind(this);
    
    this.times.onSelect = function(idx) {
      if (idx < 0) {
        $('#footer-header').text('');
        return;
      }
      var solves = window.app.store.getActiveSession().solves;
      var scramble = solves[solves.length - (idx+1)].scramble
      $('#footer-header').text(scramble);
    }
    
    this.update();
    window.app.store.onSessionChanged = this.update.bind(this);
  }
  
  Session.prototype.update = function() {
    this.microwave.disable();
    this.stats.update();
    window.app.timer.enable();
    var solves = window.app.store.getActiveSession().solves;
    this.times.deleteAll();
    for (var i = 0, len = solves.length; i < len; ++i) {
      this.times.add(solves[i]);
    }
  };
  
  $(function() {
    window.app.session = new Session();
  });
  
})();