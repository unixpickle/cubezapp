(function() {
  
  function Session() {
    this.microwave = new window.app.Microwave();
    this.times = new window.app.Times($('#session-times'));
    this.stats = new window.app.SessionStats();
    
    window.app.timer.onChange = function(time) {
      this.microwave.show(time);
    }.bind(this);
    
    window.app.timer.onStop = function(time) {
      this.microwave.show(time);
      var solve = window.app.solveFromTime(time);
      this.times.add(solve);
      window.app.store.addSolve(solve);
    }.bind(this);
    
    this.update();
    window.app.store.onSessionChanged = this.update.bind(this);
  }
  
  Session.prototype.update = function() {
    this.microwave.disable();
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