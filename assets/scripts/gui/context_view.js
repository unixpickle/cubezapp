(function() {
  
  function ContextView() {
    this.microwave = new window.app.Microwave();
    this.times = new window.app.TimesList();
    this.sessionStats = new window.app.SessionStats();
    
    window.app.timer.onchange = function(solve) {
      this.microwave.show(solve);
    }.bind(this);
    
    window.app.timer.onstop = function(solve) {
      this.microwave.show(solve);
      this.times.add(solve);
      window.app.context.currentSession().add(solve);
      window.app.context.save();
    }.bind(this);
    
    this.update();
    window.app.context.addListener(this.update.bind(this));
  }
  
  ContextView.prototype.update = function() {
    this.microwave.disable();
    window.app.timer.enable();
    var solves = window.app.context.currentSession().solves;
    this.times.deleteAll();
    for (var i = 0, len = solves.length; i < len; ++i) {
      this.times.add(solves[i]);
    }
  };
  
  $(function() {
    window.app.contextView = new ContextView();
  });
  
})();